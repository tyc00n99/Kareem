import { Pic } from '../components';
import { topics } from '../lib/content';
import { getFinished } from '../lib/progress';
import { go, href } from '../lib/route';

function niceDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
  } catch {
    return '';
  }
}

/** A plain progress page for a parent, carer or support worker. */
export function Helper() {
  const finished = getFinished();
  const done = topics.filter((t) => finished[t.id]).length;
  return (
    <div className="frame">
      <header className="bar top-bar">
        <button type="button" className="btn btn-plain" onClick={() => go({ name: 'home' })}>
          Home
        </button>
        <h1 className="bar-title">For helpers</h1>
        <span className="count" />
      </header>
      <main className="home">
        <p className="lead">
          {done} of {topics.length} topics finished.
        </p>
        <ul className="helper-list">
          {topics.map((t) => (
            <li key={t.id} className="helper-row">
              <Pic picture={t.picture} adultPicture={t.adultPicture} size="small" />
              <span className="topic-text">
                <span className="topic-title">{t.title}</span>
                <span className="topic-summary">
                  {finished[t.id] ? `Finished on ${niceDate(finished[t.id])}` : 'Not finished yet'}
                </span>
              </span>
              <a className="btn btn-plain helper-open" href={href({ name: 'learn', topicId: t.id, index: 0 })}>
                Open
              </a>
            </li>
          ))}
        </ul>
        <p className="hint">
          Progress is saved on this device only. The learner can use the app fully on their own.
        </p>
      </main>
    </div>
  );
}
