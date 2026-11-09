// Sound only ever plays when the learner taps a button. Nothing autoplays.

let current: HTMLAudioElement | null = null;

export function stopSound(): void {
  if (current) {
    current.pause();
    current = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

export function playSound(opts: { text: string; audio?: string; rate: 'slow' | 'normal' }): void {
  stopSound();
  if (opts.audio) {
    current = new Audio(opts.audio);
    current.play().catch(() => speak(opts.text, opts.rate));
    return;
  }
  speak(opts.text, opts.rate);
}

function speak(text: string, rate: 'slow' | 'normal'): void {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate === 'slow' ? 0.8 : 1;
  u.lang = 'en-GB';
  window.speechSynthesis.speak(u);
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
