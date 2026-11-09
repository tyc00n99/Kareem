import type { ReactNode } from 'react';
import type { Picture } from './lib/content';
import { useSettings } from './lib/settings';

export function Pic({ picture, adultPicture, size = 'large' }: { picture: Picture; adultPicture?: Picture; size?: 'large' | 'small' }) {
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
