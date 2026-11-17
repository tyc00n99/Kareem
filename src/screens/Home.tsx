import { KidTools, Mascot } from '../components';
import { topics, type Topic } from '../lib/content';
import { playSound } from '../lib/audio';
import { getFinished } from '../lib/progress';
import { activeChild } from '../lib/people';
import { href } from '../lib/route';
import { useSettings } from '../lib/settings';

/** Where each topic sits on the Learning worlds map (percent of map width and height). */
const PINS: Record<string, [number, number]> = {
  'islam-basics': [52, 17],
  'good-manners': [18, 30],
  salah: [30, 52],
  wudu: [62, 56],
  duas: [15, 74],
  'saying-salam': [82, 34],
  'five-pillars': [80, 72],
};

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
  const todo = topics.filter((t) => !finished[t.id]);
  const plan = (todo.length ? todo : topics).slice(0, 4);
  const [first, then, ...after] = plan;
  const kid = activeChild();
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

        <section className="block">
          <h2 className="h2">🗺️ Learning worlds</h2>
          <div className="map">
            <img className="map-img" src="/content/images/art/world-map.jpg" alt="A storybook map with hills, a river and palm trees" />
            {topics.map((t) => {
              const [x, y] = PINS[t.id] ?? [50, 50];
              return (
                <a key={t.id} className="pin" href={learn(t)} style={{ left: `${x}%`, top: `${y}%` }}>
                  <span className="pin-ring">
                    <Thumb topic={t} adult={adult} className="pin-pic" />
                    {finished[t.id] && (
                      <span className="pin-done" aria-label="finished">
                        ✓
                      </span>
                    )}
                  </span>
                  <span className="pin-label">{t.title}</span>
                </a>
              );
            })}
          </div>
        </section>

        <section className="block">
          <h2 className="h2">Everything to learn</h2>
          <ul className="topic-grid">
            {topics.map((t) => (
              <li key={t.id}>
                <a className="topic-card" href={learn(t)}>
                  <Thumb topic={t} adult={adult} className="topic-pic" />
                  <span className="topic-body">
                    <span className="topic-title">{t.title}</span>
                    <span className="topic-summary">{t.summary}</span>
                    {finished[t.id] && <span className="tick">✓ Finished</span>}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <p className="hint foot-link">
          <a href="#/sign-in/kid">{kid ? `${kid.avatar} Not ${kid.name}? Change` : '😊 Who is learning?'}</a>
          <span aria-hidden> · </span>
          <a href="#/sign-in">👪 Grown-ups</a>
        </p>
      </main>
    </div>
  );
}
