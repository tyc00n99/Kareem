// Sound only ever plays when the learner taps something. Nothing autoplays.
//
// While a sentence is spoken we report which word is being said (as a character
// index into the text), so the screen can light that word up. The browser's
// speech engine tells us word boundaries on most devices; where it does not, or
// for recorded audio, we estimate from word lengths.

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
};

let pendingEnd: (() => void) | undefined;

export function stopSound(): void {
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
  if (opts.audio) {
    const a = new Audio(opts.audio);
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
  u.rate = opts.rate === 'slow' ? 0.8 : 1;
  u.lang = 'en-GB';
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
