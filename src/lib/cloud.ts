// The online account (Supabase). Everything still works on the device without it.
// With an account, children, classes and learning records are saved online and shared
// between the grown-up's devices, and with the teacher of the child's class.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getPeople, put, type Child, type Klass, type People, type Role } from './people';
import { getRecords, mergeRecord, putRecords, type Store, type TopicRecord } from './progress';
import { getQueue, onQueued, setQueue } from './sync-queue';

const URL_ = import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const KEY_ = (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) as
  | string
  | undefined;

let client: SupabaseClient | null = null;
function db(): SupabaseClient | null {
  if (!URL_ || !KEY_) return null;
  if (!client) client = createClient(URL_, KEY_, { auth: { storageKey: 'deen-steps:account', persistSession: true } });
  return client;
}

/** Whether this copy of the app can use accounts at all. */
export const cloudAvailable = (): boolean => !!URL_ && !!KEY_;

export type Account = { id: string; email: string; name: string; role: Role };
let account: Account | null = null;
export const getAccount = (): Account | null => account;

// --- telling screens to redraw -------------------------------------------------------------

export type SyncState = 'off' | 'syncing' | 'synced' | 'offline' | 'error';
let state: SyncState = 'off';
export const syncState = (): SyncState => state;
function setState(s: SyncState) {
  state = s;
  window.dispatchEvent(new Event('kareem:cloud'));
}

// --- signing in and out --------------------------------------------------------------------

async function loadAccount(): Promise<Account | null> {
  const sb = db();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  const user = data.session?.user;
  if (!user) {
    account = null;
    return null;
  }
  const { data: prof } = await sb.from('profiles').select('name, role').eq('id', user.id).maybeSingle();
  const meta = user.user_metadata as { name?: string; role?: Role };
  account = {
    id: user.id,
    email: user.email ?? '',
    name: prof?.name || meta.name || '',
    role: (prof?.role as Role) || meta.role || 'parent',
  };
  if (!prof) await sb.from('profiles').upsert({ id: user.id, name: account.name, role: account.role });
  return account;
}

export async function createAccount(name: string, role: Role, email: string, password: string): Promise<string | null> {
  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, role, email, password }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return body.error ?? 'Could not make the account. Please try again.';
  } catch {
    return 'You seem to be offline. Please try again when you are connected.';
  }
  return signInAccount(email, password);
}

/** Returns an error message, or null when signed in. */
export async function signInAccount(email: string, password: string): Promise<string | null> {
  const sb = db();
  if (!sb) return 'Accounts are not switched on yet.';
  const { error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) return /invalid/i.test(error.message) ? 'That email and password did not match.' : error.message;
  await loadAccount();
  await syncNow();
  return null;
}

/** Sign out of the account. Its children and classes leave this device too (they stay online). */
export async function signOutAccount() {
  const sb = db();
  const p = getPeople();
  const leaving = p.children.filter((c) => c.cloud);
  for (const c of leaving) {
    try {
      localStorage.removeItem(`deen-steps:records:${c.id}`);
    } catch {
      /* ignore */
    }
  }
  put({
    ...p,
    children: p.children.filter((c) => !c.cloud),
    classes: p.classes.filter((k) => !k.cloud),
    active: leaving.some((c) => c.id === p.active) ? undefined : p.active,
  });
  setQueue({ children: [], removedChildren: [], classes: [], removedClasses: [], records: {} });
  await sb?.auth.signOut();
  account = null;
  setState('off');
}

/** Change the grown-up's role online too. */
export async function saveRole(role: Role) {
  const sb = db();
  if (!sb || !account) return;
  account = { ...account, role };
  await sb.from('profiles').update({ role }).eq('id', account.id);
}

// --- classes for parents -------------------------------------------------------------------

/** Put a child in a teacher's class with the class code. Returns an error message or null. */
export async function joinClass(childId: string, code: string): Promise<string | null> {
  const sb = db();
  if (!sb || !account) return 'Sign in to an account first.';
  await syncNow();
  const { error } = await sb.rpc('join_class', { _child: childId, _code: code });
  if (error) return error.message.includes('code') ? 'No class has that code. Check it with the teacher.' : error.message;
  await syncNow();
  return null;
}

/** Forget a child's learning records online too. */
export async function clearRecordsOnline(childId: string) {
  const sb = db();
  if (!sb || !account) return;
  const q = getQueue();
  delete q.records[childId];
  setQueue(q);
  await sb.from('records').delete().eq('child_id', childId);
}

