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
  /** Optional sound chunks for the flip card, e.g. ["As", "sa", "laa", "mu", "a", "lay", "kum"]. */
  chunks?: string[];
  /** Optional plain meaning shown on the back of the flip card. */
  meaning?: string;
};

/** The two recurring characters. A screen with a speaker shows the sentence in their speech bubble. */
export type Speaker = 'kareem' | 'noor';

export type LearnScreen = {
  type: 'learn';
  /** One short sentence. One idea. */
  text: string;
  picture: Picture;
  /** Optional different picture for adult learners. */
  adultPicture?: Picture;
  arabic?: Arabic;
  /** Optional: Kareem or Noor says the sentence in a speech bubble. */
  speaker?: Speaker;
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

export type OrderItem = {
  label: string;
  picture?: Picture;
  speaker?: Speaker;
};

/** The learner taps the items in the right order. No score; a wrong tap just says "not yet". */
export type OrderScreen = {
  type: 'order';
  question: string;
  /** Items in the right order. They are shown mixed up. */
  items: OrderItem[];
  audio?: string;
};

export type Screen = LearnScreen | CheckScreen | OrderScreen;

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
  /** The learning world this topic belongs to (see content/worlds). */
  world?: string;
  /** Optional sub-heading inside the world, e.g. "Daily living". */
  group?: string;
  /** After each picture, ask "Which picture shows this step?" (world lessons). */
  pickStep?: boolean;
};

/** One lesson inside a world file. It becomes a topic with the world's id. */
export type WorldLesson = {
  id: string;
  title: string;
  emoji: string;
  group?: string;
  status: 'draft' | 'reviewed';
  screens: Screen[];
};

/** A learning world: a big area on the map, with many short lessons. */
export type World = {
  id: string;
  title: string;
  summary: string;
  order: number;
  picture: Picture;
  lessons: WorldLesson[];
};

const modules = import.meta.glob<Topic>('../../content/topics/*.json', {
  eager: true,
  import: 'default',
});

/** The hand-made topics. They come first: on the home schedule and at the top of their world. */
export const topics: Topic[] = Object.values(modules).sort((a, b) => a.order - b.order);

const worldModules = import.meta.glob<World>('../../content/worlds/*.json', {
  eager: true,
  import: 'default',
});

export const worlds: World[] = Object.values(worldModules).sort((a, b) => a.order - b.order);

/** Every world lesson as a topic, so the same lesson screens and progress records work for all of them. */
export const worldTopics: Topic[] = worlds.flatMap((w) =>
  w.lessons.map((l, i) => ({
    id: l.id,
    title: l.title,
    summary: w.title,
    picture: { emoji: l.emoji, alt: l.title },
    order: w.order * 1000 + i,
    status: l.status,
    screens: l.screens,
    world: w.id,
    group: l.group,
    pickStep: true,
  })),
);

/** Hand-made topics and every world lesson. */
export const allTopics: Topic[] = [...topics, ...worldTopics];
const byId = new Map(allTopics.map((t) => [t.id, t]));

export function getTopic(id: string): Topic | undefined {
  return byId.get(id);
}

export function getWorld(id: string): World | undefined {
  return worlds.find((w) => w.id === id);
}

/** All topics in a world: the hand-made ones first, then the world's own lessons. */
export function topicsIn(worldId: string): Topic[] {
  return allTopics.filter((t) => t.world === worldId);
}

/** The lesson after this one in the same world, if there is one. */
export function nextInWorld(topic: Topic): Topic | undefined {
  if (!topic.world) return undefined;
  const list = topicsIn(topic.world);
  const i = list.findIndex((t) => t.id === topic.id);
  return i >= 0 ? list[i + 1] : undefined;
}
