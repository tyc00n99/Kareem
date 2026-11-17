import { useEffect, useRef, useState } from 'react';
import { Btn, Frame, KidTools } from '../components';
import type { Activity, Option, Step } from '../lib/activities';
import { playSound, stopSound } from '../lib/audio';
import { activePlan, helpFor } from '../lib/plan';
import { markFinished, recordCheck, recordOpen } from '../lib/progress';
import { goBack } from '../lib/route';
import { useSettings } from '../lib/settings';

/** Plays one game or Arabic path level: a few short steps, then a calm "You did it". */
export function Play({ id, activity }: { id: string; activity: Activity }) {
  const { settings } = useSettings();
  const plan = activePlan();
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const clean = useRef(true);
  const step = activity.steps[i];

  useEffect(() => {
    recordOpen(id);
    clean.current = true;
  }, [id]);
  useEffect(() => stopSound, []);

  const say = (text: string, lang?: 'ar') => settings.sound && playSound({ text, rate: settings.speechRate, lang });
  const next = () => {
    stopSound();
    setReady(false);
    if (i + 1 < activity.steps.length) setI(i + 1);
    else {
      markFinished(id, clean.current);
      setDone(true);
      say('You did it.');
    }
  };
  const answered = (firstTry: boolean) => {
    recordCheck(id, firstTry);
    if (!firstTry) clean.current = false;
  };

  const top = (
    <>
      <button type="button" className="btn btn-plain" onClick={() => { stopSound(); goBack(); }}>
        Back
      </button>
      <span className="bar-title">
        {/[\u0600-\u06FF]/.test(activity.emoji) ? '' : `${activity.emoji} `}
        {activity.title}
      </span>
      <KidTools compact />
    </>
  );

  if (done) {
    return (
      <Frame
        top={top}
        bottom={
          <>
            <Btn onClick={() => { setDone(false); setI(0); recordOpen(id); clean.current = true; }}>↻ Again</Btn>
            <Btn onClick={() => say('You did it.')} disabled={!settings.sound}>{settings.sound ? '🔊 Hear' : 'Sound off'}</Btn>
            <Btn kind="main" onClick={() => { stopSound(); goBack(); }}>Done</Btn>
          </>
        }
      >
        <div className="card">
          {settings.celebration === 'picture' && (
            <div className="pic pic-large">
              <span role="img" aria-label="A calm star" className="pic-emoji">🌟</span>
            </div>
          )}
          <p className="sentence">You did it.</p>
          <p className="sub">{activity.title}</p>
        </div>
      </Frame>
    );
  }

  const canNext = step.kind === 'learn' || step.kind === 'explore' || ready;
  return (
    <Frame
      top={top}
      bottom={
        <>
          <Btn onClick={() => (i === 0 ? goBack() : (stopSound(), setReady(false), setI(i - 1)))}>Back</Btn>
          <Btn onClick={() => hearStep(step, say)} disabled={!settings.sound}>
            {settings.sound ? '🔊 Hear' : 'Sound off'}
          </Btn>
          <Btn kind="main" onClick={next} disabled={!canNext}>
            {i + 1 < activity.steps.length ? 'Next' : 'Finish'}
          </Btn>
        </>
      }
    >
      <div className="progress" aria-label={`Step ${i + 1} of ${activity.steps.length}`}>
        <span className="progress-track">
          <span className="progress-fill" style={{ width: `${((i + 1) / activity.steps.length) * 100}%` }} />
        </span>
        <span className="progress-count" aria-hidden>
          {i + 1} / {activity.steps.length}
        </span>
      </div>
      {i === 0 && <p className="play-how">{activity.howTo}</p>}
      <div className="card" key={i}>
        {step.kind === 'learn' && <LearnStep step={step} say={say} />}
        {step.kind === 'choice' && (
          <ChoiceStep step={step} say={say} errorless={plan.errorless} hintAfter={helpFor(plan, id) ? plan.waitSec : 0} praise={plan.praise} onAnswer={answered} onRight={() => setReady(true)} />
        )}
        {step.kind === 'order' && <OrderStep step={step} say={say} onAnswer={answered} onDone={() => setReady(true)} />}
        {step.kind === 'memory' && <MemoryStep step={step} say={say} onDone={() => setReady(true)} />}
        {step.kind === 'explore' && <ExploreStep step={step} say={say} />}
      </div>
    </Frame>
  );
}

