import { useState } from 'react';
import { topics } from '../lib/content';
import { AVATARS, getChild, getPeople, removeChild, setActiveChild, updateChild, type ChildProfile } from '../lib/people';
import { clearRecords, getRecords, statusOf, type Status } from '../lib/progress';
import { go } from '../lib/route';
import { useSettings } from '../lib/settings';
import { niceDate } from './Dashboard';
import { GrownUpShell } from './Shell';

const STATUS: Record<Status, { label: string; cls: string; help: string }> = {
  new: { label: 'Not started', cls: 'st-new', help: 'Not opened yet.' },
  learning: { label: 'Learning', cls: 'st-learning', help: 'Opened or finished, still practising.' },
  'needs-help': { label: 'Needs help', cls: 'st-help', help: 'More questions needed a second try than not.' },
  mastered: { label: 'Mastered', cls: 'st-mastered', help: 'Finished at least twice, last time with every question right first try.' },
};

const TAGS = ['light-sensitive', 'sound-sensitive', 'prefers quiet', 'needs movement breaks', 'likes music', 'hands-on', 'non-speaking', 'uses AAC', 'routine helps'];

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
  const rows = topics.map((t) => ({ t, r: recs[t.id], s: statusOf(recs[t.id]) }));
  const counts = rows.reduce((a, x) => ({ ...a, [x.s]: (a[x.s] ?? 0) + 1 }), {} as Record<Status, number>);
  const klass = getPeople().classes.find((k) => k.id === child.classId);
  const p = child.profile;

  const setProfile = (patch: Partial<ChildProfile>) => {
    updateChild(child.id, { profile: { ...p, ...patch } });
    redraw();
  };
  const toggleTag = (tag: string) => {
    const tags = new Set(p.tags ?? []);
    if (tags.has(tag)) tags.delete(tag);
    else tags.add(tag);
    // Helpful defaults: light-sensitive dims the screen, sound-sensitive slows speech and calms things down.
    const extra: Partial<ChildProfile> = {};
    if (tag === 'light-sensitive' && tags.has(tag) && (!p.dim || p.dim === 'off')) extra.dim = 'some';
    if (tag === 'sound-sensitive' && tags.has(tag)) extra.calm = true;
    setProfile({ tags: [...tags], ...extra });
  };

  const startLearning = () => {
    setActiveChild(child.id);
    const { tags: _t, notes: _n, ...prefs } = child.profile;
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

      <div className="gu-two gu-space">
        <section className="gu-card gu-form">
          <h2 className="gu-h2">Learning profile</h2>
          <p className="gu-muted">What helps {child.name}? Tap all that fit. Some set helpful options below.</p>
          <div className="tag-row">
            {TAGS.map((tag) => (
              <button key={tag} type="button" className={`tag${p.tags?.includes(tag) ? ' on' : ''}`} aria-pressed={!!p.tags?.includes(tag)} onClick={() => toggleTag(tag)}>
                {tag}
              </button>
            ))}
          </div>
          <label className="gu-label">
            Notes for anyone helping
            <textarea
              className="gu-input gu-textarea"
              value={p.notes ?? ''}
              placeholder="e.g. Loves the moon. Gets upset with loud water. Use a calm voice."
              onChange={(e) => setProfile({ notes: e.target.value })}
            />
          </label>
        </section>

        <section className="gu-card gu-form">
          <h2 className="gu-h2">Sensory settings</h2>
          <p className="gu-muted">These switch on when {child.name} starts learning on this device.</p>
          <Seg label="Dim the light" value={p.dim ?? 'off'} options={[['off', 'Off'], ['some', 'A little'], ['more', 'More']]} onChange={(v) => setProfile({ dim: v })} />
          <Seg label="Calm mode" value={p.calm ? 'on' : 'off'} options={[['on', 'On'], ['off', 'Off']]} onChange={(v) => setProfile({ calm: v === 'on' })} />
          <Seg label="Sound" value={p.sound === false ? 'off' : 'on'} options={[['on', 'On'], ['off', 'Off']]} onChange={(v) => setProfile({ sound: v === 'on' })} />
          <Seg label="Reading speed" value={p.speechRate ?? 'slow'} options={[['slow', 'Slow'], ['normal', 'Normal']]} onChange={(v) => setProfile({ speechRate: v })} />
          <Seg label="Text size" value={p.textSize ?? 'normal'} options={[['normal', 'Normal'], ['large', 'Large'], ['larger', 'Larger']]} onChange={(v) => setProfile({ textSize: v })} />
          <Seg label="Strong colours" value={p.highContrast ? 'on' : 'off'} options={[['on', 'On'], ['off', 'Off']]} onChange={(v) => setProfile({ highContrast: v === 'on' })} />
        </section>
      </div>

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
        <div className="class-actions">
          <button
            type="button"
            className="gu-link"
            onClick={() => {
              if (window.confirm(`Clear ${child.name}'s learning records? This cannot be undone.`)) {
                clearRecords(child.id);
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
              if (window.confirm(`Remove ${child.name} from this device?`)) {
                removeChild(child.id);
                clearRecords(child.id);
                go({ name: 'grown' });
              }
            }}
          >
            Remove {child.name}
          </button>
        </div>
      </section>
    </GrownUpShell>
  );
}

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <fieldset className="gu-seg">
      <legend>{label}</legend>
      <div className="seg">
        {options.map(([v, text]) => (
          <button key={v} type="button" className={`seg-btn${value === v ? ' on' : ''}`} aria-pressed={value === v} onClick={() => onChange(v)}>
            {text}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
