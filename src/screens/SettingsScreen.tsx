import type { ReactNode } from 'react';
import { canSpeak } from '../lib/audio';
import { go } from '../lib/route';
import { useSettings, type Settings } from '../lib/settings';

function Choice<K extends keyof Settings>({
  name,
  label,
  options,
}: {
  name: K;
  label: string;
  options: { value: Settings[K]; text: string }[];
}) {
  const { settings, update } = useSettings();
  return (
    <fieldset className="setting">
      <legend>{label}</legend>
      <div className="seg">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={settings[name] === o.value}
            className={`seg-btn${settings[name] === o.value ? ' on' : ''}`}
            onClick={() => update({ [name]: o.value } as Partial<Settings>)}
          >
            {o.text}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const onOff = (on: string, off: string) => [
  { value: true, text: on },
  { value: false, text: off },
];

export function SettingsScreen() {
  return (
    <div className="frame">
      <header className="bar top-bar">
        <button type="button" className="btn btn-plain" onClick={() => go({ name: 'home' })}>
          Home
        </button>
        <h1 className="bar-title">Settings</h1>
        <span className="count" />
      </header>
      <main className="settings">
        <Section>
          <Choice name="look" label="Who is learning?" options={[{ value: 'child', text: 'A child' }, { value: 'adult', text: 'An adult' }]} />
        </Section>
        <Section>
          <Choice name="sound" label="Sound" options={onOff('On', 'Off')} />
          {!canSpeak() && <p className="hint">This device cannot read words aloud.</p>}
          <Choice name="speechRate" label="Reading speed" options={[{ value: 'slow', text: 'Slow' }, { value: 'normal', text: 'Normal' }]} />
        </Section>
        <Section>
          <Choice name="textSize" label="Text size" options={[{ value: 'normal', text: 'Normal' }, { value: 'large', text: 'Large' }, { value: 'larger', text: 'Larger' }]} />
          <Choice name="highContrast" label="Strong colours" options={onOff('On', 'Off')} />
          <Choice name="motion" label="Movement on screen" options={onOff('On', 'Off')} />
          <Choice name="celebration" label="When you finish" options={[{ value: 'picture', text: 'Words and a star' }, { value: 'words', text: 'Just words' }]} />
        </Section>
      </main>
    </div>
  );
}

function Section({ children }: { children: ReactNode }) {
  return <section className="setting-group">{children}</section>;
}
