// Changes waiting to be sent to the online account. Kept on the device so nothing is lost offline.
// This file has no imports from the rest of the app, so anything can call it.
import { load, save } from './storage';

export type Queue = {
  children: string[];
  removedChildren: string[];
  classes: string[];
  removedClasses: string[];
  /** child id → topic ids with new learning records */
  records: Record<string, string[]>;
};

const KEY = 'deen-steps:sync-queue';
const empty = (): Queue => ({ children: [], removedChildren: [], classes: [], removedClasses: [], records: {} });

export const getQueue = (): Queue => ({ ...empty(), ...load<Queue>(KEY, empty()) });
export const setQueue = (q: Queue) => save(KEY, q);
const add = (list: string[], id: string) => (list.includes(id) ? list : [...list, id]);

let listener: (() => void) | null = null;
/** cloud.ts sets this to send changes a moment after they happen. */
export function onQueued(fn: () => void) {
  listener = fn;
}

function change(fn: (q: Queue) => Queue) {
  setQueue(fn(getQueue()));
  listener?.();
}

export const queueChild = (id: string) => change((q) => ({ ...q, children: add(q.children, id) }));
export const queueRemoveChild = (id: string) =>
  change((q) => ({ ...q, children: q.children.filter((x) => x !== id), removedChildren: add(q.removedChildren, id) }));
export const queueClass = (id: string) => change((q) => ({ ...q, classes: add(q.classes, id) }));
export const queueRemoveClass = (id: string) =>
  change((q) => ({ ...q, classes: q.classes.filter((x) => x !== id), removedClasses: add(q.removedClasses, id) }));
export const queueRecord = (childId: string, topicId: string) =>
  change((q) => ({ ...q, records: { ...q.records, [childId]: add(q.records[childId] ?? [], topicId) } }));
