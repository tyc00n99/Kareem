import { useState } from 'react';
import { ABA_TIPS } from './aba-tips';
import { GrownUpShell } from './Shell';

export function Tips() {
  const [group, setGroup] = useState(ABA_TIPS[0].id);
  const g = ABA_TIPS.find((x) => x.id === group) ?? ABA_TIPS[0];
  return (
    <GrownUpShell>
      <h1 className="gu-h1">ABA tips & tricks</h1>
      <p className="gu-muted">Simple ways to use ABA-informed strategies at home and in class. Always follow your child's BCBA plan first.</p>
      <div className="tip-tabs" role="tablist">
        {ABA_TIPS.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={x.id === group} className={`tip-tab${x.id === group ? ' on' : ''}`} onClick={() => setGroup(x.id)}>
            {x.title}
          </button>
        ))}
      </div>
      <div className="gu-two">
        {g.tips.map((t) => (
          <article key={t.title} className="gu-card tip">
            <div className="tip-head">
              <span className="tip-emoji" aria-hidden>{t.emoji}</span>
              <h2 className="gu-h2">{t.title}</h2>
            </div>
            <p>{t.what}</p>
            <ul className="tip-how">
              {t.how.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </GrownUpShell>
  );
}
