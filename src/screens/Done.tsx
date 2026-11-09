import { Btn, Frame } from '../components';
import type { Topic } from '../lib/content';
import { playSound, stopSound } from '../lib/audio';
import { go } from '../lib/route';
import { useSettings } from '../lib/settings';

export function Done({ topic }: { topic: Topic }) {
  const { settings } = useSettings();
  const words = `You did it. You finished ${topic.title}.`;
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
          <div className="pic pic-large">
            <span role="img" aria-label="A calm star" className="pic-emoji">🌟</span>
          </div>
        )}
        <p className="sentence">You did it.</p>
        <p className="sub">You finished {topic.title}.</p>
      </div>
    </Frame>
  );
}
