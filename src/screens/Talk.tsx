import { useState } from 'react';
import { playSound, stopSound } from '../lib/audio';
import { goBack } from '../lib/route';
import { useSettings } from '../lib/settings';

const BOARD = [
  { emoji: '🙋', label: 'Help', say: 'I need help, please.' },
  { emoji: '✋', label: 'Break', say: 'I want a break, please.' },
  { emoji: '🛑', label: 'Stop', say: 'Stop, please.' },
  { emoji: '👍', label: 'Yes', say: 'Yes.' },
  { emoji: '👎', label: 'No', say: 'No.' },
  { emoji: '🏁', label: 'Finished', say: 'I am finished.' },
  { emoji: '💧', label: 'Drink', say: 'I want a drink, please.' },
  { emoji: '🚻', label: 'Toilet', say: 'I need the toilet, please.' },
  { emoji: '🤕', label: 'Hurt', say: 'Something hurts.' },
];

/** A picture talk board. Tap a picture and it is said out loud and shown big, so a grown-up can see it too. */
export function Talk() {
  const { settings } = useSettings();
  const [said, setSaid] = useState<(typeof BOARD)[number] | null>(null);
  const tap = (b: (typeof BOARD)[number]) => {
    setSaid(b);
    if (b.label === 'Stop') stopSound();
    if (settings.sound) playSound({ text: b.say, rate: settings.speechRate });
  };
  return (
    <div className="frame">
      <header className="bar top-bar">
        <button type="button" className="btn btn-plain" onClick={() => { stopSound(); goBack(); }}>
          Back
        </button>
        <h1 className="bar-title">Talk</h1>
        <span />
      </header>
      <main className="home">
        <p className="said" role="status" aria-live="polite">
          {said ? (
            <>
              <span aria-hidden className="said-emoji">{said.emoji}</span> “{said.say}”
            </>
          ) : (
            'Tap a picture to say it.'
          )}
        </p>
        <div className="talk-grid">
          {BOARD.map((b) => (
            <button key={b.label} type="button" className={`talk-btn${said?.label === b.label ? ' talk-on' : ''}`} onClick={() => tap(b)}>
              <span className="talk-emoji" aria-hidden>{b.emoji}</span>
              <span>{b.label}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
