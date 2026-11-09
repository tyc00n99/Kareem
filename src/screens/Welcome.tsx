import { useSettings } from '../lib/settings';

export function Welcome() {
  const { update } = useSettings();
  return (
    <div className="welcome">
      <h1>Deen Steps</h1>
      <p className="lead">Who is learning?</p>
      <div className="choice-row">
        <button type="button" className="choice" onClick={() => update({ look: 'child' })}>
          <span className="pic-emoji" aria-hidden="true">🧒</span>
          <span>A child</span>
        </button>
        <button type="button" className="choice" onClick={() => update({ look: 'adult' })}>
          <span className="pic-emoji" aria-hidden="true">🧑</span>
          <span>An adult</span>
        </button>
      </div>
      <p className="hint">You can change this later in Settings.</p>
    </div>
  );
}
