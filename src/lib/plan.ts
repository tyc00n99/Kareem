// A child's learning plan: set by a parent or teacher, used by the lesson screens.
// Based on ABA-informed teaching: prompting, waiting before helping, errorless learning and fading help.
import { activeChild, type ChildProfile } from './people';
import { getRecords } from './progress';
import type { Settings } from './settings';

export type Plan = {
  communication: 'speaking' | 'minimally-speaking' | 'aac' | 'sign' | 'mixed';
  learnsWith: string[];
  skill: 'beginner' | 'developing' | 'intermediate' | 'advanced';
  /** How the child answers "which picture shows this step?": pick a picture, or tap "I did it". */
  answerMode: 'both' | 'choice' | 'tap';
  /** Seconds to wait before the right picture is gently shown. 0 = never show it on its own. */
  waitSec: number;
  /** After a wrong tap, show the right picture straight away. */
  errorless: boolean;
  /** Stop showing the right picture on its own after this many clean finishes of a lesson. */
  fadeAfter: number;
  /** Always keep that help, never fade it. */
  keepHelp: boolean;
  /** Home shows only First / Then (fewer choices). */
  simpleHome: boolean;
  /** Say "Yes!" after a right answer. */
  praise: boolean;
  /** Extra buttons on the Talk board. */
  talkButtons: { emoji: string; label: string }[];
  /** Individual goals. */
  goals: { text: string; lessonId?: string }[];
};

export const DEFAULT_PLAN: Plan = {
  communication: 'mixed',
  learnsWith: ['visual'],
  skill: 'beginner',
  answerMode: 'both',
  waitSec: 8,
  errorless: true,
  fadeAfter: 2,
  keepHelp: false,
  simpleHome: false,
  praise: true,
  talkButtons: [],
  goals: [],
};

export const planOf = (profile?: ChildProfile): Plan => ({ ...DEFAULT_PLAN, ...profile?.plan });

/** The plan of the child learning now (or the default for a guest). */
export const activePlan = (): Plan => planOf(activeChild()?.profile);

/** Whether the right picture should still be shown on its own for this lesson (help fades with practice). */
export function helpFor(plan: Plan, topicId: string): boolean {
  if (plan.waitSec <= 0) return false;
  if (plan.keepHelp) return true;
  const r = getRecords()[topicId];
  return !(r && r.finished >= plan.fadeAfter && r.lastFinishClean);
}

const DEVICE_KEYS = ['sound', 'speechRate', 'textSize', 'dim', 'calm', 'motion', 'highContrast'] as const;

/** The screen and sound settings in a child's profile, to switch on when they start learning. */
export function childPrefs(profile: ChildProfile): Partial<Settings> {
  const out: Partial<Settings> = {};
  for (const k of DEVICE_KEYS) if (profile[k] !== undefined) (out as Record<string, unknown>)[k] = profile[k];
  return out;
}
