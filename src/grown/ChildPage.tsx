import { useState } from 'react';
import { childPrefs } from '../lib/plan';
import { allTopics, getTopic, getWorld, topics, topicsIn, worlds } from '../lib/content';
import { clearRecordsOnline, getAccount, joinClass } from '../lib/cloud';
import { AVATARS, getChild, getPeople, removeChild, setActiveChild, updateChild, type ChildProfile } from '../lib/people';
import { clearRecords, getRecords, statusOf, type Status } from '../lib/progress';
import { go, href } from '../lib/route';
import { useSettings } from '../lib/settings';
import { niceDate } from './Dashboard';
import { GrownUpShell } from './Shell';

const STATUS: Record<Status, { label: string; cls: string; help: string }> = {
  new: { label: 'Not started', cls: 'st-new', help: 'Not opened yet.' },
  learning: { label: 'Learning', cls: 'st-learning', help: 'Opened or finished, still practising.' },
  'needs-help': { label: 'Needs help', cls: 'st-help', help: 'More questions needed a second try than not.' },
  mastered: { label: 'Mastered', cls: 'st-mastered', help: 'Finished at least twice, last time with every question right first try.' },
};


export function ChildPage({ childId }: { childId: string }) {
  const [, refresh] = useState(0);
  const redraw = () => refresh((n) => n + 1);
  const child = getChild(childId);
  const { update } = useSettings();
  if (!child) {
    return (
      <GrownUpShell>
        <a className="gu-link" href="#/grown-up">← Back</a>
        <p className="gu-muted">This child is not on this device any more.</p>
      </GrownUpShell>
    );
  }
  const recs = getRecords(child.id);
  // The hand-made topics always show; world lessons show once the child has opened them.
  const rows = allTopics
    .filter((t) => topics.includes(t) || recs[t.id])
    .map((t) => ({ t, r: recs[t.id], s: statusOf(recs[t.id]) }));
  const counts = rows.reduce((a, x) => ({ ...a, [x.s]: (a[x.s] ?? 0) + 1 }), {} as Record<Status, number>);
  const klass = getPeople().classes.find((k) => k.id === child.classId);
  const p = child.profile;

  const setProfile = (patch: Partial<ChildProfile>) => {
    updateChild(child.id, { profile: { ...p, ...patch } });
    redraw();
  };

  const startLearning = () => {
    setActiveChild(child.id);
    const prefs = childPrefs(child.profile);
    if (Object.keys(prefs).length) update(prefs);
    go({ name: 'home' });
  };

  return (
    <GrownUpShell>
      <a className="gu-link" href="#/grown-up">← Back</a>
      <div className="child-head">
        <span className="child-avatar child-avatar-big" aria-hidden>{child.avatar}</span>
        <div className="child-head-text">
          <p className="gu-kicker">Kareem Learning Explorer · Progress</p>
          <h1 className="gu-h1">{child.name}</h1>
          <p className="gu-muted">{klass ? `In ${klass.name}` : 'Learning at home'} · added {niceDate(child.added)}</p>
        </div>
        <button type="button" className="gu-btn" onClick={startLearning}>
          Start learning as {child.name} →
        </button>
      </div>

      <div className="status-tiles">
        {(Object.keys(STATUS) as Status[]).map((s) => (
          <div key={s} className={`status-tile ${STATUS[s].cls}`} title={STATUS[s].help}>
            <span className="status-n">{counts[s] ?? 0}</span>
            <span className="status-l">{STATUS[s].label}</span>
          </div>
        ))}
      </div>

      <h2 className="gu-h2 gu-space">Topics</h2>
      <p className="gu-muted">
        The child never sees scores. These notes are only for you. "First try" counts question screens answered right
        straight away.
      </p>
      <div className="gu-table-wrap">
        <table className="gu-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Times started</th>
              <th>Furthest screen</th>
              <th>Finished</th>
              <th>Questions</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ t, r, s }) => (
              <tr key={t.id}>
                <td>
                  <strong>{t.title}</strong>
                  {t.world && <span className="gu-muted gu-block">{getWorld(t.world)?.title}</span>}
                  {r?.lastOpened && <span className="gu-muted gu-block">Last opened {niceDate(r.lastOpened)}</span>}
                </td>
                <td>{r?.opened ?? 0}</td>
                <td>
                  {r?.furthest ?? 0} of {t.screens.length}
                </td>
                <td>{r?.finished ? `${r.finished}×` : '—'}</td>
                <td>{r && r.firstTry + r.tryAgain > 0 ? `${r.firstTry} first try · ${r.tryAgain} tried again` : '—'}</td>
                <td>
                  <span className={`st-chip ${STATUS[s].cls}`}>{STATUS[s].label}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Picked childId={child.id} name={child.name} assigned={p.assigned ?? []} onChange={(assigned) => setProfile({ assigned })} />

      <a className="gu-card plan-link gu-space" href={href({ name: 'plan', childId: child.id })}>
        <span>
          <strong className="gu-h2">Learning plan and settings</strong>
          <span className="gu-muted gu-block">
            What helps {child.name}, how much help to give in lessons, screen and sound settings, Talk buttons and goals.
          </span>
        </span>
        <span className="gu-go">Open →</span>
      </a>

      <section className="gu-card gu-form gu-space">
        <h2 className="gu-h2">Picture and name</h2>
        <label className="gu-label">
          Name
          <input className="gu-input" value={child.name} onChange={(e) => { updateChild(child.id, { name: e.target.value }); redraw(); }} />
        </label>
        <div className="avatar-row">
          {AVATARS.map((a) => (
            <button key={a} type="button" className={`avatar-btn${child.avatar === a ? ' on' : ''}`} aria-pressed={child.avatar === a} onClick={() => { updateChild(child.id, { avatar: a }); redraw(); }}>
              {a}
            </button>
          ))}
        </div>
        {getAccount() && !child.notMine && <JoinClass childId={child.id} name={child.name} current={klass?.name} onDone={redraw} />}
        <div className="class-actions">
          <button
            type="button"
            className="gu-link"
            onClick={() => {
              if (window.confirm(`Clear ${child.name}'s learning records? This cannot be undone.`)) {
                clearRecords(child.id);
                void clearRecordsOnline(child.id);
                redraw();
              }
            }}
          >
            Clear learning records
          </button>
          <button
            type="button"
            className="gu-link gu-danger"
            onClick={() => {
              if (window.confirm(child.notMine ? `Take ${child.name} out of your class?` : getAccount() ? `Remove ${child.name} and their learning from your account?` : `Remove ${child.name} from this device?`)) {
                removeChild(child.id);
                clearRecords(child.id);
                go({ name: 'grown' });
              }
            }}
          >
            {child.notMine ? `Take ${child.name} out of my class` : `Remove ${child.name}`}
          </button>
        </div>
      </section>
    </GrownUpShell>
  );
}


