import { playSound, stopSound } from '../lib/audio';
import { goBack } from '../lib/route';
import { useSettings } from '../lib/settings';

/** A quiet place to rest. Nothing happens until the learner is ready. */
export function Break() {
  const { settings } = useSettings();
  const words = 'Take a break. Breathe in slowly. Breathe out slowly.';
  return (
    <div className="frame break-frame">
      <main className="break">
        <div className="break-scene">
          <img src="/content/images/art/hijrah-desert.jpg" alt="A calm desert under the moon and stars" />
          <span className="breathe" aria-hidden />
        </div>
        <h1 className="break-title">Take a break.</h1>
        <p className="sub">Breathe in slowly. Breathe out slowly.</p>
        <div className="break-actions">
          {settings.sound && (
            <button type="button" className="btn btn-plain" onClick={() => playSound({ text: words, rate: 'slow' })}>
              🔊 Hear
            </button>
          )}
          <button type="button" className="btn btn-main" onClick={() => { stopSound(); goBack(); }}>
            I'm ready
          </button>
        </div>
      </main>
    </div>
  );
}
