import { load, save } from './storage';

const KEY = 'deen-steps:progress';

type Progress = { finished: Record<string, string> };

export function getFinished(): Record<string, string> {
  return load<Progress>(KEY, { finished: {} }).finished;
}

export function markFinished(topicId: string): void {
  const finished = { ...getFinished(), [topicId]: new Date().toISOString() };
  save(KEY, { finished });
}
