import { useState } from 'react';
import { checkPin, createGrownUp, forgetGrownUp, getPeople, setActiveChild, signIn, type Role } from '../lib/people';
import { go, goGrownUp } from '../lib/route';
import { useSettings } from '../lib/settings';
import { PinPad } from './PinPad';

export function SignIn({ tab: start }: { tab: 'grown-up' | 'kid' }) {
  const [tab, setTab] = useState(start);
  return (
    <div className="auth">
      <a className="auth-brand" href="#/">
        <span aria-hidden>🌙</span> Kareem Learning Explorer
      </a>
      <div className="auth-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'grown-up'} className={tab === 'grown-up' ? 'on' : ''} onClick={() => setTab('grown-up')}>
          👪 Grown-up
        </button>
        <button type="button" role="tab" aria-selected={tab === 'kid'} className={tab === 'kid' ? 'on' : ''} onClick={() => setTab('kid')}>
          😊 I'm a kid
        </button>
      </div>
      <div className="auth-card">{tab === 'kid' ? <KidPick /> : <GrownUpGate />}</div>
      <p className="auth-note">Everything stays on this device. No email, no online account.</p>
    </div>
  );
}

function KidPick() {
  const { update } = useSettings();
  const kids = getPeople().children;
  const pick = (id?: string) => {
    setActiveChild(id);
    const child = kids.find((k) => k.id === id);
    if (child) {
      const { tags: _t, notes: _n, ...prefs } = child.profile;
      if (Object.keys(prefs).length) update(prefs);
    }
    go({ name: 'home' });
  };
  return (
    <div className="kid-pick">
      <h1 className="auth-h">Who is learning?</h1>
      {kids.length > 0 ? (
        <div className="kid-grid">
          {kids.map((k) => (
            <button key={k.id} type="button" className="kid-tile" onClick={() => pick(k.id)}>
              <span className="kid-avatar" aria-hidden>{k.avatar}</span>
              <span>{k.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="hint">A grown-up can add children in the grown-up area.</p>
      )}
      <button type="button" className="gu-btn gu-btn-wide" onClick={() => pick(undefined)}>
        Let's go! 🚀
      </button>
    </div>
  );
}

function GrownUpGate() {
  const g = getPeople().grownUp;
  return g ? <Welcome name={g.name} /> : <Create />;
}

function Welcome({ name }: { name: string }) {
  const [pin, setPin] = useState('');
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    const ok = await checkPin(pin);
    setBusy(false);
    if (ok) {
      signIn();
      goGrownUp();
    } else {
      setWrong(true);
      setPin('');
    }
  };
  return (
    <div className="gu-form">
      <h1 className="auth-h">Welcome back, {name}</h1>
      <p className="hint">Enter your grown-up PIN.</p>
      <PinPad pin={pin} setPin={(p) => { setPin(p); setWrong(false); }} />
      {wrong && <p className="gu-error" role="alert">That PIN didn't match. Try again.</p>}
      <button type="button" className="gu-btn gu-btn-wide" disabled={pin.length < 4 || busy} onClick={submit}>
        Sign in
      </button>
      <button
        type="button"
        className="gu-link"
        onClick={() => {
          if (window.confirm('Forget the grown-up name and PIN on this device? Children and their learning stay.')) {
            forgetGrownUp();
            go({ name: 'signin', tab: 'grown-up' });
            window.location.reload();
          }
        }}
      >
        Forgot your PIN? Start again
      </button>
    </div>
  );
}

function Create() {
  const [role, setRole] = useState<Role>('parent');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    await createGrownUp(name, role, pin);
    goGrownUp();
  };
  return (
    <div className="gu-form">
      <h1 className="auth-h">Set up your grown-up space</h1>
      <div className="role-pick">
        {(['parent', 'teacher'] as const).map((r) => (
          <button key={r} type="button" className={`role${role === r ? ' on' : ''}`} aria-pressed={role === r} onClick={() => setRole(r)}>
            {r === 'parent' ? '👪 Parent' : '🧑‍🏫 Teacher'}
          </button>
        ))}
      </div>
      <label className="gu-label">
        Your name
        <input className="gu-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </label>
      <p className="gu-label">Choose a 4-digit PIN</p>
      <PinPad pin={pin} setPin={setPin} />
      <button type="button" className="gu-btn gu-btn-wide" disabled={!name.trim() || pin.length < 4 || busy} onClick={submit}>
        Create my space
      </button>
    </div>
  );
}
