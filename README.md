# Deen Steps

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
