import { KidTools } from '../components';
import { GAMES, STAGES, gameKey, type Activity } from '../lib/activities';
import { getFinished } from '../lib/progress';
import { href } from '../lib/route';

function Shell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
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
        <h1 className="h2 world-title">{title}</h1>
        <p className="topic-summary">{sub}</p>
        {children}
      </main>
    </div>
  );
}

function Row({ a, id, n }: { a: Activity; id: string; n?: number }) {
  const finished = getFinished();
  const arabic = /[؀-ۿ]/.test(a.emoji);
  return (
    <li>
      <a className="after-row" href={href({ name: 'play', id })}>
        {n !== undefined && <span className="after-num">{n}</span>}
        <span className={`after-pic thumb-emoji world-emoji${arabic ? ' play-arabic-thumb' : ''}`} aria-hidden lang={arabic ? 'ar' : undefined}>
          {a.emoji}
        </span>
        <span className="after-title">{a.title}</span>
        {finished[id] && (
          <span className="tick world-tick" aria-label="finished">
            ✓
          </span>
        )}
      </a>
    </li>
  );
}

/** Calm learning games: each has one clear goal. No scores, no timers. */
export function Games() {
  return (
    <Shell title="🎮 Games" sub="Calm games to practise. No timers, no scores.">
      <ol className="after block">
        {GAMES.map((g) => (
          <Row key={g.id} a={g} id={gameKey(g)} />
        ))}
      </ol>
    </Shell>
  );
}

/** The Arabic path: letters, their shapes, reading, then words from the Quran. */
export function ArabicPath() {
  return (
    <Shell title="🔤 Arabic path" sub="From letters to words from the Quran, one small step at a time.">
      {STAGES.map((s) => (
        <section key={s.id} className="block">
          <h2 className="h2">{s.title}</h2>
          <p className="topic-summary">{s.blurb}</p>
          <ol className="after">
            {s.levels.map((l, k) => (
              <Row key={l.id} a={l} id={l.id} n={k + 1} />
            ))}
          </ol>
        </section>
      ))}
    </Shell>
  );
}
