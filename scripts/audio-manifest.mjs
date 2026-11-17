// Lists the recorded clips in public/content/audio so the app knows which
// ones exist (and never asks for a missing file, which matters offline).
import { readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('../public/content/audio/', import.meta.url).pathname;
const out = new URL('../src/audio-files.json', import.meta.url).pathname;

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.(mp3|m4a|ogg|wav)$/i.test(name) ? [relative(root, p).split('\\').join('/')] : [];
  });
}

const files = walk(root).sort();
writeFileSync(out, JSON.stringify({ files }, null, 2) + '\n');
console.log(`audio clips: ${files.length}`);
