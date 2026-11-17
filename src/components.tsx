import type { ReactNode } from 'react';
import type { Picture } from './lib/content';
import { useSettings } from './lib/settings';

export function Pic({ picture, adultPicture, size = 'large' }: { picture: Picture; adultPicture?: Picture; size?: 'large' | 'small' | 'card' }) {
  const { settings } = useSettings();
  const p = settings.look === 'adult' && adultPicture ? adultPicture : picture;
  return (
    <div className={`pic pic-${size}`}>
      {p.src ? (
        <img src={p.src} alt={p.alt} />
      ) : (
        <span role="img" aria-label={p.alt} className="pic-emoji">
          {p.emoji ?? '•'}
        </span>
      )}
    </div>
  );
}

/** The same frame on every screen: top bar, one card, bottom bar. Buttons never move. */
export function Frame({ top, children, bottom }: { top: ReactNode; children: ReactNode; bottom: ReactNode }) {
  return (
    <div className="frame">
      <header className="bar top-bar">{top}</header>
      <main className="stage">{children}</main>
      <nav className="bar bottom-bar" aria-label="Lesson controls">
        {bottom}
      </nav>
    </div>
  );
}

export function Btn({
  children,
  onClick,
  disabled,
  kind = 'plain',
  label,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  kind?: 'plain' | 'main';
  label?: string;
}) {
  return (
    <button type="button" className={`btn btn-${kind}`} onClick={onClick} disabled={disabled} aria-label={label}>
      {children}
    </button>
  );
}

/** Talk, Calm and Break: always one tap away. */
export function KidTools({ compact = false }: { compact?: boolean }) {
  const { settings, update } = useSettings();
  return (
    <div className={`kid-tools${compact ? ' kid-tools-compact' : ''}`}>
      <a className="pill" href="#/talk" aria-label="Talk board">
        <span aria-hidden>💬</span>
        <span className="pill-text">Talk</span>
      </a>
      <button
        type="button"
        className={`pill${settings.calm ? ' pill-on' : ''}`}
        aria-pressed={settings.calm}
        aria-label="Calm mode"
        onClick={() => update({ calm: !settings.calm })}
      >
        <span aria-hidden>{settings.calm ? '🌙' : '😌'}</span>
        <span className="pill-text">Calm</span>
      </button>
      <a className="pill pill-break" href="#/break" aria-label="Take a break">
        <span aria-hidden>✋</span>
        <span className="pill-text">Break</span>
      </a>
    </div>
  );
}

/** The friendly moon says something. Tap the bubble to hear it. */
export function Mascot({ say, onHear }: { say: string; onHear?: () => void }) {
  return (
    <div className="mascot">
      <img className="mascot-img" src="/content/images/characters/moon.png" alt="A smiling moon friend waving" />
      {onHear ? (
        <button type="button" className="mascot-say" onClick={onHear}>
          {say}
        </button>
      ) : (
        <p className="mascot-say">{say}</p>
      )}
    </div>
  );
}
