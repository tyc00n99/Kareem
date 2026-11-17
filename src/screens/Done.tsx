import { useState } from 'react';
import { Btn, Frame, Pic } from '../components';
import type { LearnScreen, Topic } from '../lib/content';
import { playSound, stopSound } from '../lib/audio';
import { go } from '../lib/route';
import { useSettings } from '../lib/settings';

export function Done({ topic }: { topic: Topic }) {
  const { settings } = useSettings();
  const words = `You did it. You finished ${topic.title}.`;
  // A calm recap: the pictures from the lesson as a little story strip. Tap one to hear it again.
  const story = topic.screens.filter((s): s is LearnScreen => s.type === 'learn').slice(0, 6);
  const [lit, setLit] = useState<number | null>(null);
  const tell = (k: number) => {
    if (!settings.sound) return;
    setLit(k);
    playSound({ text: story[k].text, audio: story[k].audio, rate: settings.speechRate, onEnd: () => setLit(null) });
  };
  return (
    <Frame
      top={
        <>
          <button type="button" className="btn btn-plain" onClick={() => { stopSound(); go({ name: 'home' }); }}>
            Home
          </button>
          <span className="bar-title">{topic.title}</span>
          <span className="count">Finished</span>
        </>
      }
      bottom={
        <>
          <Btn onClick={() => { stopSound(); go({ name: 'learn', topicId: topic.id, index: topic.screens.length - 1 }); }}>
            Back
          </Btn>
          <Btn
            onClick={() => settings.sound && playSound({ text: words, rate: settings.speechRate })}
            disabled={!settings.sound}
          >
            {settings.sound ? '🔊 Hear' : 'Sound off'}
          </Btn>
          <Btn kind="main" onClick={() => { stopSound(); go({ name: 'home' }); }}>
            Home
          </Btn>
        </>
      }
    >
      <div className="card">
        {settings.celebration === 'picture' && (
          <div className={`pic ${story.length > 1 ? 'pic-done' : 'pic-large'}`}>
            <span role="img" aria-label="A calm star" className="pic-emoji">🌟</span>
          </div>
        )}
        <p className="sentence">You did it.</p>
        <p className="sub">You finished {topic.title}.</p>
        {story.length > 1 && (
          <>
            <p className="flip-label">Your story</p>
            <ol className="story">
              {story.map((s, k) => (
                <li key={k}>
                  <button type="button" className={`story-step${lit === k ? ' story-lit' : ''}`} onClick={() => tell(k)}>
                    <Pic picture={s.picture} adultPicture={s.adultPicture} size="small" />
                    <span>{s.text}</span>
                  </button>
                </li>
              ))}
            </ol>
          </>
        )}
        <button
          type="button"
          className="btn btn-plain"
          onClick={() => { stopSound(); go({ name: 'learn', topicId: topic.id, index: 0 }); }}
        >
          ↻ Learn it again
        </button>
      </div>
    </Frame>
  );
}
