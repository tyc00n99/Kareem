// Grown-ups, children and classes. They are kept on this device, and also in the grown-up's
// online account when they have one (see cloud.ts). On the device, the grown-up area is
// protected by a 4-digit PIN that never leaves the device.
import { load, save } from './storage';
import { queueChild, queueClass, queueRemoveChild, queueRemoveClass } from './sync-queue';
import type { Settings } from './settings';

export type Role = 'parent' | 'teacher';
export type GrownUp = { name: string; role: Role; pinHash: string };

/** Things a grown-up can set for one child. They are applied when that child starts learning. */
export type ChildProfile = Partial<Pick<Settings, 'sound' | 'speechRate' | 'textSize' | 'dim' | 'calm' | 'motion' | 'highContrast'>> & {
  /** Short notes on what helps, e.g. "light-sensitive", "prefers quiet". */
  tags?: string[];
  notes?: string;
  /** Lessons a grown-up picked. They come first on the child's First / Then schedule. */
  assigned?: string[];
};

export type Child = {
  id: string;
  name: string;
  avatar: string;
  classId?: string;
  profile: ChildProfile;
  added: string;
  /** Saved in the online account. */
  cloud?: boolean;
  /** Added by another grown-up (a teacher seeing a parent's child). Only that grown-up can remove them. */
  notMine?: boolean;
};
export type Klass = {
  id: string;
  name: string;
  cloud?: boolean;
  /** Parents type this code to put their child in the class. */
  code?: string;
  /** A class the grown-up's child is in, run by someone else. */
  notMine?: boolean;
};

export type People = { grownUp?: GrownUp; children: Child[]; classes: Klass[]; active?: string };

const KEY = 'deen-steps:people';
const SESSION = 'deen-steps:grown-up-in';

export const AVATARS = ['🌙', '⭐', '🐱', '🦁', '🐢', '🦋', '🌸', '🚀', '🐳', '🌳'];

export function getPeople(): People {
  return load<People>(KEY, { children: [], classes: [] });
}
export function put(p: People) {
  save(KEY, p);
}

export const newId = (): string => {
  try {
    return crypto.randomUUID();
  } catch {
    // Older browsers: a random id in the same shape.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
      const r = (Math.random() * 16) | 0;
      return (ch === 'x' ? r : (r & 3) | 8).toString(16);
    });
  }
};

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
  queueChild(c.id);
  return c;
}
export function updateChild(id: string, patch: Partial<Child>) {
  const p = getPeople();
  put({ ...p, children: p.children.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  queueChild(id);
}
export function removeChild(id: string) {
  const p = getPeople();
  const child = p.children.find((c) => c.id === id);
  put({ ...p, children: p.children.filter((c) => c.id !== id), active: p.active === id ? undefined : p.active });
  // Online, a teacher can't delete a parent's child: the child just leaves the teacher's class (see cloud.ts).
  if (child) queueRemoveChild(id);
}
export function getChild(id: string): Child | undefined {
  return getPeople().children.find((c) => c.id === id);
}

export function addClass(name: string): Klass {
  const k: Klass = { id: newId(), name: name.trim() };
  const p = getPeople();
  put({ ...p, classes: [...p.classes, k] });
  queueClass(k.id);
  return k;
}
export function removeClass(id: string) {
  const p = getPeople();
  put({
    ...p,
    classes: p.classes.filter((k) => k.id !== id),
    children: p.children.map((c) => (c.classId === id ? { ...c, classId: undefined } : c)),
  });
  queueRemoveClass(id);
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
