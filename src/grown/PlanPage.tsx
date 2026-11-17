import { useState } from 'react';
import { allTopics, getTopic } from '../lib/content';
import { getChild, updateChild, type ChildProfile } from '../lib/people';
import { planOf, type Plan } from '../lib/plan';
import { href } from '../lib/route';
import { GrownUpShell } from './Shell';

const TAGS = ['light-sensitive', 'sound-sensitive', 'prefers quiet', 'needs movement breaks', 'likes music', 'hands-on', 'non-speaking', 'uses AAC', 'routine helps'];
const LEARNS = ['visual', 'audio', 'hands-on', 'routine', 'music', 'movement'];
const TABS = [
  ['profile', 'Learning profile'],
  ['help', 'Help in lessons'],
  ['senses', 'Screen and sound'],
  ['goals', 'Goals and Talk'],
] as const;
type Tab = (typeof TABS)[number][0];

/** The per-child settings page: learning profile, prompting and fading, sensory settings, goals. */
export function PlanPage({ childId }: { childId: string }) {
  const [, refresh] = useState(0);
  const [tab, setTab] = useState<Tab>('profile');
  const child = getChild(childId);
  if (!child) {
    return (
      <GrownUpShell>
        <a className="gu-link" href="#/grown-up">← Back</a>
        <p className="gu-muted">This child is not on this device any more.</p>
      </GrownUpShell>
    );
  }
  const p = child.profile;
  const plan = planOf(p);
  const setProfile = (patch: Partial<ChildProfile>) => {
    updateChild(child.id, { profile: { ...getChild(child.id)!.profile, ...patch } });
    refresh((n) => n + 1);
  };
  const setPlan = (patch: Partial<Plan>) => setProfile({ plan: { ...p.plan, ...patch } });
  const toggleTag = (tag: string) => {
    const tags = new Set(p.tags ?? []);
    if (tags.has(tag)) tags.delete(tag);
    else tags.add(tag);
    // Helpful defaults: light-sensitive dims the screen, sound-sensitive calms things down.
    const extra: Partial<ChildProfile> = {};
    if (tag === 'light-sensitive' && tags.has(tag) && (!p.dim || p.dim === 'off')) extra.dim = 'some';
    if (tag === 'sound-sensitive' && tags.has(tag)) extra.calm = true;
    setProfile({ tags: [...tags], ...extra });
  };

  return (
    <GrownUpShell>
      <a className="gu-link" href={href({ name: 'child', childId: child.id })}>← Back to {child.name}'s progress</a>
      <div className="child-head">
        <span className="child-avatar child-avatar-big" aria-hidden>{child.avatar}</span>
        <div className="child-head-text">
          <p className="gu-kicker">Learning plan</p>
          <h1 className="gu-h1">{child.name}'s learning plan</h1>
          <p className="gu-muted">
            ABA-informed settings. Follow {child.name}'s BCBA or therapist plan where there is one. Changes save straight
            away{child.cloud ? ' and are shared with everyone who helps ' + child.name : ''}.
          </p>
        </div>
      </div>

      <div className="plan-tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={`plan-tab${tab === id ? ' on' : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="gu-two">
          <section className="gu-card gu-form">
            <h2 className="gu-h2">Communication and learning</h2>
            <label className="gu-label">
              Communication
              <select className="gu-input gu-select" value={plan.communication} onChange={(e) => setPlan({ communication: e.target.value as Plan['communication'] })}>
                <option value="speaking">Speaking</option>
                <option value="minimally-speaking">Minimally speaking</option>
                <option value="aac">AAC or picture buttons</option>
                <option value="sign">Sign or gestures</option>
                <option value="mixed">Mixed</option>
              </select>
            </label>
            <div>
              <p className="gu-label">Learns best with</p>
              <Chips options={LEARNS} value={plan.learnsWith} onChange={(learnsWith) => setPlan({ learnsWith })} />
            </div>
            <label className="gu-label">
              Skill level now
              <select className="gu-input gu-select" value={plan.skill} onChange={(e) => setPlan({ skill: e.target.value as Plan['skill'] })}>
                <option value="beginner">Beginner</option>
                <option value="developing">Developing</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
          </section>
          <section className="gu-card gu-form">
            <h2 className="gu-h2">What helps {child.name}</h2>
            <p className="gu-muted">Tap all that fit. Some switch on helpful screen and sound settings.</p>
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
        </div>
      )}

      {tab === 'help' && (
        <div className="gu-two">
          <section className="gu-card gu-form">
            <h2 className="gu-h2">Answering in lessons</h2>
            <Seg
              label="How does the child answer “Which picture shows this step?”"
              value={plan.answerMode}
              options={[
                ['both', 'Pictures, and “I did it” for everyday tasks'],
                ['choice', 'Always pick a picture'],
                ['tap', 'Always “I did it”'],
              ]}
              onChange={(answerMode) => setPlan({ answerMode })}
            />
            <Seg
              label="Errorless learning: after a wrong tap, show the right picture straight away"
              value={plan.errorless ? 'on' : 'off'}
              options={[['on', 'On'], ['off', 'Off']]}
              onChange={(v) => setPlan({ errorless: v === 'on' })}
            />
            <Seg
              label="Say “Yes!” after a right answer"
              value={plan.praise ? 'on' : 'off'}
              options={[['on', 'On'], ['off', 'Off']]}
              onChange={(v) => setPlan({ praise: v === 'on' })}
            />
          </section>
          <section className="gu-card gu-form">
            <h2 className="gu-h2">Help and fading</h2>
            <label className="gu-label">
              Wait before gently showing the right picture: {plan.waitSec ? `${plan.waitSec} seconds` : 'never'}
              <input type="range" min={0} max={30} step={1} value={plan.waitSec} onChange={(e) => setPlan({ waitSec: Number(e.target.value) })} />
            </label>
            <label className="gu-label">
              Stop that help after this many lessons finished with every answer right first time
              <input
                className="gu-input"
                type="number"
                min={1}
                max={10}
                value={plan.fadeAfter}
                onChange={(e) => setPlan({ fadeAfter: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })}
              />
            </label>
            <Seg
              label={`${child.name} depends on this help: never fade it`}
              value={plan.keepHelp ? 'on' : 'off'}
              options={[['on', 'Keep it'], ['off', 'Fade it']]}
              onChange={(v) => setPlan({ keepHelp: v === 'on' })}
            />
            <p className="gu-muted">
              The help fades for each lesson on its own, as {child.name} masters it. If {child.name} starts to make mistakes
              again, it comes back.
            </p>
          </section>
        </div>
      )}

      {tab === 'senses' && (
        <div className="gu-two">
          <section className="gu-card gu-form">
            <h2 className="gu-h2">Screen</h2>
            <p className="gu-muted">These switch on when {child.name} starts learning on a device.</p>
            <Seg label="Dim the light" value={p.dim ?? 'off'} options={[['off', 'Off'], ['some', 'A little'], ['more', 'More']]} onChange={(v) => setProfile({ dim: v })} />
            <Seg label="Calm mode (soft colours, no movement)" value={p.calm ? 'on' : 'off'} options={[['on', 'On'], ['off', 'Off']]} onChange={(v) => setProfile({ calm: v === 'on' })} />
            <Seg label="Gentle movement" value={p.motion ? 'on' : 'off'} options={[['on', 'On'], ['off', 'Off']]} onChange={(v) => setProfile({ motion: v === 'on' })} />
            <Seg label="Text size" value={p.textSize ?? 'normal'} options={[['normal', 'Normal'], ['large', 'Large'], ['larger', 'Larger']]} onChange={(v) => setProfile({ textSize: v })} />
            <Seg label="Strong colours" value={p.highContrast ? 'on' : 'off'} options={[['on', 'On'], ['off', 'Off']]} onChange={(v) => setProfile({ highContrast: v === 'on' })} />
            <Seg
              label="Simple home screen (only First / Then, fewer choices)"
              value={plan.simpleHome ? 'on' : 'off'}
              options={[['on', 'On'], ['off', 'Off']]}
              onChange={(v) => setPlan({ simpleHome: v === 'on' })}
            />
          </section>
          <section className="gu-card gu-form">
            <h2 className="gu-h2">Sound</h2>
            <Seg label="Sound" value={p.sound === false ? 'off' : 'on'} options={[['on', 'On'], ['off', 'Off']]} onChange={(v) => setProfile({ sound: v === 'on' })} />
            <Seg label="Reading speed" value={p.speechRate ?? 'slow'} options={[['slow', 'Slow'], ['normal', 'Normal']]} onChange={(v) => setProfile({ speechRate: v })} />
            <p className="gu-muted">With sound off, every lesson still works with pictures and words only.</p>
          </section>
        </div>
      )}

      {tab === 'goals' && <GoalsAndTalk name={child.name} plan={plan} setPlan={setPlan} />}
    </GrownUpShell>
  );
}

