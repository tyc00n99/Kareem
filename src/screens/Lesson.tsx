import { useEffect, useState } from 'react';
import { Btn, Frame, Pic } from '../components';
import type { CheckScreen, LearnScreen, Topic } from '../lib/content';
import { playSound, stopSound } from '../lib/audio';
import { markFinished } from '../lib/progress';
import { go } from '../lib/route';
import { useSettings } from '../lib/settings';

function speechFor(s: LearnScreen): string {
  return s.arabic ? `${s.text} ${s.arabic.say}.` : s.text;
}

export function Lesson({ topic, index }: { topic: Topic; index: number }) {
  const { settings } = useSettings();
  const i = Math.min(index, topic.screens.length - 1);
  const screen = topic.screens[i];
  const last = i === topic.screens.length - 1;

  // Check state resets whenever the screen changes.
  const [answer, setAnswer] = useState<'none' | 'right' | 'retry'>('none');
  const [picked, setPicked] = useState<number | null>(null);
  useEffect(() => {
    setAnswer('none');
    setPicked(null);
    stopSound();
    window.scrollTo(0, 0);
  }, [topic.id, i]);
  useEffect(() => stopSound, []);

  const reviewScreen =
    screen.type === 'check' ? (topic.screens[screen.showAgain - 1] as LearnScreen | undefined) : undefined;

  const hear = () => {
    if (!settings.sound) return;
    if (screen.type === 'learn') {
      playSound({ text: speechFor(screen), audio: screen.audio, rate: settings.speechRate });
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

  const nextBlocked = screen.type === 'check' && answer !== 'right';

  return (
    <Frame
      top={
        <>
          <button type="button" className="btn btn-plain" onClick={() => { stopSound(); go({ name: 'home' }); }}>
            Home
          </button>
          <span className="bar-title">{topic.title}</span>
          <span className="count" aria-label={`Screen ${i + 1} of ${topic.screens.length}`}>
            {i + 1} of {topic.screens.length}
          </span>
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
      <div className="card" key={`${topic.id}-${i}`}>
        {screen.type === 'learn' ? (
          <LearnCard screen={screen} />
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

function LearnCard({ screen }: { screen: LearnScreen }) {
  return (
    <>
      <Pic picture={screen.picture} adultPicture={screen.adultPicture} />
      {screen.arabic && (
        <div className="arabic">
          <span lang="ar" dir="rtl" className="arabic-text">{screen.arabic.text}</span>
          <span className="arabic-say">{screen.arabic.say}</span>
        </div>
      )}
      <p className="sentence">{screen.text}</p>
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
