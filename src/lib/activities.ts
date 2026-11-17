// Games and the Arabic path, brought over from the first prototype.
// Every activity is a short list of steps with one clear goal. No scores, no stars:
// a wrong tap just says "not yet" and the right answer is gently shown.

export type Option = { label?: string; emoji?: string; arabic?: string };

export type Step =
  /** Show something and say it. The child taps Next when ready. */
  | { kind: 'learn'; big: string; arabic?: boolean; text: string; say?: string; sayArabic?: string; sub?: string }
  /** Pick the right one. `hear` is said when the speaker is tapped (for "listen and find"). */
  | {
      kind: 'choice';
      prompt: string;
      big?: string;
      arabic?: boolean;
      hear?: { text: string; lang?: 'ar' };
      options: Option[];
      answer: number;
      /** Said and shown after the right answer. */
      then?: string;
    }
  /** Tap the steps in the right order. */
  | { kind: 'order'; prompt: string; items: Option[] }
  /** Flip two cards to find the same pictures. */
  | { kind: 'memory'; pairs: Option[] }
  /** Tap anything to see what happens. No wrong answers. */
  | { kind: 'explore'; prompt: string; things: { before: string; after: string; label: string; say: string }[] };

export type Activity = {
  id: string;
  title: string;
  emoji: string;
  /** What the child is learning, for grown-ups. */
  goal: string;
  /** One sentence for the child, said at the start. */
  howTo: string;
  steps: Step[];
};

// ---------- helpers ----------