function GoalsAndTalk({ name, plan, setPlan }: { name: string; plan: Plan; setPlan: (p: Partial<Plan>) => void }) {
  const [text, setText] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [emoji, setEmoji] = useState('💧');
  const [label, setLabel] = useState('');
  return (
    <div className="gu-two">
      <section className="gu-card gu-form">
        <h2 className="gu-h2">Goals</h2>
        <p className="gu-muted">Short, clear goals help everyone work the same way with {name}.</p>
        {plan.goals.length > 0 ? (
          <ul className="picked">
            {plan.goals.map((g, n) => (
              <li key={n}>
                <span>
                  🎯 {g.text}
                  {g.lessonId && getTopic(g.lessonId) && <span className="gu-muted"> · {getTopic(g.lessonId)!.title}</span>}
                </span>
                <span className="picked-actions">
                  <button type="button" className="gu-link" onClick={() => setPlan({ goals: plan.goals.filter((_, k) => k !== n) })}>
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="gu-muted">No goals yet.</p>
        )}
        <form
          className="gu-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            setPlan({ goals: [...plan.goals, { text: text.trim(), lessonId: lessonId || undefined }] });
            setText('');
            setLessonId('');
          }}
        >
          <label className="gu-label">
            New goal
            <input className="gu-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Washes hands for wudu with one reminder" />
          </label>
          <label className="gu-label">
            Linked lesson (optional)
            <select className="gu-input gu-select" value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
              <option value="">None</option>
              {allTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="gu-btn" disabled={!text.trim()}>
            Add goal
          </button>
        </form>
      </section>
      <section className="gu-card gu-form">
        <h2 className="gu-h2">Extra Talk buttons</h2>
        <p className="gu-muted">Help, Break, Stop, Yes, No, Finished, Drink, Toilet and Hurt are always on the Talk board.</p>
        {plan.talkButtons.length > 0 && (
          <ul className="picked">
            {plan.talkButtons.map((b, n) => (
              <li key={n}>
                <span>
                  {b.emoji} {b.label}
                </span>
                <span className="picked-actions">
                  <button type="button" className="gu-link" onClick={() => setPlan({ talkButtons: plan.talkButtons.filter((_, k) => k !== n) })}>
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <form
          className="talk-add"
          onSubmit={(e) => {
            e.preventDefault();
            if (!label.trim()) return;
            setPlan({ talkButtons: [...plan.talkButtons, { emoji: emoji.trim() || '💬', label: label.trim() }] });
            setLabel('');
          }}
        >
          <input className="gu-input talk-emoji-in" value={emoji} onChange={(e) => setEmoji(e.target.value)} aria-label="Picture (an emoji)" maxLength={4} />
          <input className="gu-input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Hug" aria-label="Word" />
          <button type="submit" className="gu-btn" disabled={!label.trim()}>
            Add
          </button>
        </form>
      </section>
    </div>
  );
}

function Chips({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="tag-row">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button key={o} type="button" className={`tag${on ? ' on' : ''}`} aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}>
            {o}
          </button>
        );
      })}
    </div>
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
