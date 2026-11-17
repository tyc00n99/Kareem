import { KidTools, Mascot } from '../components';
import { getTopic, topics, topicsIn, worlds, type Topic, type World } from '../lib/content';
import { playSound } from '../lib/audio';
import { getFinished } from '../lib/progress';
import { activeChild } from '../lib/people';
import { href } from '../lib/route';
import { useSettings } from '../lib/settings';
import { activePlan } from '../lib/plan';

/** Where each world sits on the Learning worlds map (percent of map width and height). */
const PINS: Record<string, [number, number]> = {
  'why-pray': [50, 13],
  manners: [18, 27],
  seerah: [82, 28],
  prayer: [32, 47],
  wudu: [66, 50],
  duas: [15, 68],
  quran: [50, 72],
  stories: [84, 70],
  everyday: [32, 89],
};

const openWorld = (w: World) => href({ name: 'world', worldId: w.id });

function WorldThumb({ world, className }: { world: World; className: string }) {
  return world.picture.src ? (
    <img className={className} src={world.picture.src} alt="" loading="lazy" />
  ) : (
    <span className={`${className} thumb-emoji`} aria-hidden>
      {world.picture.emoji}
    </span>
  );
}

const learn = (t: Topic) => href({ name: 'learn', topicId: t.id, index: 0 });
const picOf = (t: Topic, adult: boolean) => (adult && t.adultPicture ? t.adultPicture : t.picture);

function Thumb({ topic, adult, className }: { topic: Topic; adult: boolean; className: string }) {
  const p = picOf(topic, adult);
  return p.src ? (
    <img className={className} src={p.src} alt="" loading="lazy" />
  ) : (
    <span className={`${className} thumb-emoji`} aria-hidden>
      {p.emoji}
    </span>
  );
}

export function Home() {
  const { settings } = useSettings();
  const adult = settings.look === 'adult';
  const finished = getFinished();
  // The picture schedule: what is not finished yet, in order. If everything is finished, start again from the top.
  const kid = activeChild();
  // Lessons a grown-up picked come first, then the hand-made topics.
  const picked = (kid?.profile.assigned ?? []).map(getTopic).filter((t): t is Topic => !!t);
  const order = [...picked, ...topics.filter((t) => !picked.includes(t))];
  const todo = order.filter((t) => !finished[t.id]);
  const plan = (todo.length ? todo : order).slice(0, 4);
  const simple = activePlan().simpleHome;
  const [first, then, ...after] = simple ? plan.slice(0, 2) : plan;
  const hello = kid ? `Assalamu alaykum, ${kid.name}!` : 'Assalamu alaykum!';
  const greeting = adult ? `${hello} What would you like to learn today?` : `${hello} Ready for an adventure?`;

  return (
    <div className="frame home-frame">
      <header className="bar top-bar home-bar">
        <a className="brand" href="#/" aria-label="Kareem Learning Explorer">
          <span aria-hidden className="brand-moon">🌙</span>
          <span className="brand-text">
            <span className="brand-name">Kareem</span>
            <span className="brand-sub">Learning Explorer</span>
          </span>
        </a>
        <KidTools compact />
        <a className="pill pill-icon" href="#/settings" aria-label="Settings">
          ⚙️
        </a>
      </header>

      <main className="home">
        <section className="greet">
          <Mascot
            say={greeting}
            onHear={settings.sound ? () => playSound({ text: greeting, rate: settings.speechRate }) : undefined}
          />
        </section>

        {first && (
          <section className="block">
            <h2 className="h2">First, then</h2>
            <div className="first-then">
              <a className="ft ft-first" href={learn(first)}>
                <span className="ft-label">First</span>
                <Thumb topic={first} adult={adult} className="ft-pic" />
                <span className="ft-title">{first.title}</span>
              </a>
              {then && (
                <a className="ft ft-then" href={learn(then)}>
                  <span className="ft-label">Then</span>
                  <Thumb topic={then} adult={adult} className="ft-pic" />
                  <span className="ft-title">{then.title}</span>
                </a>
              )}
            </div>
          </section>
        )}

        {after.length > 0 && (
          <section className="block">
            <h2 className="h2">After that</h2>
            <ol className="after">
              {after.map((t, k) => (
                <li key={t.id}>
                  <a className="after-row" href={learn(t)}>
                    <span className="after-num">{k + 3}</span>
                    <Thumb topic={t} adult={adult} className="after-pic" />
                    <span className="after-title">{t.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </section>
        )}

        {!simple && (
          <>
            <section className="block">
              <h2 className="h2">🗺️ Learning worlds</h2>
              <div className="map">
                <img className="map-img" src="/content/images/art/world-map.jpg" alt="A storybook map with hills, a river and palm trees" />
                {worlds.map((w) => {
                  const [x, y] = PINS[w.id] ?? [50, 50];
                  return (
                    <a key={w.id} className="pin" href={openWorld(w)} style={{ left: `${x}%`, top: `${y}%` }}>
                      <span className="pin-ring">
                        <WorldThumb world={w} className="pin-pic" />
                      </span>
                      <span className="pin-label">{w.title}</span>
                    </a>
                  );
                })}
              </div>
            </section>

            <section className="block">
              <h2 className="h2">Play and practise</h2>
              <div className="play-cards">
                <a className="topic-card" href="#/games">
                  <span className="topic-pic thumb-emoji" aria-hidden>🎮</span>
                  <span className="topic-body">
                    <span className="topic-title">Games</span>
                    <span className="topic-summary">Calm games. No timers, no scores.</span>
                  </span>
                </a>
                <a className="topic-card" href="#/arabic">
                  <span className="topic-pic thumb-emoji play-arabic-thumb" aria-hidden lang="ar">
                    ا ب ت
                  </span>
                  <span className="topic-body">
                    <span className="topic-title">Arabic path</span>
                    <span className="topic-summary">Letters, reading and Quran words</span>
                  </span>
                </a>
              </div>
            </section>

            <section className="block">
              <h2 className="h2">Everything to learn</h2>
              <ul className="topic-grid">
                {worlds.map((w) => {
                  const list = topicsIn(w.id);
                  return (
                    <li key={w.id}>
                      <a className="topic-card" href={openWorld(w)}>
                        <WorldThumb world={w} className="topic-pic" />
                        <span className="topic-body">
                          <span className="topic-title">{w.title}</span>
                          <span className="topic-summary">{w.summary}</span>
                          <span className="topic-summary">{list.length} lessons</span>
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}

        <p className="hint foot-link">
          <a href="#/sign-in/kid">{kid ? `${kid.avatar} Not ${kid.name}? Change` : '😊 Who is learning?'}</a>
          <span aria-hidden> · </span>
          <a href="#/sign-in">👪 Grown-ups</a>
        </p>
      </main>
    </div>
  );
}