/** A fixed shuffle (the same every time), so screens don't jump around when they redraw. */
function mix<T>(items: T[], seed: number): T[] {
  const a = [...items];
  let s = seed * 9301 + 49297;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A choice step with the right option and some others, mixed. */
function choose(prompt: string, right: Option, others: Option[], seed: number, extra: Partial<Extract<Step, { kind: 'choice' }>> = {}): Step {
  const options = mix([right, ...others.slice(0, 2)], seed);
  return { kind: 'choice', prompt, options, answer: options.indexOf(right), ...extra };
}

const others = <T>(all: T[], not: T, n: number, seed: number) => mix(all.filter((x) => x !== not), seed).slice(0, n);

// ---------- games ----------

const PRAYERS: [string, string][] = [
  ['🌅', 'Fajr'],
  ['☀️', 'Dhuhr'],
  ['🌤️', 'Asr'],
  ['🌇', 'Maghrib'],
  ['🌙', 'Isha'],
];

const LISTEN: [string, string][] = [
  ['🕌', 'Masjid'],
  ['📖', 'Quran'],
  ['🕋', 'Kaaba'],
  ['🌙', 'Moon'],
  ['🐪', 'Camel'],
  ['🌴', 'Palm tree'],
  ['💧', 'Water'],
  ['📿', 'Prayer beads'],
  ['🤲', 'Dua hands'],
  ['🍽️', 'Bismillah before eating'],
];

const COLORS: [string, string, string][] = [
  ['Red', '🔴', '🍎'],
  ['Blue', '🔵', '💧'],
  ['Yellow', '🟡', '🌙'],
  ['Green', '🟢', '🌴'],
  ['Orange', '🟠', '🥕'],
  ['Purple', '🟣', '🍇'],
  ['Brown', '🟤', '🐪'],
];

const PAIRS: [string, string, string][] = [
  ['💧', '🙌', 'Water goes with washing hands for wudu.'],
  ['🕋', '🧭', 'The Kaaba goes with the qibla direction.'],
  ['🕌', '👟', 'Shoes go on the rack at the masjid.'],
  ['🧎', '🧺', 'Praying goes with a prayer mat.'],
  ['🍽️', '🗣️', 'Before eating we say Bismillah.'],
  ['🛏️', '🤲', 'Before sleep we make dua.'],
  ['🌙', '🌴', 'The Ramadan moon goes with dates to break the fast.'],
];

const SORTS: { title: string; bins: [Option, Option]; items: [string, 0 | 1, string][] }[] = [
  {
    title: 'Masjid or home?',
    bins: [{ emoji: '🕌', label: 'Masjid' }, { emoji: '🏠', label: 'Home' }],
    items: [['🧺', 0, 'Prayer rows'], ['🛏️', 1, 'Bed'], ['👟', 0, 'Shoe rack'], ['🍳', 1, 'Kitchen pan'], ['🔊', 0, 'Adhan speaker'], ['🧸', 1, 'Toys']],
  },
  {
    title: 'Used in wudu or not?',
    bins: [{ emoji: '💧', label: 'Wudu' }, { emoji: '🚫', label: 'Not wudu' }],
    items: [['🙌', 0, 'Hands'], ['🎒', 1, 'Backpack'], ['😊', 0, 'Face'], ['⚽', 1, 'Ball'], ['🦶', 0, 'Feet'], ['🍪', 1, 'Cookie']],
  },
  {
    title: 'Day or night?',
    bins: [{ emoji: '☀️', label: 'Day' }, { emoji: '🌙', label: 'Night' }],
    items: [['🌅', 0, 'Fajr sunrise'], ['⭐', 1, 'Stars'], ['🏫', 0, 'School'], ['😴', 1, 'Sleep'], ['🧃', 0, 'Lunch'], ['🌌', 1, 'Isha sky']],
  },
  {
    title: 'Kind or unkind?',
    bins: [{ emoji: '💛', label: 'Kind' }, { emoji: '💔', label: 'Unkind' }],
    items: [['🤝', 0, 'Sharing'], ['😡', 1, 'Yelling'], ['👋', 0, 'Saying salam'], ['👊', 1, 'Hitting'], ['🧹', 0, 'Helping clean'], ['🗑️', 1, 'Littering']],
  },
];

const ODD: { name: string; items: [string, string][] }[] = [
  { name: 'fruit', items: [['🍎', 'apple'], ['🍌', 'banana'], ['🍇', 'grapes'], ['🍊', 'orange']] },
  { name: 'sky things', items: [['🌙', 'moon'], ['⭐', 'star'], ['☀️', 'sun'], ['☁️', 'cloud']] },
  { name: 'animals', items: [['🐪', 'camel'], ['🐑', 'sheep'], ['🐦', 'bird'], ['🐟', 'fish']] },
  { name: 'wudu body parts', items: [['🙌', 'hands'], ['👃', 'nose'], ['🦶', 'feet'], ['💪', 'arms']] },
];

const STORIES: { scene: string; text: string; good: Option; bad: Option; then: string }[] = [
  { scene: '🏫🍎', text: "Amina's friend forgot his snack. He looks sad.", good: { emoji: '🤝', label: 'Share her apple' }, bad: { emoji: '🙈', label: 'Hide her apple' }, then: 'He smiles! Sharing makes Allah happy.' },
  { scene: '🔊🕌', text: 'They hear the adhan. It is Dhuhr time.', good: { emoji: '🚰', label: 'Make wudu' }, bad: { emoji: '⚽', label: 'Keep playing' }, then: 'First pray, then play.' },
  { scene: '🕌😢', text: "A little boy is crying. He can't find his mom.", good: { emoji: '🙋', label: 'Tell a grown-up' }, bad: { emoji: '🏃', label: 'Run away' }, then: 'The teacher helps him find his mom. So kind!' },
  { scene: '🏠🧸', text: "Yusuf breaks his sister's toy by accident.", good: { emoji: '😔', label: 'Say sorry' }, bad: { emoji: '🤫', label: 'Hide it' }, then: 'His sister feels better. Saying sorry is brave.' },
  { scene: '🍽️', text: 'It is dinner time. The food is on the table.', good: { emoji: '🗣️', label: 'Say Bismillah' }, bad: { emoji: '😋', label: 'Grab food fast' }, then: 'Bismillah! Now we can eat.' },
  { scene: '🛏️🌙', text: 'Bedtime. Yusuf is in bed.', good: { emoji: '🤲', label: 'Make the bedtime dua' }, bad: { emoji: '📱', label: 'Play on the tablet' }, then: 'Bismika Allahumma amutu wa ahya. Good night!' },
];

const MASJID = [
  { before: '🚰', after: '💦', label: 'Tap', say: 'Water comes out. Now I can make wudu.' },
  { before: '🏮', after: '✨', label: 'Lantern', say: 'The lantern lights up the masjid.' },
  { before: '🔈', after: '🔊', label: 'Speaker', say: 'The adhan. Allahu Akbar. Time to pray.' },
  { before: '🚪', after: '🕌', label: 'Door', say: 'The door opens. Right foot first.' },
  { before: '🌱', after: '🌴', label: 'Seed', say: 'Allah makes a palm tree grow.' },
  { before: '📦', after: '🪙', label: 'Sadaqah box', say: 'I put in a coin. I helped someone.' },
  { before: '☁️', after: '🌧️', label: 'Cloud', say: 'Rain is a gift from Allah.' },
  { before: '📕', after: '📖', label: 'Quran', say: 'The Quran opens. Bismillah.' },
];

const DUAS: { when: string; emoji: string; arabic: string }[] = [
  { when: 'Before eating', emoji: '🍽️', arabic: 'بِسْمِ اللَّهِ' },
  { when: 'After eating', emoji: '😋', arabic: 'الْحَمْدُ لِلَّهِ' },
  { when: 'Before sleeping', emoji: '🛏️', arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا' },
  { when: 'Meeting someone', emoji: '👋', arabic: 'السَّلَامُ عَلَيْكُمْ' },
  { when: 'When I sneeze', emoji: '🤧', arabic: 'الْحَمْدُ لِلَّهِ' },
];

export const GAMES: Activity[] = [
  {
    id: 'listen',
    title: 'Listen and find',
    emoji: '👂',
    goal: 'Find a picture from a spoken word. No reading needed.',
    howTo: 'Tap the speaker, listen, then tap the picture.',
    steps: LISTEN.slice(0, 6).map(([e, w], k) =>
      choose('Listen. Which picture is it?', { emoji: e, label: w }, others(LISTEN, LISTEN[k], 2, k).map(([oe, ow]) => ({ emoji: oe, label: ow })), k, {
        hear: { text: w },
        big: '🔊',
      }),
    ),
  },
  {
    id: 'prayer-times',
    title: 'Prayer times',
    emoji: '🕌',
    goal: 'Name the five daily prayers from the time of day.',
    howTo: 'Look at the sky. Which prayer is it?',
    steps: PRAYERS.map(([e, n], k) =>
      choose('Which prayer is this?', { label: n, emoji: e }, others(PRAYERS, PRAYERS[k], 2, k).map(([oe, on]) => ({ label: on, emoji: oe })), k + 3, { big: e }),
    ),
  },
  {
    id: 'which-dua',
    title: 'Which dua?',
    emoji: '🤲',
    goal: 'Know when to say short everyday duas.',
    howTo: 'Look at the dua. When do I say it?',
    steps: DUAS.filter((d, k, a) => a.findIndex((x) => x.arabic === d.arabic) === k).map((d, k, list) =>
      choose('When do I say this?', { label: d.when, emoji: d.emoji }, others(list, d, 2, k).map((o) => ({ label: o.when, emoji: o.emoji })), k + 5, {
        big: d.arabic,
        arabic: true,
        hear: { text: d.arabic, lang: 'ar' },
      }),
    ),
  },
  {
    id: 'order-wudu',
    title: 'Put in order: Wudu',
    emoji: '💧',
    goal: 'Sequence the steps of wudu.',
    howTo: 'Tap what comes first, then the next one.',
    steps: [
      {
        kind: 'order',
        prompt: 'Wudu: tap the steps in order.',
        items: [
          { emoji: '🙌', label: 'Hands' },
          { emoji: '👄', label: 'Mouth' },
          { emoji: '👃', label: 'Nose' },
          { emoji: '😊', label: 'Face' },
          { emoji: '💪', label: 'Arms' },
          { emoji: '💆', label: 'Head' },
          { emoji: '🦶', label: 'Feet' },
        ],
      },
    ],
  },
  {
    id: 'order-salah',
    title: 'Put in order: Salah',
    emoji: '🧎',
    goal: 'Sequence the positions of salah.',
    howTo: 'Tap what comes first, then the next one.',
    steps: [
      {
        kind: 'order',
        prompt: 'Salah: tap the steps in order.',
        items: [
          { emoji: '🙌', label: 'Allahu Akbar' },
          { emoji: '📖', label: 'Al-Fatiha' },
          { emoji: '🙇', label: 'Ruku' },
          { emoji: '🧍', label: 'Stand up' },
          { emoji: '🧎', label: 'Sujood' },
          { emoji: '👉', label: 'Salam' },
        ],
      },
    ],
  },
  {
    id: 'match',
    title: 'What goes together?',
    emoji: '🧩',
    goal: 'Match things that go together in Islamic daily life.',
    howTo: 'Look at the big picture. What goes with it?',
    steps: PAIRS.map(([a, b, then], k) =>
      choose('What goes with this?', { emoji: b }, others(PAIRS, PAIRS[k], 2, k).map(([, ob]) => ({ emoji: ob })), k + 7, { big: a, then }),
    ),
  },
  ...SORTS.map((s, n): Activity => ({
    id: `sort-${n + 1}`,
    title: s.title,
    emoji: s.bins[0].emoji!,
    goal: `Sort things into two groups: ${s.bins[0].label} and ${s.bins[1].label}.`,
    howTo: 'Look at the picture. Which group is it in?',
    steps: s.items.map(([e, bin, label]) => ({ kind: 'choice', prompt: `${label}: ${s.title}`, big: e, options: s.bins, answer: bin })),
  })),
  {
    id: 'odd-one',
    title: 'Odd one out',
    emoji: '🔍',
    goal: 'Find the one that does not belong.',
    howTo: 'Three are the same kind. Tap the one that is different.',
    steps: ODD.map((g, k) => {
      const odd = ODD[(k + 1) % ODD.length].items[k % 4];
      const same = g.items.slice(0, 3).map(([e, l]) => ({ emoji: e, label: l }));
      const right = { emoji: odd[0], label: odd[1] };
      const options = mix([...same, right], k + 11);
      return { kind: 'choice', prompt: 'Which one does not belong?', options, answer: options.indexOf(right), then: `The others are ${g.name}.` };
    }),
  },
  {
    id: 'colors',
    title: 'Colour match',
    emoji: '🎨',
    goal: 'Name colours and match them to things.',
    howTo: 'What colour is the picture?',
    steps: COLORS.slice(0, 6).map(([name, dot, thing], k) =>
      choose('What colour is this?', { emoji: dot, label: name }, others(COLORS, COLORS[k], 2, k).map(([on, od]) => ({ emoji: od, label: on })), k + 13, { big: thing }),
    ),
  },
  {
    id: 'count',
    title: "Let's count",
    emoji: '🔢',
    goal: 'Count objects one by one, up to 5.',
    howTo: 'Count the pictures. Then tap the number.',
    steps: ['🌴', '⭐', '🐪', '🍎', '🌙'].map((e, k) => {
      const n = ((k * 3) % 5) + 1;
      const nums = [1, 2, 3, 4, 5].map((x) => ({ label: String(x) }));
      const right = nums[n - 1];
      const options = mix([right, ...others(nums, right, 2, k)], k + 17);
      return { kind: 'choice', prompt: 'How many?', big: e.repeat(n), options, answer: options.indexOf(right) };
    }),
  },
  {
    id: 'stories',
    title: 'My story choices',
    emoji: '📚',
    goal: 'Choose kind, Islamic manners in everyday stories.',
    howTo: 'Listen to the story. What should they do?',
    steps: STORIES.map((s, k) => choose(s.text, s.good, [s.bad], k + 19, { big: s.scene, then: s.then })),
  },
  {
    id: 'memory',
    title: 'Memory cards',
    emoji: '🃏',
    goal: 'Remember where the same pictures are hidden.',
    howTo: 'Flip two cards. Find the ones that are the same.',
    steps: [
      { kind: 'memory', pairs: [{ emoji: '🕌', label: 'Masjid' }, { emoji: '📖', label: 'Quran' }, { emoji: '🌙', label: 'Moon' }] },
      { kind: 'memory', pairs: [{ emoji: '🐪', label: 'Camel' }, { emoji: '🌴', label: 'Palm tree' }, { emoji: '🕋', label: 'Kaaba' }, { emoji: '📿', label: 'Beads' }] },
    ],
  },
  {
    id: 'masjid',
    title: 'Masjid explorer',
    emoji: '✨',
    goal: 'Explore what happens when you use things in the masjid. No wrong answers.',
    howTo: 'Tap anything to see what happens.',
    steps: [{ kind: 'explore', prompt: 'Tap anything to see what happens.', things: MASJID }],
  },
];

// ---------- the Arabic path ----------

export type Letter = { ch: string; name: string };

export const LETTERS: Letter[] = [
  { ch: 'ا', name: 'Alif' },
  { ch: 'ب', name: 'Ba' },
  { ch: 'ت', name: 'Ta' },
  { ch: 'ث', name: 'Tha' },
  { ch: 'ج', name: 'Jim' },
  { ch: 'ح', name: 'Ha' },
  { ch: 'خ', name: 'Kha' },
  { ch: 'د', name: 'Dal' },
  { ch: 'ذ', name: 'Dhal' },
  { ch: 'ر', name: 'Ra' },
  { ch: 'ز', name: 'Zay' },
  { ch: 'س', name: 'Sin' },
  { ch: 'ش', name: 'Shin' },
  { ch: 'ص', name: 'Sad' },
  { ch: 'ض', name: 'Dad' },
  { ch: 'ط', name: 'Taa' },
  { ch: 'ظ', name: 'Dhaa' },
  { ch: 'ع', name: 'Ayn' },
  { ch: 'غ', name: 'Ghayn' },
  { ch: 'ف', name: 'Fa' },
  { ch: 'ق', name: 'Qaf' },
  { ch: 'ك', name: 'Kaf' },
  { ch: 'ل', name: 'Lam' },
  { ch: 'م', name: 'Mim' },
  { ch: 'ن', name: 'Nun' },
  { ch: 'ه', name: 'Haa' },
  { ch: 'و', name: 'Waw' },
  { ch: 'ي', name: 'Ya' },
];

const NON_CONNECTORS = ['ا', 'د', 'ذ', 'ر', 'ز', 'و'];
const ZWJ = '‍';
type Pos = 'beginning' | 'middle' | 'end';
/** How a letter looks at the beginning, middle or end of a word (a zero-width joiner forces the joined shape). */
function shape(ch: string, pos: Pos): string {
  const fwd = !NON_CONNECTORS.includes(ch);
  if (pos === 'beginning') return fwd ? ch + ZWJ : ch;
  if (pos === 'middle') return fwd ? ZWJ + ch + ZWJ : ZWJ + ch;
  return ZWJ + ch;
}

type Read = { ar: string; translit: string; emoji?: string; meaning?: string };
const READING: { id: string; title: string; goal: string; intro: string; items: Read[] }[] = [
  {
    id: 'r1',
    title: 'Two letters join',
    goal: 'Join two letters and read them together.',
    intro: 'Most letters hold hands with the next letter.',
    items: [{ ar: 'با', translit: 'baa' }, { ar: 'تا', translit: 'taa' }, { ar: 'نا', translit: 'naa' }, { ar: 'ما', translit: 'maa' }, { ar: 'لا', translit: 'laa' }],
  },
  {
    id: 'r2',
    title: 'Short vowels',
    goal: 'Read fatha (a), kasra (i) and damma (u).',
    intro: 'A small line on top says a. A line underneath says i. A little waw on top says u.',
    items: [{ ar: 'بَ', translit: 'ba' }, { ar: 'بِ', translit: 'bi' }, { ar: 'بُ', translit: 'bu' }, { ar: 'مَ', translit: 'ma' }, { ar: 'مِ', translit: 'mi' }, { ar: 'مُ', translit: 'mu' }],
  },
  {
    id: 'r3',
    title: 'Three-letter words',
    goal: 'Read three-letter words. Arabic is read from right to left.',
    intro: 'Arabic is read from right to left.',
    items: [
      { ar: 'بَاب', translit: 'baab', emoji: '🚪', meaning: 'Door' },
      { ar: 'بَيْت', translit: 'bayt', emoji: '🏠', meaning: 'House' },
      { ar: 'نُور', translit: 'nuur', emoji: '💡', meaning: 'Light' },
      { ar: 'قَلَم', translit: 'qalam', emoji: '🖊️', meaning: 'Pen' },
    ],
  },
  {
    id: 'r4',
    title: 'Long vowels',
    goal: 'Read long vowels made with alif, ya and waw.',
    intro: 'Alif, ya or waw after a letter makes the sound long.',
    items: [{ ar: 'بَا', translit: 'baa' }, { ar: 'بِي', translit: 'bii' }, { ar: 'بُو', translit: 'buu' }, { ar: 'نَا', translit: 'naa' }, { ar: 'نِي', translit: 'nii' }, { ar: 'نُو', translit: 'nuu' }],
  },
  {
    id: 'r5',
    title: 'Sukoon',
    goal: 'Read a letter with sukoon (no vowel).',
    intro: 'A small circle means the letter stops, like the n in min.',
    items: [{ ar: 'مِنْ', translit: 'min' }, { ar: 'لَمْ', translit: 'lam' }, { ar: 'قُلْ', translit: 'qul' }, { ar: 'هَلْ', translit: 'hal' }],
  },
  {
    id: 'r6',
    title: 'Shaddah',
    goal: 'Read a doubled letter with shaddah.',
    intro: 'Shaddah looks like a small w. It doubles the letter.',
    items: [{ ar: 'رَبّ', translit: 'rabb' }, { ar: 'أُمّ', translit: 'umm' }, { ar: 'ثُمَّ', translit: 'thumma' }],
  },
];

const VOCAB: Read[][] = [
  [
    { ar: 'رَبّ', translit: 'Rabb', meaning: 'Lord, who cares for everything', emoji: '🌍' },
    { ar: 'نُور', translit: 'Nur', meaning: 'Light', emoji: '💡' },
    { ar: 'يَوْم', translit: 'Yawm', meaning: 'Day', emoji: '📅' },
  ],
  [
    { ar: 'كِتَاب', translit: 'Kitab', meaning: 'Book', emoji: '📖' },
    { ar: 'رَحْمَة', translit: 'Rahmah', meaning: 'Mercy, kindness', emoji: '💛' },
    { ar: 'أَرْض', translit: 'Ard', meaning: 'Earth', emoji: '🌱' },
    { ar: 'سَمَاء', translit: "Sama'", meaning: 'Sky', emoji: '☁️' },
  ],
  [
    { ar: 'شَمْس', translit: 'Shams', meaning: 'Sun', emoji: '☀️' },
    { ar: 'قَمَر', translit: 'Qamar', meaning: 'Moon', emoji: '🌙' },
    { ar: 'قَلَم', translit: 'Qalam', meaning: 'Pen', emoji: '🖊️' },
  ],
];

export type Stage = { id: string; title: string; blurb: string; emoji: string; levels: Activity[] };

const letterOpt = (l: Letter): Option => ({ arabic: l.ch });

function letterLevel(pair: Letter[], k: number): Activity {
  const before = LETTERS.slice(0, k * 2);
  const pool = LETTERS.filter((l) => !pair.includes(l));
  const steps: Step[] = [
    ...pair.map((l): Step => ({ kind: 'learn', big: l.ch, arabic: true, text: `This is ${l.name}.`, say: `This is ${l.name}.`, sayArabic: l.ch })),
    ...pair.map((l, n) => choose('Find the same letter.', letterOpt(l), others(pool, l, 2, k + n).map(letterOpt), k * 7 + n, { big: l.ch, arabic: true })),
    ...pair.map((l, n) => choose(`Listen. Which letter is ${l.name}?`, letterOpt(l), others(pool, l, 2, k + n + 3).map(letterOpt), k * 5 + n, { big: '🔊', hear: { text: l.name } })),
  ];
  // A little review of letters from earlier levels.
  if (before.length) {
    const old = before[(k * 3) % before.length];
    steps.push(choose(`Do you remember ${old.name}?`, letterOpt(old), others(pool, old, 2, k + 9).map(letterOpt), k + 21, { hear: { text: old.name }, big: '🔊' }));
  }
  return {
    id: `l${k + 1}`,
    title: `${pair[0].name} and ${pair[1].name}`,
    emoji: pair[0].ch,
    goal: `Know ${pair[0].name} (${pair[0].ch}) and ${pair[1].name} (${pair[1].ch}) by sight and by name.`,
    howTo: `Let's meet ${pair[0].name} and ${pair[1].name}.`,
    steps,
  };
}

const LETTER_LEVELS: Activity[] = [];
for (let i = 0; i < LETTERS.length; i += 2) LETTER_LEVELS.push(letterLevel([LETTERS[i], LETTERS[i + 1]], i / 2));

const FORM_LETTERS = ['ب', 'ت', 'ن', 'ي', 'س', 'م', 'ع', 'ه'].map((ch) => LETTERS.find((l) => l.ch === ch)!);
const POS_WORD: Record<Pos, string> = { beginning: 'beginning', middle: 'middle', end: 'end' };
const FORM_LEVELS: Activity[] = (['beginning', 'middle', 'end'] as Pos[]).map((pos, k) => ({
  id: `f${k + 1}`,
  title: `Shapes at the ${POS_WORD[pos]}`,
  emoji: shape('ب', pos),
  goal: `Recognise letters at the ${POS_WORD[pos]} of a word.`,
  howTo: 'Letters change shape when they hold hands in a word.',
  steps: [
    { kind: 'learn', big: shape('ب', pos), arabic: true, text: `This is Ba at the ${POS_WORD[pos]} of a word.`, sub: 'Ba on its own: ب' },
    ...FORM_LETTERS.slice(0, 5).map((l, n) => {
      const right: Option = { arabic: shape(l.ch, pos) };
      const wrong = others(FORM_LETTERS, l, 2, n + k).map((o) => ({ arabic: shape(o.ch, pos) }));
      return choose(`Which is ${l.name} at the ${POS_WORD[pos]}?`, right, wrong, n + k * 4, { big: l.ch, arabic: true });
    }),
  ],
}));

const READING_LEVELS: Activity[] = READING.map((r, k) => ({
  id: r.id,
  title: r.title,
  emoji: r.items[0].ar,
  goal: r.goal,
  howTo: r.intro,
  steps: [
    ...r.items.slice(0, 3).map((it): Step => ({ kind: 'learn', big: it.ar, arabic: true, text: `This says ${it.translit}.`, sayArabic: it.ar, sub: it.meaning ? `${it.emoji ?? ''} ${it.meaning}` : undefined })),
    ...r.items.map((it, n) =>
      choose('How do you read this?', { label: it.translit }, others(r.items, it, 2, n + k).map((o) => ({ label: o.translit })), n + k * 3, {
        big: it.ar,
        arabic: true,
        hear: { text: it.ar, lang: 'ar' },
      }),
    ),
  ],
}));

const VOCAB_LEVELS: Activity[] = VOCAB.map((words, k) => {
  const all = VOCAB.flat();
  return {
    id: `v${k + 1}`,
    title: `Quran words ${k + 1}`,
    emoji: words[0].emoji ?? '📖',
    goal: `Know these words from the Quran: ${words.map((w) => w.translit).join(', ')}.`,
    howTo: 'These words are in the Quran. Let us learn what they mean.',
    steps: [
      ...words.map((w): Step => ({ kind: 'learn', big: w.ar, arabic: true, text: `${w.translit} means ${w.meaning}.`, sayArabic: w.ar, sub: `${w.emoji} ${w.meaning}` })),
      ...words.map((w, n) =>
        choose('What does this word mean?', { emoji: w.emoji, label: w.meaning }, others(all, w, 2, n + k).map((o) => ({ emoji: o.emoji, label: o.meaning })), n + k * 5, {
          big: w.ar,
          arabic: true,
          hear: { text: w.ar, lang: 'ar' },
        }),
      ),
    ],
  };
});

export const STAGES: Stage[] = [
  { id: 'letters', title: 'Letter Valley', blurb: 'All 28 letters, two at a time', emoji: 'ا', levels: LETTER_LEVELS },
  { id: 'forms', title: 'Shape Hills', blurb: 'How letters change in a word', emoji: 'بـ', levels: FORM_LEVELS },
  { id: 'reading', title: 'Reading River', blurb: 'Join letters, vowels and marks', emoji: 'بَ', levels: READING_LEVELS },
  { id: 'vocab', title: 'Quran Word Garden', blurb: 'Words from the Quran', emoji: '🌱', levels: VOCAB_LEVELS },
];

const ARABIC: Activity[] = STAGES.flatMap((s) => s.levels.map((l) => ({ ...l, id: `arabic-${l.id}` })));
for (const s of STAGES) s.levels = s.levels.map((l) => ({ ...l, id: `arabic-${l.id}` }));

export function getActivity(id: string): Activity | undefined {
  return GAMES.find((g) => `game-${g.id}` === id) ?? ARABIC.find((a) => a.id === id);
}

/** The id an activity is opened and recorded with. */
export const gameKey = (g: Activity) => `game-${g.id}`;