type Say = (text: string, lang?: 'ar') => void;

function hearStep(step: Step, say: Say) {
  if (step.kind === 'learn') {
    if (step.say) say(step.say);
    if (step.sayArabic) setTimeout(() => say(step.sayArabic!, 'ar'), step.say ? 1600 : 0);
    if (!step.say && !step.sayArabic) say(step.text);
  } else if (step.kind === 'choice') {
    if (step.hear) say(step.hear.text, step.hear.lang);
    else say(step.prompt);
  } else if (step.kind === 'explore' || step.kind === 'order') say(step.prompt);
  else say('Flip two cards. Find the same pictures.');
}

function Big({ text, arabic }: { text: string; arabic?: boolean }) {
  return (
    <div className="pic pic-large play-big">
      <span className={arabic ? 'play-arabic' : 'pic-emoji'} dir={arabic ? 'rtl' : undefined} lang={arabic ? 'ar' : undefined}>
        {text}
      </span>
    </div>
  );
}

function OptionFace({ o }: { o: Option }) {
  return (
    <>
      {o.emoji && <span className="opt-emoji" aria-hidden>{o.emoji}</span>}
      {o.arabic && (
        <span className="opt-arabic" lang="ar" dir="rtl">
          {o.arabic}
        </span>
      )}
      {o.label && <span className="opt-label">{o.label}</span>}
    </>
  );
}
const optName = (o: Option) => o.label ?? o.arabic ?? o.emoji ?? '';

function LearnStep({ step, say }: { step: Extract<Step, { kind: 'learn' }>; say: Say }) {
  return (
    <>
      <button type="button" className="pic-button" onClick={() => hearStep(step, say)} aria-label={`${step.text} Tap to hear.`}>
        <Big text={step.big} arabic={step.arabic} />
      </button>
      <p className="sentence">{step.text}</p>
      {step.sub && <p className="sub">{step.sub}</p>}
    </>
  );
}

function ChoiceStep({
  step,
  say,
  errorless,
  hintAfter,
  praise,
  onAnswer,
  onRight,
}: {
  step: Extract<Step, { kind: 'choice' }>;
  say: Say;
  errorless: boolean;
  hintAfter: number;
  praise: boolean;
  onAnswer: (firstTry: boolean) => void;
  onRight: () => void;
}) {
  const [wrong, setWrong] = useState<number[]>([]);
  const [right, setRight] = useState(false);
  const [hint, setHint] = useState(false);
  useEffect(() => {
    if (!hintAfter) return;
    const t = setTimeout(() => setHint(true), hintAfter * 1000);
    return () => clearTimeout(t);
  }, [hintAfter]);
  const tap = (n: number) => {
    if (right) return;
    if (n === step.answer) {
      setRight(true);
      onAnswer(wrong.length === 0);
      onRight();
      const words = [praise ? 'Yes!' : '', step.then ?? ''].filter(Boolean).join(' ');
      if (words) say(words);
    } else {
      setWrong((w) => (w.includes(n) ? w : [...w, n]));
      if (errorless) setHint(true);
      say('Not yet. Try again.');
    }
  };
  return (
    <>
      {step.big &&
        (step.hear ? (
          <button type="button" className="pic-button" onClick={() => say(step.hear!.text, step.hear!.lang)} aria-label="Tap to hear">
            <Big text={step.big} arabic={step.arabic} />
          </button>
        ) : (
          <Big text={step.big} arabic={step.arabic} />
        ))}
      <p className="sentence play-prompt">{step.prompt}</p>
      <div className={`answers play-opts${step.options.length > 3 ? ' play-opts-4' : ''}`} role="group" aria-label="Answers">
        {step.options.map((o, n) => (
          <button
            key={n}
            type="button"
            className={`answer${right && n === step.answer ? ' answer-right' : ''}${wrong.includes(n) ? ' play-wrong' : ''}${hint && !right && n === step.answer ? ' pick-hint' : ''}`}
            onClick={() => tap(n)}
            aria-label={optName(o)}
          >
            <OptionFace o={o} />
          </button>
        ))}
      </div>
      <p className="kind" role="status">
        {right ? (step.then ?? (praise ? 'Yes! 😊' : '')) : wrong.length ? 'Not yet. Try again.' : ''}
      </p>
    </>
  );
}

