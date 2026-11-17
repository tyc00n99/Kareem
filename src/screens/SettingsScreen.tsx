import { useEffect, useState, type ReactNode } from 'react';
import { canSpeak, goodVoices, onVoices, playSound } from '../lib/audio';
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
          <Choice
            name="dim"
            label="Dim the light"
            options={[{ value: 'off', text: 'Off' }, { value: 'some', text: 'A little' }, { value: 'more', text: 'More' }]}
          />
          <p className="hint">
            For children who find bright screens hard, such as many autistic children and children with developmental or
            intellectual disabilities. Calm mode also softens colours and stops movement.
          </p>
          <Choice name="calm" label="Calm mode" options={onOff('On', 'Off')} />
        </Section>
        <Section>
          <Choice name="look" label="Who is learning?" options={[{ value: 'child', text: 'A child' }, { value: 'adult', text: 'An adult' }]} />
        </Section>
        <Section>
          <Choice name="sound" label="Sound" options={onOff('On', 'Off')} />
          {!canSpeak() && <p className="hint">This device cannot read words aloud.</p>}
          <Choice name="speechRate" label="Reading speed" options={[{ value: 'slow', text: 'Slow' }, { value: 'normal', text: 'Normal' }]} />
          {canSpeak() && <VoicePick />}
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

function niceName(v: SpeechSynthesisVoice): string {
  return v.name.replace(/^(Microsoft|Google|Apple)\s+/i, '').replace(/\s*\((?:Natural|Enhanced|Premium)\)/i, ' ★').replace(/\s*-\s*English.*$/i, '');
}

/** Choose the reading voice from the most natural ones on this device. */
function VoicePick() {
  const { settings, update } = useSettings();
  const [voices, setVoices] = useState(() => goodVoices().slice(0, 10));
  useEffect(() => onVoices(() => setVoices(goodVoices().slice(0, 10))), []);
  const tryIt = () => playSound({ text: 'Assalamu alaykum! I am Kareem. Let us learn together.', rate: settings.speechRate });
  if (!voices.length) return null;
  return (
    <fieldset className="setting">
      <legend>Reading voice</legend>
      <div className="voice-row">
        <select className="voice-select" value={settings.voice} onChange={(e) => update({ voice: e.target.value })} aria-label="Reading voice">
          <option value="">Most natural on this device ({niceName(voices[0])})</option>
          {voices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {niceName(v)} · {v.lang}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-plain" onClick={tryIt} disabled={!settings.sound}>
          🔊 Try it
        </button>
      </div>
      <p className="hint">Voices come from your phone or computer. Ones marked ★ sound most human. On iPhone and iPad you can download nicer voices in Settings, Accessibility, Spoken Content, Voices.</p>
    </fieldset>
  );
}

function Section({ children }: { children: ReactNode }) {
  return <section className="setting-group">{children}</section>;
}
