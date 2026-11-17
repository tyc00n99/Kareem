// Makes natural voice clips for every lesson with ElevenLabs.
//
//   npm run make-voice -- --voice "<voice name or id>" [--redo] [--only wudu] [--model eleven_v3] [--cue "[warmly] "]
//
// Needs an ElevenLabs API key: ELEVENLABS_API_KEY, or a network secret that
// adds the xi-api-key header for api.elevenlabs.io. Clips that already exist
// are kept (use --redo to make them again). Arabic phrases are made too, as
// stand-ins: replace files in public/content/audio/arabic/ with real
// recordings of a person saying them, using the same file names.

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const redo = args.includes('--redo');
const only = arg('only');
const voiceArg = arg('voice') ?? process.env.ELEVENLABS_VOICE;
const API = 'https://api.elevenlabs.io/v1';
const headers = { 'content-type': 'application/json', ...(process.env.ELEVENLABS_API_KEY ? { 'xi-api-key': process.env.ELEVENLABS_API_KEY } : {}) };

const topicsDir = new URL('../content/topics/', import.meta.url).pathname;
const audioDir = new URL('../public/content/audio/', import.meta.url).pathname;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function findVoice(want) {
  if (!want) throw new Error('Say which voice to use: --voice "<name or id>"');
  const res = await fetch(`${API}/voices`, { headers });
  if (!res.ok) throw new Error(`Could not list voices (${res.status}): ${await res.text()}`);
  const { voices } = await res.json();
  const v = voices.find((x) => x.voice_id === want) ?? voices.find((x) => x.name.toLowerCase().startsWith(want.toLowerCase()));
  // A Voice Library voice can be used by its id without adding it first.
  if (!v && /^[A-Za-z0-9]{20}$/.test(want)) return { voice_id: want, name: want };
  if (!v) throw new Error(`No voice "${want}" in your ElevenLabs voices. Add it from the Voice Library first. You have: ${voices.map((x) => x.name).join(', ')}`);
  return v;
}

// eleven_v3 is the most natural and expressive model; a [warmly] cue at the
// start sets a kind teacher tone (cues are not spoken). --model picks another.
const MODEL = arg('model') ?? 'eleven_v3';
const CUE = MODEL === 'eleven_v3' ? (arg('cue') ?? '[warmly] ') : '';
const SETTINGS = { stability: 0.5, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true };

async function make(voiceId, text, file, lang) {
  const out = join(audioDir, file);
  if (existsSync(out) && !redo) return 'kept';
  const res = await fetch(`${API}/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text: lang ? text : CUE + text, model_id: MODEL, voice_settings: SETTINGS, ...(lang ? { language_code: lang } : {}) }),
  });
  if (!res.ok) throw new Error(`${file}: ElevenLabs said ${res.status}: ${await res.text()}`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  return 'made';
}

// Islamic phrases inside English sentences are given to the voice in Arabic
// script, so they are said the proper Arabic way (the screen text is unchanged).
const ARABIC_IN_ENGLISH = new Map([
  ['Bismika Allahumma amutu wa ahya', 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا'],
  ['Assalamu alaykum wa rahmatullah', 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّه'],
  ['Wa alaykum assalam', 'وَعَلَيْكُمُ السَّلَام'],
  ['Assalamu alaykum', 'السَّلَامُ عَلَيْكُمْ'],
  ['Alhamdulillah', 'الْحَمْدُ لِلَّه'],
  ['Allahu Akbar', 'اللَّهُ أَكْبَر'],
  ['Bismillah', 'بِسْمِ اللَّه'],
]);
const speakable = (text) => {
  let t = text;
  for (const [en, ar] of ARABIC_IN_ENGLISH) t = t.split(en).join(ar);
  return t;
};

const jobs = [];
for (const f of readdirSync(topicsDir).filter((x) => x.endsWith('.json')).sort()) {
  const t = JSON.parse(readFileSync(join(topicsDir, f), 'utf8'));
  if (only && t.id !== only) continue;
  t.screens.forEach((s, i) => {
    const text = s.type === 'learn' ? s.text : s.question;
    jobs.push({ text: speakable(text), file: `${t.id}/${String(i + 1).padStart(2, '0')}.mp3` });
    if (s.arabic) jobs.push({ text: s.arabic.text, file: `arabic/${slug(s.arabic.say)}.mp3`, lang: 'ar' });
  });
}
if (!only) {
  for (const [text, file] of [
    ['Yes. That is right.', 'common/yes-right.mp3'],
    ['Not yet. Try another one.', 'common/not-yet.mp3'],
    ["Let's look again.", 'common/look-again.mp3'],
    ['Yes. That is the right order.', 'common/right-order.mp3'],
  ])
    jobs.push({ text, file });
}

const voice = await findVoice(voiceArg);
console.log(`Voice: ${voice.name} (${voice.voice_id}). ${jobs.length} clips.`);
const seen = new Set();
let made = 0;
for (const j of jobs) {
  if (seen.has(j.file)) continue;
  seen.add(j.file);
  const r = await make(voice.voice_id, j.text, j.file, j.lang);
  if (r === 'made') made++;
  console.log(`${r === 'made' ? '✓' : '·'} ${j.file}  ${j.text}`);
}
console.log(`Done: ${made} new clips. Run "node scripts/audio-manifest.mjs" (or npm run build) to use them.`);
