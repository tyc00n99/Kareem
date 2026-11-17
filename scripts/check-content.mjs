// Checks every lesson file in content/topics before the app is built.
// Run with: npm run check-content
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = new URL('../content/topics/', import.meta.url).pathname;
const publicDir = new URL('../public', import.meta.url).pathname;
const problems = [];
const SPEAKERS = ['kareem', 'noor'];
const ids = new Set();
let lessons = 0;

function checkPicture(p, where) {
  if (!p || typeof p !== 'object') return problems.push(`${where}: picture is missing`);
  if (!p.src && !p.emoji) problems.push(`${where}: picture needs "src" or "emoji"`);
  if (!p.alt) problems.push(`${where}: picture needs "alt" (a plain description)`);
  if (p.src && !existsSync(join(publicDir, p.src))) problems.push(`${where}: image file not found: public${p.src}`);
}

function checkAudio(a, where) {
  if (a && !existsSync(join(publicDir, a))) problems.push(`${where}: audio file not found: public${a}`);
}

function checkScreen(t, s, i, at) {
  const w = at(`screen ${i + 1}`);
  if (s.type === 'learn') {
    if (!s.text) problems.push(`${w}: needs "text"`);
    else {
      const sentences = s.text.split(/[.!?](\s|$)/).filter((x) => x && x.trim()).length;
      if (sentences > 2) problems.push(`${w}: has ${sentences} sentences. One idea per screen - split it.`);
      if (s.text.length > 120) problems.push(`${w}: text is ${s.text.length} characters. Keep it under 120.`);
    }
    checkPicture(s.picture, w);
    if (s.adultPicture) checkPicture(s.adultPicture, `${w} adultPicture`);
    if (s.arabic && (!s.arabic.text || !s.arabic.say)) problems.push(`${w}: "arabic" needs "text" and "say"`);
    if (s.arabic?.chunks && (!Array.isArray(s.arabic.chunks) || s.arabic.chunks.some((c) => typeof c !== 'string' || !c)))
      problems.push(`${w}: "arabic.chunks" must be a list of words`);
    if (s.speaker && !SPEAKERS.includes(s.speaker)) problems.push(`${w}: "speaker" must be one of ${SPEAKERS.join(', ')}`);
    checkAudio(s.audio, w);
  } else if (s.type === 'check') {
    if (!s.question) problems.push(`${w}: needs "question"`);
    if (!Array.isArray(s.answers) || s.answers.length < 2 || s.answers.length > 3)
      problems.push(`${w}: needs 2 or 3 answers`);
    else {
      if (s.answers.filter((a) => a.correct).length !== 1) problems.push(`${w}: exactly one answer must have "correct": true`);
      s.answers.forEach((a, n) => {
        if (!a.label) problems.push(`${w} answer ${n + 1}: needs "label"`);
        checkPicture(a.picture, `${w} answer ${n + 1}`);
      });
    }
    const target = t.screens[s.showAgain - 1];
    if (!target || target.type !== 'learn') problems.push(`${w}: "showAgain" must be the number of a learn screen`);
    checkAudio(s.audio, w);
  } else if (s.type === 'order') {
    if (!s.question) problems.push(`${w}: needs "question"`);
    if (!Array.isArray(s.items) || s.items.length < 2 || s.items.length > 4) problems.push(`${w}: needs 2 to 4 items`);
    else
      s.items.forEach((it, n) => {
        if (!it.label) problems.push(`${w} item ${n + 1}: needs "label"`);
        if (it.picture) checkPicture(it.picture, `${w} item ${n + 1}`);
        if (it.speaker && !SPEAKERS.includes(it.speaker)) problems.push(`${w} item ${n + 1}: unknown "speaker"`);
        if (!it.picture && !it.speaker) problems.push(`${w} item ${n + 1}: needs a "picture" or a "speaker"`);
      });
    checkAudio(s.audio, w);
  } else {
    problems.push(`${w}: "type" must be "learn", "check" or "order"`);
  }
}

function checkScreens(t, at) {
  if (!Array.isArray(t.screens) || t.screens.length === 0) {
    problems.push(at('needs at least one screen'));
    return;
  }
  t.screens.forEach((s, i) => checkScreen(t, s, i, at));
}

const worldsDir = new URL('../content/worlds/', import.meta.url).pathname;
const worldIds = new Set();
const worldFiles = existsSync(worldsDir) ? readdirSync(worldsDir).filter((f) => f.endsWith('.json')) : [];
for (const file of worldFiles) {
  try {
    worldIds.add(JSON.parse(readFileSync(join(worldsDir, file), 'utf8')).id);
  } catch {
    /* reported below */
  }
}

for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  let t;
  try {
    t = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  } catch (e) {
    problems.push(`${file}: not valid JSON (${e.message})`);
    continue;
  }
  const at = (s) => `${file} ${s}`;
  for (const key of ['id', 'title', 'summary']) if (typeof t[key] !== 'string' || !t[key]) problems.push(at(`needs "${key}"`));
  if (typeof t.order !== 'number') problems.push(at('needs "order" (a number)'));
  if (!['draft', 'reviewed'].includes(t.status)) problems.push(at('"status" must be "draft" or "reviewed"'));
  if (ids.has(t.id)) problems.push(at(`id "${t.id}" is used twice`));
  ids.add(t.id);
  checkPicture(t.picture, at('topic'));
  if (t.adultPicture) checkPicture(t.adultPicture, at('topic adultPicture'));
  if (t.world && !worldIds.has(t.world)) problems.push(at(`"world" "${t.world}" has no file in content/worlds`));
  checkScreens(t, at);
}

for (const file of worldFiles) {
  let w;
  try {
    w = JSON.parse(readFileSync(join(worldsDir, file), 'utf8'));
  } catch (e) {
    problems.push(`worlds/${file}: not valid JSON (${e.message})`);
    continue;
  }
  const wat = (s) => `worlds/${file} ${s}`;
  for (const key of ['id', 'title', 'summary']) if (typeof w[key] !== 'string' || !w[key]) problems.push(wat(`needs "${key}"`));
  if (typeof w.order !== 'number') problems.push(wat('needs "order" (a number)'));
  checkPicture(w.picture, wat('world'));
  if (!Array.isArray(w.lessons) || w.lessons.length === 0) {
    problems.push(wat('needs at least one lesson'));
    continue;
  }
  for (const l of w.lessons) {
    const at = (s) => wat(`lesson "${l.id}" ${s}`);
    for (const key of ['id', 'title', 'emoji']) if (typeof l[key] !== 'string' || !l[key]) problems.push(at(`needs "${key}"`));
    if (!['draft', 'reviewed'].includes(l.status)) problems.push(at('"status" must be "draft" or "reviewed"'));
    if (ids.has(l.id)) problems.push(at(`id "${l.id}" is used twice`));
    ids.add(l.id);
    lessons++;
    checkScreens(l, at);
  }
}

if (problems.length) {
  console.error(`Content problems found:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`Content OK: ${ids.size - lessons} topic(s) and ${lessons} world lesson(s) in ${worldFiles.length} world(s).`);
