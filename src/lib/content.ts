// Lesson content lives in /content/topics/*.json so non-coders can edit it.
// See CONTENT.md for the format.

export type Picture = {
  /** Path under /public, e.g. "/content/images/wudu/hands.jpg" */
  src?: string;
  /** Used when there is no image file yet. */
  emoji?: string;
  /** Plain description of the picture, read by screen readers. Required. */
  alt: string;
};

export type Arabic = {
  /** Arabic script, shown large. */
  text: string;
  /** How to say it, in English letters. */
  say: string;
};

export type LearnScreen = {
  type: 'learn';
  /** One short sentence. One idea. */
  text: string;
  picture: Picture;
  /** Optional different picture for adult learners. */
  adultPicture?: Picture;
  arabic?: Arabic;
  /** Optional recorded audio, e.g. "/content/audio/wudu/01.mp3". Without it the device reads the text aloud. */
  audio?: string;
};

export type Answer = {
  label: string;
  picture: Picture;
  adultPicture?: Picture;
  correct?: boolean;
};

export type CheckScreen = {
  type: 'check';
  question: string;
  answers: Answer[];
  /** Number of the learn screen to show again after a wrong answer (counting from 1). */
  showAgain: number;
  audio?: string;
};

export type Screen = LearnScreen | CheckScreen;

export type Topic = {
  id: string;
  title: string;
  /** One short line shown on the home screen. */
  summary: string;
  picture: Picture;
  adultPicture?: Picture;
  /** Order on the home screen, smallest first. */
  order: number;
  /** "draft" until a scholar and an easy-read reviewer have checked it. */
  status: 'draft' | 'reviewed';
  screens: Screen[];
};

const modules = import.meta.glob<Topic>('../../content/topics/*.json', {
  eager: true,
  import: 'default',
});

export const topics: Topic[] = Object.values(modules).sort((a, b) => a.order - b.order);

export function getTopic(id: string): Topic | undefined {
  return topics.find((t) => t.id === id);
}