function OrderStep({ step, say, onAnswer, onDone }: { step: Extract<Step, { kind: 'order' }>; say: Say; onAnswer: (f: boolean) => void; onDone: () => void }) {
  // Show the items mixed up (the same way every time).
  const [shown] = useState(() => step.items.map((o, k) => ({ o, k })).sort((a, b) => ((a.k * 5 + 3) % 7) - ((b.k * 5 + 3) % 7)));
  const [placed, setPlaced] = useState<number[]>([]);
  const [miss, setMiss] = useState<number | null>(null);
  const [anyMiss, setAnyMiss] = useState(false);
  const tap = (k: number) => {
    if (placed.includes(k)) return;
    if (k === placed.length) {
      const p = [...placed, k];
      setPlaced(p);
      setMiss(null);
      say(optName(step.items[k]));
      if (p.length === step.items.length) {
        onAnswer(!anyMiss);
        onDone();
      }
    } else {
      setMiss(k);
      setAnyMiss(true);
      say('Not yet.');
    }
  };
  return (
    <>
      <p className="sentence play-prompt">{step.prompt}</p>
      <ol className="order-done">
        {placed.map((k) => (
          <li key={k}>
            <OptionFace o={step.items[k]} />
          </li>
        ))}
      </ol>
      <div className="answers play-opts play-opts-4" role="group" aria-label="Steps">
        {shown.map(({ o, k }) => (
          <button key={k} type="button" className={`answer${placed.includes(k) ? ' play-used' : ''}${miss === k ? ' play-wrong' : ''}${miss !== null && k === placed.length ? ' pick-hint' : ''}`} onClick={() => tap(k)} disabled={placed.includes(k)}>
            <OptionFace o={o} />
          </button>
        ))}
      </div>
    </>
  );
}

function MemoryStep({ step, say, onDone }: { step: Extract<Step, { kind: 'memory' }>; say: Say; onDone: () => void }) {
  const [cards] = useState(() => [...step.pairs, ...step.pairs].map((o, k) => ({ o, k })).sort((a, b) => ((a.k * 7 + 2) % 11) - ((b.k * 7 + 2) % 11)));
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const flip = (n: number) => {
    if (open.length === 2 || open.includes(n) || found.includes(optName(cards[n].o))) return;
    const now = [...open, n];
    setOpen(now);
    if (now.length === 2) {
      const [a, b] = now.map((x) => optName(cards[x].o));
      if (a === b) {
        const f = [...found, a];
        setFound(f);
        setOpen([]);
        say(a);
        if (f.length === step.pairs.length) onDone();
      } else setTimeout(() => setOpen([]), 1100);
    }
  };
  return (
    <>
      <p className="sentence play-prompt">Find the same pictures.</p>
      <div className="memory-grid">
        {cards.map(({ o }, n) => {
          const up = open.includes(n) || found.includes(optName(o));
          return (
            <button key={n} type="button" className={`memory-card${up ? ' up' : ''}`} onClick={() => flip(n)} aria-label={up ? optName(o) : 'Hidden card'}>
              {up ? <span aria-hidden>{o.emoji}</span> : <span aria-hidden>🌙</span>}
            </button>
          );
        })}
      </div>
    </>
  );
}

function ExploreStep({ step, say }: { step: Extract<Step, { kind: 'explore' }>; say: Say }) {
  const [on, setOn] = useState<string[]>([]);
  const [last, setLast] = useState('');
  return (
    <>
      <p className="sentence play-prompt">{step.prompt}</p>
      <div className="answers play-opts play-opts-4">
        {step.things.map((t) => {
          const lit = on.includes(t.label);
          return (
            <button
              key={t.label}
              type="button"
              className={`answer${lit ? ' answer-right' : ''}`}
              onClick={() => {
                setOn((x) => (x.includes(t.label) ? x.filter((y) => y !== t.label) : [...x, t.label]));
                setLast(t.say);
                say(t.say);
              }}
            >
              <span className="opt-emoji" aria-hidden>{lit ? t.after : t.before}</span>
              <span className="opt-label">{t.label}</span>
            </button>
          );
        })}
      </div>
      <p className="kind" role="status">{last}</p>
    </>
  );
}
