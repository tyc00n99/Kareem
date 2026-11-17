// Learning records, kept on this device only. Each child on the device has their own;
// "guest" is used when nobody has picked who is learning.
import { load, save } from './storage';
import { activeChildId } from './people';

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

type Store = Record<string, TopicRecord>;

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
