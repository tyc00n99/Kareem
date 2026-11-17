// Interactive pieces used inside a lesson card: light-up words, speech bubbles,
// the Arabic flip card and the "put it in order" activity.

import { useMemo, useState } from 'react';
import { Pic } from './components';
import type { Arabic, OrderScreen, Speaker } from './lib/content';
import { playSound, wordStarts } from './lib/audio';
import { useSettings } from './lib/settings';

export const characters: Record<Speaker, { name: string; src: string; alt: string }> = {
  kareem: { name: 'Kareem', src: '/content/images/characters/kareem.jpg', alt: 'Kareem, a smiling boy in a blue kufi cap' },
  noor: { name: 'Noor', src: '/content/images/characters/noor.jpg', alt: 'Noor, a smiling girl in a pink hijab' },
};

const clean = (w: string) => w.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, '');

/**
 * A sentence where each word can be tapped to hear it, and the word being
 * spoken lights up. `at` is the character index being spoken in the full speech
 * string; `offset` is where this text starts inside that string.
 */
export function Words({
  text,
  at,
  offset = 0,
  className = 'sentence',
  onWord,
  lang,
  dir,
}: {
  text: string;
  at: number | null;
  offset?: number;
  className?: string;
  /** Tap a word: gets the word and its index in the full speech string. */
  onWord?: (word: string, charIndex: number) => void;
  lang?: string;
  dir?: 'rtl' | 'ltr';
}) {
  const parts = useMemo(() => {
    const starts = wordStarts(text);
    return [...text.matchAll(/\S+/g)].map((m, k) => ({
      word: m[0],
      start: offset + starts[k],
      end: k + 1 < starts.length ? offset + starts[k + 1] : offset + text.length + 1,
    }));
  }, [text, offset]);

  return (
    <p className={`words ${className}`} lang={lang} dir={dir}>
      {parts.map((p, k) => {
        const lit = at !== null && at >= p.start && at < p.end;
        return (
          <span key={k}>
            {onWord ? (
              <button
                type="button"
                className={`word${lit ? ' word-lit' : ''}`}
                onClick={() => onWord(clean(p.word) || p.word, p.start)}
              >
                {p.word}
              </button>
            ) : (
              <span className={`word${lit ? ' word-lit' : ''}`}>{p.word}</span>
            )}
            {k < parts.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </p>
  );
}

/** Kareem or Noor says something in a speech bubble. */
export function Bubble({ speaker, children, side = 'left' }: { speaker: Speaker; children: React.ReactNode; side?: 'left' | 'right' }) {
  const c = characters[speaker];
  return (
    <div className={`bubble-row bubble-${side}`}>
      <img className="avatar" src={c.src} alt={c.alt} />
      <div className="bubble">
        <span className="who">{c.name}</span>
        {children}
      </div>
    </div>
  );
}

/** Split "Assalamu alaykum" into sayable parts when the lesson does not give chunks. */
function defaultChunks(say: string): string[] {
  return say.split(/[\s-]+/).filter(Boolean);
}

/** Arabic words on a card. Turn it over to hear the word in small parts and see what it means. */
export function ArabicCard({
  arabic,
  at,
  offset,
  onWord,
}: {
  arabic: Arabic;
  at: number | null;
  offset: number;
  onWord?: (word: string, charIndex: number) => void;
}) {
  const { settings } = useSettings();
  const [turned, setTurned] = useState(false);
  const [lit, setLit] = useState<number | null>(null);
  const chunks = arabic.chunks?.length ? arabic.chunks : defaultChunks(arabic.say);

  const sayChunk = (k: number) => {
    if (!settings.sound) return;
    setLit(k);
    playSound({ text: chunks[k], rate: 'slow', onEnd: () => setLit(null) });
  };

  const sayAll = () => {
    if (!settings.sound) return;
    // Speak the parts with small pauses, lighting each one in turn.
    const text = chunks.join(', ');
    const starts: number[] = [];
    let pos = 0;
    for (const c of chunks) {
      starts.push(pos);
      pos += c.length + 2;
    }
    playSound({
      text,
      rate: 'slow',
      onWord: (i) => {
        let k = 0;
        while (k + 1 < starts.length && starts[k + 1] <= i) k++;
        setLit(k);
      },
      onEnd: () => setLit(null),
    });
  };

  return (
    <div className={`flip${turned ? ' flip-turned' : ''}`}>
      <div className="flip-inner">
        <div className="flip-face flip-front" inert={turned}>
          <span lang="ar" dir="rtl" className="arabic-text">{arabic.text}</span>
          <Words text={arabic.say} at={at} offset={offset} className="arabic-say" onWord={onWord} />
          <button type="button" className="turn" onClick={() => setTurned(true)}>
            ↻ Turn the card
          </button>
        </div>
        <div className="flip-face flip-back" inert={!turned}>
          <span className="flip-label">Say it in small parts</span>
          <div className="chunks">
            {chunks.map((c, k) => (
              <button
                key={k}
                type="button"
                className={`chunk${lit === k ? ' chunk-lit' : ''}`}
                onClick={() => sayChunk(k)}
                disabled={!settings.sound}
              >
                {c}
              </button>
            ))}
          </div>
          {settings.sound && (
            <button type="button" className="turn" onClick={sayAll}>
              🔊 Say it slowly
            </button>
          )}
          {arabic.meaning && <p className="meaning">It means: {arabic.meaning}</p>}
          <button type="button" className="turn" onClick={() => setTurned(false)}>
            ↻ Turn back
          </button>
        </div>
      </div>
    </div>
  );
}

/** A fixed mix-up so the order is never already right and never jumps around. */
function mixUp(n: number): number[] {
  if (n === 2) return [1, 0];
  const odd: number[] = [];
  const even: number[] = [];
  for (let k = 0; k < n; k++) (k % 2 ? odd : even).push(k);
  return [...odd.reverse(), ...even];
}

/** Tap the pictures in the right order. A wrong tap just says "not yet". */
export function OrderCard({ screen, onDone }: { screen: OrderScreen; onDone: () => void }) {
  const { settings } = useSettings();
  const [placed, setPlaced] = useState<number[]>([]);
  const [notYet, setNotYet] = useState<number | null>(null);
  const order = useMemo(() => mixUp(screen.items.length), [screen.items.length]);
  const done = placed.length === screen.items.length;
  const say = (text: string) => settings.sound && playSound({ text, rate: settings.speechRate });

  const tap = (k: number) => {
    if (done || placed.includes(k)) return;
    if (k === placed.length) {
      const next = [...placed, k];
      setPlaced(next);
      setNotYet(null);
      if (next.length === screen.items.length) {
        say(`${screen.items[k].label}. Yes. That is the right order.`);
        onDone();
      } else say(screen.items[k].label);
    } else {
      setNotYet(k);
      say('Not yet. Try another one.');
    }
  };

  return (
    <>
      <p className="sentence">{screen.question}</p>

      <ol className="order-slots" aria-label="Your order">
        {screen.items.map((item, k) => {
          const filled = placed[k] !== undefined;
          if (filled && item.speaker) {
            return (
              <li key={k} className="slot slot-talk">
                <Bubble speaker={item.speaker} side={k % 2 ? 'right' : 'left'}>
                  <p className="bubble-text">{item.label}</p>
                </Bubble>
              </li>
            );
          }
          return (
            <li key={k} className={`slot${filled ? ' slot-filled' : ''}`}>
              <span className="slot-num">{k + 1}</span>
              {filled ? (
                <>
                  {item.picture && <Pic picture={item.picture} size="small" />}
                  <span className="slot-label">{item.label}</span>
                </>
              ) : (
                <span className="slot-empty">?</span>
              )}
            </li>
          );
        })}
      </ol>

      {!done && (
        <div className="answers" role="group" aria-label="Pick the next one">
          {order
            .filter((k) => !placed.includes(k))
            .map((k) => {
              const item = screen.items[k];
              return (
                <button key={k} type="button" className={`answer${notYet === k ? ' answer-notyet' : ''}`} onClick={() => tap(k)}>
                  {item.picture ? (
                    <Pic picture={item.picture} size="small" />
                  ) : item.speaker ? (
                    <img className="avatar" src={characters[item.speaker].src} alt={characters[item.speaker].alt} />
                  ) : null}
                  <span>{item.label}</span>
                </button>
              );
            })}
        </div>
      )}

      <p className="kind" aria-live="polite">
        {done ? 'Yes. That is the right order.' : notYet !== null ? 'Not yet. Try another one.' : ' '}
      </p>
      {placed.length > 0 && !done && (
        <button type="button" className="btn btn-plain" onClick={() => { setPlaced([]); setNotYet(null); }}>
          Start again
        </button>
      )}
    </>
  );
}
