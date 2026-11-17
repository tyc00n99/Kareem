# Kareem Learning Explorer

An easy-read Islamic learning app for people with learning disabilities and autism, kids and adults.
One idea per screen, a picture on every screen, tap-to-hear audio, and the learner sets the pace.

## Run it

```bash
npm install
npm run dev       # open the address it prints
npm run build     # checks lesson content, type-checks, builds to dist/
npm run preview   # serve the built app (offline mode works here)
```

## How it is built

- React + Vite, no router or UI library. Font: Atkinson Hyperlegible (bundled, works offline).
- Works offline after the first visit: the build writes `dist/sw.js`, which caches every file.
- Lessons are JSON files in `content/topics/`. See [CONTENT.md](CONTENT.md).
- Settings and finished topics are saved on the device only. No accounts.

## Design rules

- Same layout on every screen. The Back, Hear and Next buttons never move.
- No sound, movement or popups unless the learner causes them. Nothing autoplays or times out.
- No scores, stars, streaks or timers.
- Child and adult looks share one engine. Adults get adult pictures and tone.

## Accounts (optional)

The app works fully on one device with no account. Grown-ups can also make a free account (email and password):
their children, classes and learning records are then saved online and shared across devices, and a parent can
put their child in a teacher's class with the teacher's 6-letter class code.

- Database: Supabase, connected to the Vercel project through the Vercel Marketplace. Vercel sets the
  `SUPABASE_*`, `NEXT_PUBLIC_SUPABASE_*` and `POSTGRES_*` environment variables.
- Tables and access rules: `supabase/schema.sql`. `scripts/migrate.mjs` applies it on every Vercel build
  (it is safe to run again). Each family only sees its own children; a teacher sees children in their classes.
- `api/signup.ts` makes accounts already confirmed, because the free Supabase plan does not send emails to the public.
- On the device, `src/lib/cloud.ts` sends changes (queued in `src/lib/sync-queue.ts`, so nothing is lost offline)
  and brings back the latest. The grown-up area on each device is still opened with a 4-digit PIN.
