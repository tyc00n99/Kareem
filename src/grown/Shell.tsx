import type { ReactNode } from 'react';
import { getPeople, signOut } from '../lib/people';
import { getAccount, syncState } from '../lib/cloud';
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
            <SyncChip />
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

const CHIP: Record<string, string> = {
  syncing: '● Saving…',
  synced: '● Saved to your account',
  offline: '● Offline: will save later',
  error: '● Not saved yet: will try again',
};

function SyncChip() {
  const a = getAccount();
  if (!a) {
    return (
      <a className="gu-device" href="#/grown-up" title="Everything is saved on this device only">
        ● On this device
      </a>
    );
  }
  const s = syncState();
  return (
    <span className={`gu-device gu-sync-${s}`} title={a.email}>
      {CHIP[s] ?? '● Account'}
    </span>
  );
}