// --- syncing -------------------------------------------------------------------------------

type ChildRow = { id: string; owner_id: string; class_id: string | null; name: string; avatar: string; profile: Child['profile']; created_at: string };
type ClassRow = { id: string; teacher_id: string; name: string; join_code: string };

const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

let running: Promise<void> | null = null;
let again = false;

/** Send waiting changes, then bring the latest from the account. Safe to call often. */
export function syncNow(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    try {
      do {
        again = false;
        await syncOnce();
      } while (again);
    } finally {
      running = null;
    }
  })();
  return running;
}

let timer: ReturnType<typeof setTimeout> | undefined;
function syncSoon() {
  if (!account) return;
  clearTimeout(timer);
  timer = setTimeout(() => void syncNow(), 1500);
}

async function syncOnce() {
  const sb = db();
  if (!sb || !account) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    setState('offline');
    return;
  }
  setState('syncing');
  try {
    await uploadDeviceOnly(sb);
    await pushQueue(sb);
    await pull(sb);
    setState('synced');
  } catch (e) {
    console.warn('sync failed', e);
    setState(navigator.onLine === false ? 'offline' : 'error');
  }
}

/** Children and classes made before signing in (or before accounts existed) join the account. */
async function uploadDeviceOnly(sb: SupabaseClient) {
  let p = getPeople();
  const classMap: Record<string, string> = {};
  for (const k of p.classes.filter((x) => !x.cloud)) {
    const id = isUuid(k.id) ? k.id : crypto.randomUUID();
    const { error } = await sb.from('classes').upsert({ id, name: k.name });
    if (error) throw error;
    classMap[k.id] = id;
  }
  const childMap: Record<string, string> = {};
  for (const c of p.children.filter((x) => !x.cloud)) {
    const id = isUuid(c.id) ? c.id : crypto.randomUUID();
    const classId = c.classId ? (classMap[c.classId] ?? c.classId) : null;
    const ownClass = classId && (classMap[c.classId!] || p.classes.some((k) => k.id === classId && k.cloud && !k.notMine));
    const { error } = await sb.from('children').upsert({
      id,
      name: c.name,
      avatar: c.avatar,
      profile: c.profile,
      class_id: ownClass ? classId : null,
      created_at: c.added,
    });
    if (error) throw error;
    childMap[c.id] = id;
    // Bring this child's learning records along under the new id.
    const recs = getRecords(c.id);
    if (Object.keys(recs).length) {
      await upsertRecords(sb, id, recs);
      if (id !== c.id) {
        putRecords(id, recs);
        try {
          localStorage.removeItem(`deen-steps:records:${c.id}`);
        } catch {
          /* ignore */
        }
      }
    }
  }
  if (!Object.keys(classMap).length && !Object.keys(childMap).length) return;
  p = getPeople();
  put({
    ...p,
    classes: p.classes.map((k) => (classMap[k.id] ? { ...k, id: classMap[k.id], cloud: true } : k)),
    children: p.children.map((c) =>
      childMap[c.id]
        ? { ...c, id: childMap[c.id], cloud: true, classId: c.classId ? (classMap[c.classId] ?? c.classId) : undefined }
        : c,
    ),
    active: p.active && childMap[p.active] ? childMap[p.active] : p.active,
  });
  const q = getQueue();
  for (const [from, to] of Object.entries(childMap)) {
    if (q.records[from]) {
      q.records[to] = q.records[from];
      delete q.records[from];
    }
    q.children = q.children.filter((x) => x !== from);
  }
  q.classes = q.classes.filter((x) => !classMap[x]);
  setQueue(q);
}

async function upsertRecords(sb: SupabaseClient, childId: string, recs: Store) {
  const rows = Object.entries(recs).map(([topic_id, data]) => ({ child_id: childId, topic_id, data, updated_at: new Date().toISOString() }));
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await sb.from('records').upsert(rows.slice(i, i + 200));
    if (error) throw error;
  }
}

