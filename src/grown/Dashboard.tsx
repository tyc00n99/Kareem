import { useState } from 'react';
import { topics } from '../lib/content';
import { AVATARS, addChild, addClass, getPeople, removeClass, setRole, updateChild, type Child } from '../lib/people';
import { getRecords, statusOf } from '../lib/progress';
import { href } from '../lib/route';
import { GrownUpShell } from './Shell';

export function summary(childId: string) {
  const recs = getRecords(childId);
  const finished = topics.filter((t) => (recs[t.id]?.finished ?? 0) > 0).length;
  const mastered = topics.filter((t) => statusOf(recs[t.id]) === 'mastered').length;
  const help = topics.filter((t) => statusOf(recs[t.id]) === 'needs-help').length;
  const last = Object.values(recs)
    .map((r) => r.lastOpened ?? '')
    .sort()
    .pop();
  return { finished, mastered, help, last };
}

export const niceDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) : '';

export function Dashboard() {
  const [, refresh] = useState(0);
  const people = getPeople();
  const role = people.grownUp?.role ?? 'parent';
  const redraw = () => refresh((n) => n + 1);
  return (
    <GrownUpShell>
      {role === 'teacher' ? <Teacher redraw={redraw} /> : <Parent redraw={redraw} />}
      <p className="gu-switch">
        {role === 'teacher' ? 'Also a parent?' : 'Teaching a class?'}{' '}
        <button type="button" className="gu-link" onClick={() => { setRole(role === 'teacher' ? 'parent' : 'teacher'); redraw(); }}>
          Switch to the {role === 'teacher' ? 'parent' : 'teacher'} view
        </button>
      </p>
    </GrownUpShell>
  );
}

function ChildCard({ c, compact = false }: { c: Child; compact?: boolean }) {
  const s = summary(c.id);
  return (
    <a className={`gu-card child-card${compact ? ' child-card-compact' : ''}`} href={href({ name: 'child', childId: c.id })}>
      <span className="child-avatar" aria-hidden>{c.avatar}</span>
      <span className="child-info">
        <span className="child-name">{c.name}</span>
        <span className="gu-muted">
          ✅ {s.finished} of {topics.length} topics finished · 🏅 {s.mastered} mastered
          {s.help > 0 && <> · 🤝 {s.help} need help</>}
        </span>
        {s.last && <span className="gu-muted">Last learned {niceDate(s.last)}</span>}
      </span>
      <span className="gu-go">View →</span>
    </a>
  );
}

function AddChild({ classId, onAdd, title = 'Add a child' }: { classId?: string; onAdd: () => void; title?: string }) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  return (
    <form
      className="gu-card gu-form add-child"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        addChild(name, avatar, classId);
        setName('');
        onAdd();
      }}
    >
      <h2 className="gu-h2">{title}</h2>
      <label className="gu-label">
        Child's name
        <input className="gu-input" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <div>
        <p className="gu-label">Picture</p>
        <div className="avatar-row">
          {AVATARS.map((a) => (
            <button key={a} type="button" className={`avatar-btn${avatar === a ? ' on' : ''}`} aria-pressed={avatar === a} onClick={() => setAvatar(a)}>
              {a}
            </button>
          ))}
        </div>
      </div>
      <p className="gu-muted">Children don't need a password. They tap their picture on "I'm a kid".</p>
      <button type="submit" className="gu-btn" disabled={!name.trim()}>
        Add child
      </button>
    </form>
  );
}

function Parent({ redraw }: { redraw: () => void }) {
  const kids = getPeople().children;
  return (
    <>
      <h1 className="gu-h1">My children</h1>
      <div className="gu-grid">
        {kids.map((c) => (
          <ChildCard key={c.id} c={c} />
        ))}
        {kids.length === 0 && <p className="gu-muted">No children yet. Add one below.</p>}
      </div>
      <AddChild onAdd={redraw} />
    </>
  );
}

function Teacher({ redraw }: { redraw: () => void }) {
  const { classes, children } = getPeople();
  const [name, setName] = useState('');
  const [adding, setAdding] = useState<string | null>(null);
  const unassigned = children.filter((c) => !c.classId || !classes.some((k) => k.id === c.classId));
  return (
    <>
      <div className="gu-head">
        <h1 className="gu-h1">My classes</h1>
      </div>
      <div className="gu-stack">
        {classes.map((k) => {
          const students = children.filter((c) => c.classId === k.id);
          return (
            <section key={k.id} className="gu-card class-card">
              <div className="gu-head">
                <h2 className="gu-h2">{k.name}</h2>
                <span className="gu-pill">
                  {students.length} {students.length === 1 ? 'student' : 'students'}
                </span>
              </div>
              <div className="gu-grid">
                {students.map((c) => (
                  <ChildCard key={c.id} c={c} compact />
                ))}
                {students.length === 0 && <p className="gu-muted">No students yet.</p>}
              </div>
              <div className="class-actions">
                <button type="button" className="gu-btn gu-btn-ghost" onClick={() => setAdding(adding === k.id ? null : k.id)}>
                  + Add a student
                </button>
                {unassigned.length > 0 && (
                  <select
                    className="gu-input gu-select"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        updateChild(e.target.value, { classId: k.id });
                        redraw();
                      }
                    }}
                    aria-label="Move a child into this class"
                  >
                    <option value="">Move a child here…</option>
                    {unassigned.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.avatar} {c.name}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  className="gu-link"
                  onClick={() => {
                    if (window.confirm(`Remove the class "${k.name}"? Students and their learning stay.`)) {
                      removeClass(k.id);
                      redraw();
                    }
                  }}
                >
                  Remove class
                </button>
              </div>
              {adding === k.id && (
                <AddChild
                  classId={k.id}
                  title={`Add a student to ${k.name}`}
                  onAdd={() => {
                    setAdding(null);
                    redraw();
                  }}
                />
              )}
            </section>
          );
        })}
        <form
          className="new-class"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            addClass(name);
            setName('');
            redraw();
          }}
        >
          <input className="gu-input" placeholder="New class name" value={name} onChange={(e) => setName(e.target.value)} />
          <button type="submit" className="gu-btn" disabled={!name.trim()}>
            Create class
          </button>
        </form>
      </div>

      {unassigned.length > 0 && (
        <>
          <h2 className="gu-h2 gu-space">Children not in a class</h2>
          <div className="gu-grid">
            {unassigned.map((c) => (
              <ChildCard key={c.id} c={c} compact />
            ))}
          </div>
        </>
      )}
      {classes.length === 0 && children.length === 0 && (
        <p className="gu-muted gu-space">Create a class, then add your students. Each student picks their picture to start learning on this device.</p>
      )}
    </>
  );
}