/** Lessons a grown-up picks. They come first on the child's First / Then schedule, in this order. */
function Picked({ childId, name, assigned, onChange }: { childId: string; name: string; assigned: string[]; onChange: (a: string[]) => void }) {
  const [world, setWorld] = useState(worlds[0]?.id ?? '');
  const finished = getRecords(childId);
  const options = topicsIn(world).filter((t) => !assigned.includes(t.id));
  return (
    <section className="gu-card gu-form gu-space">
      <h2 className="gu-h2">Lessons picked for {name}</h2>
      <p className="gu-muted">These show first on {name}'s First / Then schedule. Finished ones move to the end.</p>
      {assigned.length > 0 ? (
        <ol className="picked">
          {assigned.map((id, n) => {
            const t = getTopic(id);
            if (!t) return null;
            return (
              <li key={id}>
                <span>
                  {t.picture.emoji ?? '📘'} {t.title}
                  {finished[id]?.finished ? <span className="gu-muted"> · finished</span> : null}
                </span>
                <span className="picked-actions">
                  <button type="button" className="gu-link" disabled={n === 0} aria-label={`Move ${t.title} up`} onClick={() => { const a = [...assigned]; [a[n - 1], a[n]] = [a[n], a[n - 1]]; onChange(a); }}>↑</button>
                  <button type="button" className="gu-link" aria-label={`Remove ${t.title}`} onClick={() => onChange(assigned.filter((x) => x !== id))}>Remove</button>
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="gu-muted">Nothing picked yet. The schedule follows the usual order.</p>
      )}
      <div className="picked-add">
        <select className="gu-input gu-select" value={world} onChange={(e) => setWorld(e.target.value)} aria-label="Learning world">
          {worlds.map((w) => (
            <option key={w.id} value={w.id}>{w.title}</option>
          ))}
        </select>
        <select
          className="gu-input gu-select"
          value=""
          aria-label="Add a lesson"
          onChange={(e) => e.target.value && onChange([...assigned, e.target.value])}
        >
          <option value="">Add a lesson…</option>
          {options.map((t) => (
            <option key={t.id} value={t.id}>{t.picture.emoji ?? ''} {t.title}</option>
          ))}
        </select>
      </div>
    </section>
  );
}

function JoinClass({ childId, name, current, onDone }: { childId: string; name: string; current?: string; onDone: () => void }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="join-class"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const err = await joinClass(childId, code);
        setBusy(false);
        setMsg(err ?? `${name} is now in the class.`);
        if (!err) {
          setCode('');
          onDone();
        }
      }}
    >
      <label className="gu-label">
        {current ? `${name} is in ${current}. Change class with a code:` : `Join a teacher's class with their class code`}
        <input className="gu-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. 7F3K2A" maxLength={6} />
      </label>
      <button type="submit" className="gu-btn" disabled={code.trim().length < 6 || busy}>Join class</button>
      {msg && <p className="gu-muted" role="status">{msg}</p>}
      <p className="gu-muted">The teacher can then see {name}'s learning and settings, and help with them.</p>
    </form>
  );
}
