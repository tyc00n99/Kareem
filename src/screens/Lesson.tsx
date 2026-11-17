import { useEffect, useRef, useState } from 'react';
import { Btn, Frame, KidTools, Pic } from '../components';
import type { CheckScreen, LearnScreen, Topic } from '../lib/content';
import { ArabicCard, Bubble, OrderCard, Words } from '../lesson-parts';
import { playSound, playTwo, stopSound, type PlayOptions } from '../lib/audio';
import { arabicClip, screenClip } from '../lib/clips';
import { markFinished, recordCheck, recordOpen, recordScreen } from '../lib/progress';
import { go } from '../lib/route';
import { activePlan, helpFor } from '../lib/plan';
import { useSettings } from '../lib/settings';

function speechFor(s: LearnScreen): string {
  return s.arabic ? `${s.text} ${s.arabic.say}.` : s.text;
}

/** Called when a word is tapped: say just that word and light it up. */
type WordTap = (word: string, charIndex: number) => void;

export function Lesson({ topic, index }: { topic: Topic; index: number }) {
  const { settings } = useSettings();
  const i = Math.min(index, topic.screens.length - 1);
  const screen = topic.screens[i];
  const last = i === topic.screens.length - 1;

  // Check state resets whenever the screen changes.
  const [answer, setAnswer] = useState<'none' | 'right' | 'retry'>('none');
  const [picked, setPicked] = useState<number | null>(null);
  const [orderDone, setOrderDone] = useState(false);
  // Character index of the word being spoken right now, for the light-up words.
  const [at, setAt] = useState<number | null>(null);
  useEffect(() => {
    setAnswer('none');
    setPicked(null);
    setOrderDone(false);
    stopSound();
    window.scrollTo(0, 0);
  }, [topic.id, i]);
  useEffect(() => stopSound, []);

  // Quiet records for grown-ups: started, how far, and question answers. The child never sees a score.
  const clean = useRef(true);
  const triedHere = useRef(false);
  useEffect(() => {
    if (i === 0) {
      recordOpen(topic.id);
      clean.current = true;
    }
    recordScreen(topic.id, i + 1);
    triedHere.current = false;
  }, [topic.id, i]);

  const reviewScreen =
    screen.type === 'check' ? (topic.screens[screen.showAgain - 1] as LearnScreen | undefined) : undefined;

  /** Say a learn screen: a recorded clip when there is one, then the Arabic phrase in its own clip. */
  const sayLearn = (s: LearnScreen, n: number, extra?: Partial<PlayOptions>, prefix = '') => {
    const clip = s.audio ?? screenClip(topic.id, n);
    const ar = s.arabic && arabicClip(s.arabic.say);
    const base = { rate: settings.speechRate, ...extra };
    if (s.arabic && (clip || ar)) {
      playTwo(
        { ...base, text: prefix + s.text, audio: clip },
        { ...base, text: `${s.arabic.say}.`, audio: ar, offset: s.text.length + 1 },
      );
    } else playSound({ ...base, text: prefix + speechFor(s), audio: prefix ? undefined : clip });
  };

  const hear = () => {
    if (!settings.sound) return;
    if (screen.type === 'learn') {
      sayLearn(screen, i, { onWord: setAt, onEnd: () => setAt(null) });
    } else if (screen.type === 'order') {
      const all = orderDone ? ` ${screen.items.map((x) => x.label).join('. ')}.` : '';
      playSound({ text: `${screen.question}${all}`, audio: orderDone ? undefined : (screen.audio ?? screenClip(topic.id, i)), rate: settings.speechRate });
    } else if (answer === 'retry' && reviewScreen) {
      const back = screen.showAgain - 1;
      if (screenClip(topic.id, back) || reviewScreen.audio) {
        playTwo({ text: "Let's look again.", rate: settings.speechRate }, { text: reviewScreen.text, audio: reviewScreen.audio ?? screenClip(topic.id, back), rate: settings.speechRate, offset: 0 });
      } else sayLearn(reviewScreen, back, undefined, "Let's look again. ");
    } else if (answer === 'right') {
      playSound({ text: 'Yes. That is right.', rate: settings.speechRate });
    } else {
      playSound({ text: screen.question, audio: screen.audio ?? screenClip(topic.id, i), rate: settings.speechRate });
    }
  };

  const next = () => {
    stopSound();
    if (last) {
      markFinished(topic.id, clean.current);
      go({ name: 'done', topicId: topic.id });
    } else go({ name: 'learn', topicId: topic.id, index: i + 1 });
  };
  const back = () => {
    stopSound();
    if (i === 0) go(topic.world ? { name: 'world', worldId: topic.world } : { name: 'home' });
    else go({ name: 'learn', topicId: topic.id, index: i - 1 });
  };

  const tapWord: WordTap = (word, charIndex) => {
    if (!settings.sound) return;
    setAt(charIndex);
    playSound({ text: word, rate: settings.speechRate, onEnd: () => setAt(null) });
  };

  // World lessons: "Which picture shows this step?" under each picture, with emoji from the same lesson.
  // The child's learning plan decides the answer type and how much help to give.
  const plan = activePlan();
  const tapMode = plan.answerMode === 'tap' || (plan.answerMode === 'both' && topic.world === 'everyday');
  const choices = screen.type === 'learn' && topic.pickStep ? stepChoices(topic, i) : null;
  const [stepPicked, setStepPicked] = useState<{ n: number; right: boolean } | null>(null);
  // Gently show the right picture after the wait time (a gestural prompt), until that help has faded.
  const [hint, setHint] = useState(false);
  useEffect(() => {
    setStepPicked(null);
    setHint(false);
    if (!choices || tapMode || !helpFor(plan, topic.id)) return;
    const t = setTimeout(() => setHint(true), plan.waitSec * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id, i]);

  const nextBlocked =
    (screen.type === 'check' && answer !== 'right') ||
    (screen.type === 'order' && !orderDone) ||
    (!!choices && !stepPicked?.right);

  return (
    <Frame
      top={
        <>
          <button type="button" className="btn btn-plain" onClick={() => { stopSound(); go({ name: 'home' }); }}>
            Home
          </button>
          <span className="bar-title">{topic.title}</span>
          <KidTools compact />
        </>
      }
      bottom={
        <>
          <Btn onClick={back}>Back</Btn>
          <Btn onClick={hear} disabled={!settings.sound} label={settings.sound ? 'Hear it' : 'Sound is off'}>
            {settings.sound ? '🔊 Hear' : 'Sound off'}
          </Btn>
          <Btn onClick={next} disabled={nextBlocked} kind="main">
            {last ? 'Finish' : 'Next'}
          </Btn>
        </>
      }
    >
      <div className="progress" aria-label={`Screen ${i + 1} of ${topic.screens.length}`}>
        <span className="progress-track">
          <span className="progress-fill" style={{ width: `${((i + 1) / topic.screens.length) * 100}%` }} />
        </span>
        <span className="progress-count" aria-hidden>
          {i + 1} / {topic.screens.length}
        </span>
      </div>
      <div className="card" key={`${topic.id}-${i}`}>
        {screen.type === 'learn' ? (
          <>
            <LearnCard screen={screen} at={at} onWord={settings.sound ? tapWord : undefined} onPicture={hear} showHint={i === 0} />
            {choices && (
              <PickStep
                choices={choices}
                answer={screen.picture.emoji!}
                tap={tapMode}
                hint={hint}
                picked={stepPicked}
                onPick={(n) => {
                  const right = n < 0 || choices[n] === screen.picture.emoji;
                  if (n >= 0 && !stepPicked) recordCheck(topic.id, right);
                  if (!right) clean.current = false;
                  if (!right && plan.errorless) setHint(true);
                  setStepPicked({ n, right });
                  const say = right ? (plan.praise ? 'Yes!' : '') : 'Not yet. Look at the big picture.';
                  if (settings.sound && say) playSound({ text: say, rate: settings.speechRate });
                }}
              />
            )}
          </>
        ) : screen.type === 'order' ? (
          <OrderCard screen={screen} onDone={() => setOrderDone(true)} />
        ) : (
          <CheckCard
            screen={screen}
            answer={answer}
            picked={picked}
            review={reviewScreen}
            onPick={(n) => {
              setPicked(n);
              const right = !!screen.answers[n].correct;
              if (!triedHere.current) {
                triedHere.current = true;
                recordCheck(topic.id, right);
              }
              if (!right) clean.current = false;
              setAnswer(right ? 'right' : 'retry');
            }}
            onRetry={() => {
              setAnswer('none');
              setPicked(null);
            }}
          />
        )}
      </div>
    </Frame>
  );
}

const SPARE = ['🌙', '⭐', '🌳', '🏠', '📖', '💧', '🍎', '🕌'];

/** Three pictures: this step's picture and two others, in a mixed order that stays the same on this screen. */
function stepChoices(topic: Topic, i: number): string[] | null {
  const screen = topic.screens[i];
  if (screen.type !== 'learn' || !screen.picture.emoji) return null;
  const right = screen.picture.emoji;
  const others: string[] = [];
  for (const s of topic.screens) {
    if (s.type === 'learn' && s.picture.emoji && s.picture.emoji !== right && !others.includes(s.picture.emoji)) others.push(s.picture.emoji);
  }
  for (const e of SPARE) if (others.length < 2 && e !== right && !others.includes(e)) others.push(e);
  const two = [others[(i + 1) % others.length], others[(i + 2) % others.length]].filter((e, k, a) => a.indexOf(e) === k);
  while (two.length < 2) two.push(SPARE.find((e) => e !== right && !two.includes(e))!);
  const all = [right, ...two];
  // Rotate by screen number so the right one is not always in the same place.
  const r = i % 3;
  return [...all.slice(3 - r), ...all.slice(0, 3 - r)];
}

function PickStep({
  choices,
  answer,
  tap,
  hint,
  picked,
  onPick,
}: {
  choices: string[];
  answer: string;
  tap: boolean;
  hint: boolean;
  picked: { n: number; right: boolean } | null;
  /** Index of the picture, or -1 for "I did it". */
  onPick: (n: number) => void;
}) {
  if (tap) {
    return (
      <div className="pick-step">
        <p className="pick-q">
          <img className="pick-moon" src="/content/images/characters/moon.png" alt="" />
          <span>{picked ? 'Well done 😊' : 'Do this step. Then tap “I did it”.'}</span>
        </p>
        <button type="button" className={`btn btn-main did-it${picked ? ' pick-right' : ''}`} onClick={() => onPick(-1)} disabled={!!picked}>
          ✋ I did it
        </button>
      </div>
    );
  }
  return (
    <div className="pick-step">
      <p className="pick-q">
        <img className="pick-moon" src="/content/images/characters/moon.png" alt="" />
        <span>{picked?.right ? 'Yes! 😊' : picked ? 'Not yet. Look at the big picture.' : 'Which picture shows this step?'}</span>
      </p>
      <div className="pick-row" role="group" aria-label="Which picture shows this step?">
        {choices.map((e, n) => (
          <button
            key={n}
            type="button"
            className={`pick-btn${picked?.n === n ? (picked.right ? ' pick-right' : ' pick-wrong') : hint && !picked?.right && e === answer ? ' pick-hint' : ''}`}
            onClick={() => onPick(n)}
            disabled={!!picked?.right}
            aria-label={`Picture ${n + 1}`}
          >
            <span aria-hidden>{e}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function LearnCard({
  screen,
  at = null,
  onWord,
  onPicture,
  showHint = false,
}: {
  screen: LearnScreen;
  at?: number | null;
  onWord?: WordTap;
  onPicture?: () => void;
  showHint?: boolean;
}) {
  const sentence = <Words text={screen.text} at={at} onWord={onWord} className={screen.speaker ? 'bubble-text' : 'sentence'} />;
  const pic = <Pic picture={screen.picture} adultPicture={screen.adultPicture} />;
  return (
    <>
      {onPicture ? (
        <button type="button" className="pic-button" onClick={onPicture} aria-label={`${screen.picture.alt}. Tap to hear.`}>
          {pic}
        </button>
      ) : (
        pic
      )}
      {screen.speaker ? <Bubble speaker={screen.speaker}>{sentence}</Bubble> : sentence}
      {screen.arabic && <ArabicCard arabic={screen.arabic} at={at} offset={screen.text.length + 1} onWord={onWord} />}
      {showHint && onWord && <p className="hint tap-hint">Tap a word or the picture to hear it.</p>}
    </>
  );
}

function CheckCard({
  screen,
  answer,
  picked,
  review,
  onPick,
  onRetry,
}: {
  screen: CheckScreen;
  answer: 'none' | 'right' | 'retry';
  picked: number | null;
  review?: LearnScreen;
  onPick: (n: number) => void;
  onRetry: () => void;
}) {
  if (answer === 'retry' && review) {
    return (
      <>
        <p className="kind">Let's look again.</p>
        <LearnCard screen={review} />
        <button type="button" className="btn btn-main retry" onClick={onRetry}>
          Try again
        </button>
      </>
    );
  }
  return (
    <>
      <p className="sentence">{screen.question}</p>
      <div className="answers" role="group" aria-label="Answers">
        {screen.answers.map((a, n) => (
          <button
            key={n}
            type="button"
            className={`answer${picked === n && answer === 'right' ? ' answer-right' : ''}`}
            onClick={() => onPick(n)}
            disabled={answer === 'right'}
          >
            <Pic picture={a.picture} adultPicture={a.adultPicture} size="small" />
            <span>{a.label}</span>
          </button>
        ))}
      </div>
      <p className="kind" aria-live="polite">{answer === 'right' ? 'Yes. That is right.' : ' '}</p>
    </>
  );
}
