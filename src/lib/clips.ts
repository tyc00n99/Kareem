// Recorded voice clips. Files live in public/content/audio and are listed in
// src/audio-files.json at build time (npm run build / npm run dev).
//
//   <topic>/<NN>.mp3     the English sentence or question on screen NN
//   arabic/<slug>.mp3    an Arabic phrase, best recorded by a real person
//   common/<name>.mp3    short phrases used everywhere ("Yes. That is right.")

import list from '../audio-files.json';

const have = new Set<string>(list.files);
const url = (f: string) => (have.has(f) ? `/content/audio/${f}` : undefined);

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** The clip for screen `index` (from 0) of a topic, if one was made. */
export function screenClip(topicId: string, index: number): string | undefined {
  return url(`${topicId}/${String(index + 1).padStart(2, '0')}.mp3`);
}

/** The clip for an Arabic phrase, by its English-letters spelling. */
export function arabicClip(say: string): string | undefined {
  return url(`arabic/${slug(say)}.mp3`);
}

const COMMON: Record<string, string> = {
  'Yes. That is right.': 'common/yes-right.mp3',
  'Not yet. Try another one.': 'common/not-yet.mp3',
  "Let's look again.": 'common/look-again.mp3',
  'Yes. That is the right order.': 'common/right-order.mp3',
};

/** A clip for a common phrase, if one was made. */
export function commonClip(text: string): string | undefined {
  const f = COMMON[text.trim()];
  return f ? url(f) : undefined;
}
