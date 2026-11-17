// Sound only ever plays when the learner taps something. Nothing autoplays.
//
// While a sentence is spoken we report which word is being said (as a character
// index into the text), so the screen can light that word up. The browser's
// speech engine tells us word boundaries on most devices; where it does not, or
// for recorded audio, we estimate from word lengths.

import { commonClip } from './clips';

let current: HTMLAudioElement | null = null;
let timer: number | null = null;
let session = 0;

export type PlayOptions = {
  text: string;
  audio?: string;
  rate: 'slow' | 'normal';
  /** Called with the character index of the word now being said. */
  onWord?: (charIndex: number) => void;
  /** Called once when the sound ends or is stopped. */
  onEnd?: () => void;
  /** 'ar' speaks the text with an Arabic voice when the device has one. */
  lang?: 'ar';
};

/**
 * Play two parts one after the other, e.g. the English sentence and then the
 * Arabic phrase. Word positions from the second part are moved by `offset`.
 */
export function playTwo(first: PlayOptions, second: PlayOptions & { offset: number }): void {
  playSound({
    ...first,
    onEnd: () => {
      // Stopped early (Back, Next, another sound): do not go on to the second part.
      if (stoppedByUser) return first.onEnd?.();
      const mine = session;
      window.setTimeout(() => {
        if (mine !== session) return;
        const shift = second.onWord;
        playSound({ ...second, onWord: shift && ((i) => shift(i + second.offset)), onEnd: second.onEnd ?? first.onEnd });
      }, 250);
    },
  });
}
let stoppedByUser = false;

let pendingEnd: (() => void) | undefined;

// ── Choosing a voice ──
// Browsers ship many voices; the first one is often the flattest. We rank them
// and pick the most natural English voice, unless a grown-up chose one.

let chosenVoice = '';
export function setVoicePref(uri: string): void {
  chosenVoice = uri;
}

const NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|junior|ralph|fred|kathy|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley/i;

function score(v: SpeechSynthesisVoice): number {
  const n = v.name;
  let s = 0;
  if (/^en[-_](GB|IE|ZA|AU|IN)/i.test(v.lang)) s += 3;
  else if (/^en/i.test(v.lang)) s += 2;
  else return -100;
  if (/natural|neural|premium|enhanced|wavenet|online/i.test(n)) s += 10;
  if (/google/i.test(n)) s += 6;
  if (/siri|samantha|serena|karen|moira|tessa|daniel|libby|sonia|aria|jenny|ava|zoe|martha|stephanie|catherine|arthur|kate|oliver/i.test(n)) s += 5;
  if (/microsoft (david|zira|mark|hazel|george|susan)(?! .*natural)/i.test(n)) s -= 3;
  if (/espeak|compact/i.test(n)) s -= 8;
  if (NOVELTY.test(n)) s -= 50;
  if (v.localService) s += 1; // works offline
  return s;
}

/** English voices on this device, best first. */
export function goodVoices(): SpeechSynthesisVoice[] {
  if (!canSpeak()) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((v) => score(v) > -10)
    .sort((a, b) => score(b) - score(a));
}

function arabicVoice(): SpeechSynthesisVoice | undefined {
  if (!canSpeak()) return undefined;
  const ar = window.speechSynthesis.getVoices().filter((v) => /^ar/i.test(v.lang));
  return ar.find((v) => /natural|neural|premium|enhanced|google|online|maged|laila|majed|tarik|hamed|zariyah/i.test(v.name)) ?? ar[0];
}

/** True when this device can say Arabic words in an Arabic voice. */
export function hasArabicVoice(): boolean {
  return !!arabicVoice();
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  const all = window.speechSynthesis.getVoices();
  return all.find((v) => v.voiceURI === chosenVoice) ?? goodVoices()[0];
}

/** Voices load late on some browsers. Call back when they are ready. */
export function onVoices(cb: () => void): () => void {
  if (!canSpeak()) return () => {};
  window.speechSynthesis.addEventListener('voiceschanged', cb);
  return () => window.speechSynthesis.removeEventListener('voiceschanged', cb);
}

