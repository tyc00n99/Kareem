import { useState } from 'react';
import { childPrefs } from '../lib/plan';
import { cloudAvailable, createAccount, getAccount, signInAccount } from '../lib/cloud';
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
      <p className="auth-note">
        {cloudAvailable()
          ? 'Without an account, everything stays on this device. With one, your children and their learning are saved and shared between your devices and their teacher.'
          : 'Everything stays on this device. No email, no online account.'}
      </p>
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
      const prefs = childPrefs(child.profile);
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
  const [mode, setMode] = useState<'pin' | 'account'>(g || !cloudAvailable() ? 'pin' : 'account');
  if (mode === 'account') {
    return (
      <>
        <AccountForm />
        <button type="button" className="gu-link auth-switch" onClick={() => setMode('pin')}>
          {g ? 'Use my PIN instead' : 'No account: keep everything on this device'}
        </button>
      </>
    );
  }
  return (
    <>
      {g ? <Welcome name={g.name} /> : <Create />}
      {cloudAvailable() && !getAccount() && (
        <button type="button" className="gu-link auth-switch" onClick={() => setMode('account')}>
          Have an account, or want one? Sign in with email
        </button>
      )}
    </>
  );
}

/** Sign in to (or make) an online account. Afterwards the device still uses a PIN, to keep little hands out. */
export function AccountForm() {
  const [tab, setTab] = useState<'in' | 'new'>('in');
  const [role, setRole] = useState<Role>('parent');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [needPin, setNeedPin] = useState(false);

  if (needPin) return <PinForAccount />;

  const submit = async () => {
    setBusy(true);
    setError('');
    const err = tab === 'new' ? await createAccount(name.trim(), role, email, password) : await signInAccount(email, password);
    setBusy(false);
    if (err) return setError(err);
    if (getPeople().grownUp) {
      signIn();
      goGrownUp();
    } else setNeedPin(true);
  };
  const ready = email.includes('@') && password.length >= (tab === 'new' ? 8 : 1) && (tab === 'in' || name.trim());
  return (
    <form
      className="gu-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready && !busy) void submit();
      }}
    >
      <h1 className="auth-h">{tab === 'in' ? 'Sign in to your account' : 'Make an account'}</h1>
      <div className="seg">
        <button type="button" className={`seg-btn${tab === 'in' ? ' on' : ''}`} aria-pressed={tab === 'in'} onClick={() => setTab('in')}>
          Sign in
        </button>
        <button type="button" className={`seg-btn${tab === 'new' ? ' on' : ''}`} aria-pressed={tab === 'new'} onClick={() => setTab('new')}>
          New account
        </button>
      </div>
      {tab === 'new' && (
        <>
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
        </>
      )}
      <label className="gu-label">
        Email
        <input className="gu-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </label>
      <label className="gu-label">
        Password{tab === 'new' && ' (at least 8 characters)'}
        <input
          className="gu-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={tab === 'new' ? 'new-password' : 'current-password'}
        />
      </label>
      {error && <p className="gu-error" role="alert">{error}</p>}
      {tab === 'new' && getPeople().children.length > 0 && (
        <p className="gu-muted">The children already on this device will be saved to your new account.</p>
      )}
      <button type="submit" className="gu-btn gu-btn-wide" disabled={!ready || busy}>
        {busy ? 'One moment…' : tab === 'in' ? 'Sign in' : 'Make my account'}
      </button>
    </form>
  );
}

/** After the first account sign-in on a device: choose the PIN that opens the grown-up area here. */
function PinForAccount() {
  const a = getAccount();
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="gu-form">
      <h1 className="auth-h">Welcome{a?.name ? `, ${a.name}` : ''}</h1>
      <p className="hint">Choose a 4-digit PIN for this device. You'll use it to open the grown-up area here.</p>
      <PinPad pin={pin} setPin={setPin} />
      <button
        type="button"
        className="gu-btn gu-btn-wide"
        disabled={pin.length < 4 || busy}
        onClick={async () => {
          setBusy(true);
          await createGrownUp(a?.name || 'Grown-up', a?.role ?? 'parent', pin);
          goGrownUp();
        }}
      >
        Save my PIN
      </button>
    </div>
  );
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