async function pushQueue(sb: SupabaseClient) {
  const q = getQueue();
  const p = getPeople();
  for (const id of q.removedClasses) {
    const { error } = await sb.from('classes').delete().eq('id', id);
    if (error) throw error;
  }
  for (const id of q.classes) {
    const k = p.classes.find((x) => x.id === id);
    if (!k || k.notMine) continue;
    const { error } = await sb.from('classes').upsert({ id: k.id, name: k.name });
    if (error) throw error;
  }
  for (const id of q.removedChildren) {
    const { error } = await sb.from('children').delete().eq('id', id);
    if (error) throw error;
    // A teacher can't delete a parent's child. Then the child just leaves the class.
    await sb.from('children').update({ class_id: null }).eq('id', id);
  }
  for (const id of q.children) {
    const c = p.children.find((x) => x.id === id);
    if (!c) continue;
    const { error } = await sb
      .from('children')
      .update({ name: c.name, avatar: c.avatar, profile: c.profile, class_id: c.classId ?? null, updated_at: new Date().toISOString() })
      .eq('id', c.id);
    if (error) throw error;
  }
  for (const [childId, topics] of Object.entries(q.records)) {
    if (!p.children.some((c) => c.id === childId && c.cloud)) continue;
    const recs = getRecords(childId);
    const pick: Store = {};
    for (const t of topics) if (recs[t]) pick[t] = recs[t];
    await upsertRecords(sb, childId, pick);
  }
  // Only forget what was sent; changes made meanwhile stay queued.
  const now = getQueue();
  const minus = (a: string[], b: string[]) => a.filter((x) => !b.includes(x));
  const records: Record<string, string[]> = {};
  for (const [c, ts] of Object.entries(now.records)) {
    const left = minus(ts, q.records[c] ?? []);
    if (left.length && p.children.some((x) => x.id === c)) records[c] = left;
  }
  setQueue({
    children: minus(now.children, q.children),
    removedChildren: minus(now.removedChildren, q.removedChildren),
    classes: minus(now.classes, q.classes),
    removedClasses: minus(now.removedClasses, q.removedClasses),
    records,
  });
}

async function pull(sb: SupabaseClient) {
  if (!account) return;
  const me = account.id;
  const [{ data: kids, error: e1 }, { data: own, error: e2 }, { data: theirs }] = await Promise.all([
    sb.from('children').select('id, owner_id, class_id, name, avatar, profile, created_at').order('created_at'),
    sb.from('classes').select('id, teacher_id, name, join_code').order('created_at'),
    sb.rpc('my_children_classes'),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  const ownClasses = (own ?? []) as ClassRow[];
  const otherClasses = ((theirs ?? []) as { id: string; name: string }[]).filter((k) => !ownClasses.some((o) => o.id === k.id));
  const classes: Klass[] = [
    ...ownClasses.map((k) => ({ id: k.id, name: k.name, code: k.join_code, cloud: true })),
    ...otherClasses.map((k) => ({ id: k.id, name: k.name, cloud: true, notMine: true })),
  ];
  const q = getQueue();
  const p = getPeople();
  const children: Child[] = ((kids ?? []) as ChildRow[]).map((r) => {
    // A change on this device that is still waiting to be sent wins over the online copy.
    const local = p.children.find((c) => c.id === r.id);
    if (local && q.children.includes(r.id)) return local;
    return {
      id: r.id,
      name: r.name,
      avatar: r.avatar,
      classId: r.class_id ?? undefined,
      profile: r.profile ?? {},
      added: r.created_at,
      cloud: true,
      notMine: r.owner_id !== me,
    };
  });
  const latest = getPeople();
  const next: People = {
    ...latest,
    classes: [...latest.classes.filter((k) => !k.cloud), ...classes],
    children: [...latest.children.filter((c) => !c.cloud), ...children],
  };
  if (next.active && !next.children.some((c) => c.id === next.active)) next.active = undefined;
  put(next);

  // Learning records: put the online and device copies together.
  const ids = children.map((c) => c.id);
  if (!ids.length) return;
  const rows: { child_id: string; topic_id: string; data: TopicRecord }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from('records').select('child_id, topic_id, data').in('child_id', ids).range(from, from + 999);
    if (error) throw error;
    rows.push(...((data ?? []) as typeof rows));
    if (!data || data.length < 1000) break;
  }
  for (const id of ids) {
    const local = getRecords(id);
    const merged: Store = { ...local };
    for (const r of rows) if (r.child_id === id) merged[r.topic_id] = mergeRecord(local[r.topic_id], r.data);
    putRecords(id, merged);
  }
}

// --- starting up ---------------------------------------------------------------------------

/** Called once when the app opens. */
export async function startCloud() {
  const sb = db();
  if (!sb) return;
  onQueued(syncSoon);
  window.addEventListener('online', () => void syncNow());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncNow();
  });
  try {
    if (await loadAccount()) await syncNow();
  } catch {
    setState('offline');
  }
  window.dispatchEvent(new Event('kareem:cloud'));
}