export function stopSound(): void {
  stoppedByUser = !!pendingEnd;
  session++;
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
  if (current) {
    current.pause();
    current = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  const end = pendingEnd;
  pendingEnd = undefined;
  end?.();
}

/** Start offsets of each word in the text. */
export function wordStarts(text: string): number[] {
  return [...text.matchAll(/\S+/g)].map((m) => m.index ?? 0);
}

/** Rough share of speaking time for each word: longer words take longer, pauses after punctuation. */
function weights(text: string): number[] {
  return [...text.matchAll(/\S+/g)].map((m) => {
    const w = m[0];
    return 2 + w.replace(/[^\p{L}\p{N}]/gu, '').length + (/[.,!?:;]$/.test(w) ? 3 : 0);
  });
}

function estimate(text: string, totalMs: number, mine: number, onWord: (i: number) => void, onDone?: () => void) {
  const starts = wordStarts(text);
  const ws = weights(text);
  const sum = ws.reduce((a, b) => a + b, 0) || 1;
  const times: number[] = [];
  let acc = 0;
  for (const w of ws) {
    times.push((acc / sum) * totalMs);
    acc += w;
  }
  const t0 = performance.now();
  let last = -1;
  timer = window.setInterval(() => {
    if (mine !== session) return;
    const t = performance.now() - t0;
    let k = 0;
    while (k + 1 < times.length && times[k + 1] <= t) k++;
    if (k !== last) {
      last = k;
      onWord(starts[k]);
    }
    if (t >= totalMs && onDone) onDone();
  }, 50);
}

function finish(mine: number) {
  if (mine !== session) return;
  stoppedByUser = false;
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
  current = null;
  const end = pendingEnd;
  pendingEnd = undefined;
  end?.();
}

export function playSound(opts: PlayOptions): void {
  stopSound();
  const mine = session;
  pendingEnd = opts.onEnd;
  const file = opts.audio ?? commonClip(opts.text);
  if (file) {
    const a = new Audio(file);
    current = a;
    a.onended = () => finish(mine);
    a.onplaying = () => {
      if (opts.onWord && Number.isFinite(a.duration)) estimate(opts.text, a.duration * 1000, mine, opts.onWord);
    };
    a.play().catch(() => {
      if (mine === session) speak(opts, mine);
    });
    return;
  }
  speak(opts, mine);
}

function speak(opts: PlayOptions, mine: number): void {
  if (!('speechSynthesis' in window)) return finish(mine);
  const u = new SpeechSynthesisUtterance(opts.text);
  const ar = opts.lang === 'ar' ? arabicVoice() : undefined;
  const voice = ar ?? pickVoice();
  try {
    if (voice) u.voice = voice;
  } catch {
    /* keep the default voice */
  }
  u.lang = voice?.lang ?? 'en-GB';
  // A little slower and warmer than the default sounds more like a teacher.
  u.rate = (opts.rate === 'slow' ? 0.82 : 0.95) * (ar ? 0.85 : 1);
  u.pitch = 1.03;
  let gotBoundary = false;
  u.onboundary = (e) => {
    if (mine !== session || e.name !== 'word') return;
    if (!gotBoundary) {
      gotBoundary = true;
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    }
    opts.onWord?.(e.charIndex);
  };
  u.onstart = () => {
    if (mine !== session || !opts.onWord) return;
    opts.onWord(0);
    // Some voices never send word boundaries. Fall back to an estimate after a moment.
    window.setTimeout(() => {
      if (mine !== session || gotBoundary || !opts.onWord) return;
      const msPerUnit = opts.rate === 'slow' ? 70 : 56;
      const units = weights(opts.text).reduce((a, b) => a + b, 0);
      estimate(opts.text, units * msPerUnit, mine, opts.onWord);
    }, 350);
  };
  u.onend = () => finish(mine);
  u.onerror = () => finish(mine);
  window.speechSynthesis.speak(u);
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
