import { useState } from 'react';
import { KidTools } from '../components';
import { topicsIn, type Topic, type World } from '../lib/content';
import { getFinished } from '../lib/progress';
import { href } from '../lib/route';
import { useSettings } from '../lib/settings';

/** How many lessons show at first. A short list is calmer; "Show more" adds the next few. */
const PAGE = 12;

function LessonPic({ topic, adult }: { topic: Topic; adult: boolean }) {
  const p = adult && topic.adultPicture ? topic.adultPicture : topic.picture;
  return p.src ? (
    <img className="after-pic" src={p.src} alt="" loading="lazy" />
  ) : (
    <span className="after-pic thumb-emoji world-emoji" aria-hidden>
      {p.emoji}
    </span>
  );
}

export function WorldScreen({ world }: { world: World }) {
  const { settings } = useSettings();
  const adult = settings.look === 'adult';
  const finished = getFinished();
  const all = topicsIn(world.id);
  const [shown, setShown] = useState(PAGE);
  const list = all.slice(0, shown);
  // Group headings (used by Everyday tasks), in the order they first appear.
  const groups: { name: string; items: Topic[] }[] = [];
  for (const t of list) {
    const name = t.group ?? '';
    const g = groups.find((x) => x.name === name);
    if (g) g.items.push(t);
    else groups.push({ name, items: [t] });
  }
  const p = world.picture;

  return (
    <div className="frame home-frame">
      <header className="bar top-bar home-bar">
        <a className="btn btn-plain" href="#/">
          Home
        </a>
        <KidTools compact />
        <a className="pill pill-icon" href="#/settings" aria-label="Settings">
          ⚙️
        </a>
      </header>
      <main className="home">
        <section className="world-head">
          {p.src ? (
            <img className="world-pic" src={p.src} alt={p.alt} />
          ) : (
            <span className="world-pic thumb-emoji" role="img" aria-label={p.alt}>
              {p.emoji}
            </span>
          )}
          <div>
            <h1 className="h2 world-title">{world.title}</h1>
            <p className="topic-summary">{world.summary}</p>
            <p className="topic-summary">{all.length} lessons</p>
          </div>
        </section>

        {groups.map((g) => (
          <section className="block" key={g.name || 'all'}>
            {g.name && <h2 className="h2">{g.name}</h2>}
            <ol className="after">
              {g.items.map((t) => (
                <li key={t.id}>
                  <a className="after-row" href={href({ name: 'learn', topicId: t.id, index: 0 })}>
                    <LessonPic topic={t} adult={adult} />
                    <span className="after-title">{t.title}</span>
                    {finished[t.id] && (
                      <span className="tick world-tick" aria-label="finished">
                        ✓
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ol>
          </section>
        ))}

        {shown < all.length && (
          <p className="block world-more">
            <button type="button" className="btn btn-plain" onClick={() => setShown((n) => n + PAGE)}>
              Show more lessons
            </button>
          </p>
        )}
      </main>
    </div>
  );
}
