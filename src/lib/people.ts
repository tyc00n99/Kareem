// Grown-ups, children and classes, kept on this device only. There are no online accounts:
// the grown-up area is protected by a 4-digit PIN that never leaves the device.
import { load, save } from './storage';
import type { Settings } from './settings';

export type Role = 'parent' | 'teacher';
export type GrownUp = { name: string; role: Role; pinHash: string };

/** Things a grown-up can set for one child. They are applied when that child starts learning. */
export type ChildProfile = Partial<Pick<Settings, 'sound' | 'speechRate' | 'textSize' | 'dim' | 'calm' | 'motion' | 'highContrast'>> & {
  /** Short notes on what helps, e.g. "light-sensitive", "prefers quiet". */
  tags?: string[];
  notes?: string;
};

export type Child = { id: string; name: string; avatar: string; classId?: string; profile: ChildProfile; added: string };
export type Klass = { id: string; name: string };

type People = { grownUp?: GrownUp; children: Child[]; classes: Klass[]; active?: string };

const KEY = 'deen-steps:people';
const SESSION = 'deen-steps:grown-up-in';

export const AVATARS = ['🌙', '⭐', '🐱', '🦁', '🐢', '🦋', '🌸', '🚀', '🐳', '🌳'];

export function getPeople(): People {
  return load<People>(KEY, { children: [], classes: [] });
}
function put(p: People) {
  save(KEY, p);
}

const newId = () => Math.random().toString(36).slice(2, 10);

async function hash(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`kareem-learning-explorer:${pin}`);
  try {
    const buf = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Very old browsers: a simple fallback. This gate keeps little hands out; it is not bank security.
    let h = 0;
    for (const c of data) h = (h * 31 + c) | 0;
    return `x${h}`;
  }
}

export async function createGrownUp(name: string, role: Role, pin: string) {
  put({ ...getPeople(), grownUp: { name: name.trim(), role, pinHash: await hash(pin) } });
  signIn();
}
export async function checkPin(pin: string): Promise<boolean> {
  const g = getPeople().grownUp;
  return !!g && g.pinHash === (await hash(pin));
}
export function setRole(role: Role) {
  const p = getPeople();
  if (p.grownUp) put({ ...p, grownUp: { ...p.grownUp, role } });
}
/** Forget the grown-up (name and PIN). Children and their learning stay. */
export function forgetGrownUp() {
  const p = getPeople();
  put({ ...p, grownUp: undefined });
  signOut();
}

export function isSignedIn(): boolean {
  try {
    return sessionStorage.getItem(SESSION) === '1' && !!getPeople().grownUp;
  } catch {
    return false;
  }
}
export function signIn() {
  try {
    sessionStorage.setItem(SESSION, '1');
  } catch {
    /* ignore */
  }
}
export function signOut() {
  try {
    sessionStorage.removeItem(SESSION);
  } catch {
    /* ignore */
  }
}

export function addChild(name: string, avatar: string, classId?: string): Child {
  const c: Child = { id: newId(), name: name.trim(), avatar, classId, profile: {}, added: new Date().toISOString() };
  const p = getPeople();
  put({ ...p, children: [...p.children, c] });
  return c;
}
export function updateChild(id: string, patch: Partial<Child>) {
  const p = getPeople();
  put({ ...p, children: p.children.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
}
export function removeChild(id: string) {
  const p = getPeople();
  put({ ...p, children: p.children.filter((c) => c.id !== id), active: p.active === id ? undefined : p.active });
}
export function getChild(id: string): Child | undefined {
  return getPeople().children.find((c) => c.id === id);
}

export function addClass(name: string): Klass {
  const k = { id: newId(), name: name.trim() };
  const p = getPeople();
  put({ ...p, classes: [...p.classes, k] });
  return k;
}
export function removeClass(id: string) {
  const p = getPeople();
  put({
    ...p,
    classes: p.classes.filter((k) => k.id !== id),
    children: p.children.map((c) => (c.classId === id ? { ...c, classId: undefined } : c)),
  });
}

/** Who is learning right now on this device. */
export function activeChildId(): string {
  const p = getPeople();
  return p.active && p.children.some((c) => c.id === p.active) ? p.active : 'guest';
}
export function activeChild(): Child | undefined {
  const id = activeChildId();
  return id === 'guest' ? undefined : getChild(id);
}
export function setActiveChild(id: string | undefined) {
  put({ ...getPeople(), active: id });
}
