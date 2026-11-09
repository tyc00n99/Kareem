import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { load, save } from './storage';

export type Settings = {
  /** Child is the default. A grown-up can switch in Settings. */
  look: 'child' | 'adult';
  sound: boolean;
  speechRate: 'slow' | 'normal';
  motion: boolean;
  highContrast: boolean;
  textSize: 'normal' | 'large' | 'larger';
  celebration: 'words' | 'picture';
};

const defaults: Settings = {
  look: 'child',
  sound: true,
  speechRate: 'slow',
  motion: false,
  highContrast: false,
  textSize: 'normal',
  celebration: 'picture',
};

const KEY = 'deen-steps:settings';

type Ctx = { settings: Settings; update: (patch: Partial<Settings>) => void };
const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => load(KEY, defaults));

  useEffect(() => {
    save(KEY, settings);
    const root = document.documentElement;
    root.dataset.look = settings.look;
    root.dataset.contrast = settings.highContrast ? 'high' : 'normal';
    root.dataset.text = settings.textSize;
    root.dataset.motion = settings.motion ? 'on' : 'off';
  }, [settings]);

  const update = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));
  return <SettingsContext.Provider value={{ settings, update }}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Ctx {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings outside SettingsProvider');
  return ctx;
}
