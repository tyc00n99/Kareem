import { useEffect, useState } from 'react';
import { Btn, Frame, KidTools, Pic } from '../components';
import type { CheckScreen, LearnScreen, Topic } from '../lib/content';
import { ArabicCard, Bubble, OrderCard, Words } from '../lesson-parts';
import { playSound, stopSound } from '../lib/audio';
import { markFinished } from '../lib/progress';
import { go } from '../lib/route';
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

  const reviewScreen =
    screen.type === 'check' ? (topic.screens[screen.showAgain - 1] as LearnScreen | undefined) : undefined;

  const hear = () => {
    if (!settings.sound) return;
    if (screen.type === 'learn') {
      playSound({
        text: speechFor(screen),
        audio: screen.audio,
        rate: settings.speechRate,
        onWord: setAt,
        onEnd: () => setAt(null),
      });
    } else if (screen.type === 'order') {
      const all = orderDone ? ` ${screen.items.map((x) => x.label).join('. ')}.` : '';
      playSound({ text: `${screen.question}${all}`, audio: orderDone ? undefined : screen.audio, rate: settings.speechRate });
    } else if (answer === 'retry' && reviewScreen) {
      playSound({ text: `Let's look again. ${speechFor(reviewScreen)}`, audio: reviewScreen.audio, rate: settings.speechRate });
    } else if (answer === 'right') {
      playSound({ text: 'Yes. That is right.', rate: settings.speechRate });
    } else {
      playSound({ text: screen.question, audio: screen.audio, rate: settings.speechRate });
    }
  };

  const next = () => {
    stopSound();
    if (last) {
      markFinished(topic.id);
      go({ name: 'done', topicId: topic.id });
    } else go({ name: 'learn', topicId: topic.id, index: i + 1 });
  };
  const back = () => {
    stopSound();
    if (i === 0) go({ name: 'home' });
    else go({ name: 'learn', topicId: topic.id, index: i - 1 });
  };

  const tapWord: WordTap = (word, charIndex) => {
    if (!settings.sound) return;
    setAt(charIndex);
    playSound({ text: word, rate: settings.speechRate, onEnd: () => setAt(null) });
  };

  const nextBlocked = (screen.type === 'check' && answer !== 'right') || (screen.type === 'order' && !orderDone);

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
          <LearnCard screen={screen} at={at} onWord={settings.sound ? tapWord : undefined} onPicture={hear} showHint={i === 0} />
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
              setAnswer(screen.answers[n].correct ? 'right' : 'retry');
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
