import { Pic } from '../components';
import { topics } from '../lib/content';
import { getFinished } from '../lib/progress';
import { go, href } from '../lib/route';

export function Home() {
  const finished = getFinished();
  return (
    <div className="frame">
      <header className="bar top-bar">
        <span />
        <h1 className="bar-title">Deen Steps</h1>
        <button type="button" className="btn btn-plain" onClick={() => go({ name: 'settings' })}>
          Settings
        </button>
      </header>
      <main className="home">
        <div className="hero">
          <img src="/content/images/art/together.jpg" alt="Two children sitting together on a prayer mat under the moon" />
          <p className="hero-line">Learning Islam, one calm step at a time.</p>
        </div>
        <p className="lead">Choose what to learn.</p>
        <ul className="topic-list">
          {topics.map((t) => (
            <li key={t.id}>
              <a className="topic" href={href({ name: 'learn', topicId: t.id, index: 0 })}>
                <Pic picture={t.picture} adultPicture={t.adultPicture} size="card" />
                <span className="topic-text">
                  <span className="topic-title">{t.title}</span>
                  <span className="topic-summary">{t.summary}</span>
                </span>
                {finished[t.id] && <span className="tick">✓ Finished</span>}
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
