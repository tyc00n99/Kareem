// Learning records, kept on this device only. Each child on the device has their own;
// "guest" is used when nobody has picked who is learning.
import { load, save } from './storage';
import { activeChildId } from './people';
import { queueRecord } from './sync-queue';

export type TopicRecord = {
  /** How many times the topic was started from its first screen. */
  opened: number;
  lastOpened?: string;
  /** Furthest screen reached (counting from 1). */
  furthest: number;
  /** How many times the topic was finished. */
  finished: number;
  lastFinished?: string;
  /** Question screens answered right on the first try, and ones that needed another go. */
  firstTry: number;
  tryAgain: number;
  /** Whether the most recent finish had every question right on the first try. */
  lastFinishClean?: boolean;
};

export type Store = Record<string, TopicRecord>;

const OLD_KEY = 'deen-steps:progress';
const keyFor = (childId: string) => `deen-steps:records:${childId}`;
const empty = (): TopicRecord => ({ opened: 0, furthest: 0, finished: 0, firstTry: 0, tryAgain: 0 });

export function getRecords(childId: string = activeChildId()): Store {
  const store = load<Store>(keyFor(childId), {});
  // Bring over finishes saved by the first version of the app.
  if (childId === 'guest') {
    const old = load<{ finished: Record<string, string> }>(OLD_KEY, { finished: {} }).finished;
    for (const [id, when] of Object.entries(old)) {
      if (!store[id]) store[id] = { ...empty(), finished: 1, lastFinished: when, opened: 1, lastOpened: when };
    }
  }
  return store;
}

function change(topicId: string, fn: (r: TopicRecord) => TopicRecord) {
  const id = activeChildId();
  const store = getRecords(id);
  store[topicId] = fn({ ...empty(), ...store[topicId] });
  save(keyFor(id), store);
  if (id !== 'guest') queueRecord(id, topicId);
}

/** Replace a child's records (used when they come back from the online account). */
export function putRecords(childId: string, store: Store) {
  save(keyFor(childId), store);
}

/** Put two records of the same lesson together, e.g. from two devices. Nothing is lost. */
export function mergeRecord(a: TopicRecord | undefined, b: TopicRecord | undefined): TopicRecord {
  if (!a) return { ...empty(), ...b };
  if (!b) return { ...empty(), ...a };
  const later = (x?: string, y?: string) => ((x ?? '') > (y ?? '') ? x : y);
  const lastFinished = later(a.lastFinished, b.lastFinished);
  return {
    opened: Math.max(a.opened, b.opened),
    lastOpened: later(a.lastOpened, b.lastOpened),
    furthest: Math.max(a.furthest, b.furthest),
    finished: Math.max(a.finished, b.finished),
    lastFinished,
    firstTry: Math.max(a.firstTry, b.firstTry),
    tryAgain: Math.max(a.tryAgain, b.tryAgain),
    lastFinishClean: lastFinished === a.lastFinished ? a.lastFinishClean : b.lastFinishClean,
  };
}

const now = () => new Date().toISOString();

export const recordOpen = (topicId: string) =>
  change(topicId, (r) => ({ ...r, opened: r.opened + 1, lastOpened: now() }));
export const recordScreen = (topicId: string, screen: number) =>
  change(topicId, (r) => ({ ...r, furthest: Math.max(r.furthest, screen) }));
export const recordCheck = (topicId: string, firstTry: boolean) =>
  change(topicId, (r) => (firstTry ? { ...r, firstTry: r.firstTry + 1 } : { ...r, tryAgain: r.tryAgain + 1 }));
export const markFinished = (topicId: string, clean = true) =>
  change(topicId, (r) => ({ ...r, finished: r.finished + 1, lastFinished: now(), lastFinishClean: clean }));

/** Finished topics for the child learning now, as topic id → date. */
export function getFinished(childId?: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [id, r] of Object.entries(getRecords(childId))) if (r.finished > 0) out[id] = r.lastFinished ?? '';
  return out;
}

export type Status = 'new' | 'learning' | 'needs-help' | 'mastered';

/** A gentle, plain summary for grown-ups. The child never sees it. */
export function statusOf(r?: TopicRecord): Status {
  if (!r || (r.opened === 0 && r.finished === 0)) return 'new';
  if (r.finished >= 2 && r.lastFinishClean) return 'mastered';
  if (r.tryAgain > r.firstTry) return 'needs-help';
  return 'learning';
}

export function clearRecords(childId: string) {
  try {
    localStorage.removeItem(keyFor(childId));
  } catch {
    /* ignore */
  }
}
