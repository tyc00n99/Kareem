import type { ReactNode } from 'react';
import { getPeople, signOut } from '../lib/people';
import { go } from '../lib/route';

/** Header and page frame for the parent and teacher area. */
export function GrownUpShell({ children }: { children: ReactNode }) {
  const g = getPeople().grownUp;
  return (
    <div className="gu">
      <header className="gu-bar">
        <div className="gu-bar-in">
          <a className="gu-brand" href="#/grown-up">
            <span aria-hidden>🌙</span> Kareem Learning Explorer
          </a>
          <nav className="gu-nav" aria-label="Grown-up menu">
            <a href="#/grown-up">{g?.role === 'teacher' ? 'My classes' : 'My children'}</a>
            <a href="#/grown-up/tips">ABA Tips</a>
            <a href="#/grown-up/helper">AI Helper</a>
            <a href="#/sign-in/kid">Child view</a>
            <span className="gu-device" title="Everything is saved on this device only">● On this device</span>
            {g && (
              <span className="gu-who">
                {g.name} · {g.role}
              </span>
            )}
            <button
              type="button"
              className="gu-btn gu-btn-ghost"
              onClick={() => {
                signOut();
                go({ name: 'home' });
              }}
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className="gu-main">{children}</main>
    </div>
  );
}
