# Writing lessons

Every topic is one file in `content/topics/`, for example `content/topics/wudu.json`.
You can add or change lessons without touching any code. Run `npm run check-content` to check your file.

## The rules

- **One idea per screen.** If a screen has two ideas, make it two screens.
- **Easy-read words.** Short sentences. Concrete words. No metaphors or idioms.
- **Every screen has a picture** that shows the idea. Give every picture an `alt`: a plain description of what it shows.
- **One way of doing each practice.** Say which method a topic follows in its first screen or summary.
- Keep `"status": "draft"` until a scholar and an easy-read reviewer have checked the topic. Then change it to `"reviewed"`.

## A topic file

```json
{
  "id": "wudu",
  "title": "Wudu",
  "summary": "Washing before prayer.",
  "order": 30,
  "status": "draft",
  "picture": { "src": "/content/images/wudu/cover.jpg", "alt": "Water running from a tap" },
  "screens": [ ... ]
}
```

`order` sets where the topic appears on the home screen (smallest first).

## A learning screen

```json
{
  "type": "learn",
  "text": "I wash my hands three times.",
  "picture": { "src": "/content/images/wudu/hands-child.jpg", "alt": "A child washing their hands" },
  "adultPicture": { "src": "/content/images/wudu/hands-adult.jpg", "alt": "An adult washing their hands" },
  "arabic": { "text": "بِسْمِ اللَّهِ", "say": "Bismillah" },
  "audio": "/content/audio/wudu/hands.mp3"
}
```

- `adultPicture` is optional. Adult learners see it instead of `picture`.
- `arabic` is optional. Use it for words the learner should say.
- `audio` is optional. Without it, the device reads the text aloud. While it plays, each word lights up; the learner can also tap any word, or the picture, to hear it.
- `speaker` is optional: `"kareem"` or `"noor"`. The sentence then appears in that character's speech bubble. Write it in their voice ("I say back: ...").
- `arabic` can also have `chunks` and `meaning`. They show on the back of the Arabic flip card:
  `"arabic": { "text": "...", "say": "Assalamu alaykum", "chunks": ["As", "sa", "laa", "mu", "a", "lay", "kum"], "meaning": "Peace be with you." }`
  Without `chunks`, the card splits `say` into words.
- Until a real picture exists you can use an emoji: `"picture": { "emoji": "🙌", "alt": "Two hands" }`.

Put pictures in `public/content/images/` and recordings in `public/content/audio/`.

## A question screen

```json
{
  "type": "check",
  "question": "Which picture shows washing hands?",
  "showAgain": 3,
  "answers": [
    { "label": "Washing hands", "picture": { "emoji": "🙌", "alt": "Two hands" }, "correct": true },
    { "label": "Eating", "picture": { "emoji": "🍎", "alt": "An apple" } }
  ]
}
```

- Give 2 or 3 answers. Exactly one has `"correct": true`.
- `showAgain` is the number of the screen to show again after a wrong answer (the first screen is 1).
- There is no score. A wrong answer shows the idea again kindly, then the learner tries again.

## A put-it-in-order screen

```json
{
  "type": "order",
  "question": "Kareem meets Noor. Tap what they say, in order.",
  "items": [
    { "label": "Assalamu alaykum", "speaker": "kareem" },
    { "label": "Wa alaykum assalam", "speaker": "noor" }
  ]
}
```

- List 2 to 4 `items` in the **right** order. The app mixes them up.
- Each item needs a `picture` or a `speaker`. Items with a speaker build up a little conversation.
- There is no score. A wrong tap just says "Not yet. Try another one."

## Pictures and characters

- The app is children-first. Lesson pictures are warm, flat illustrations of everyday Muslim children.
  The two recurring characters are **Kareem** (a boy in a blue kufi cap) and **Noor** (a girl in a pink hijab), as drawn in `art/manners.jpg`. Their faces for speech bubbles are in `public/content/images/characters/`.
- **Never draw Allah, the Prophet (peace be upon him), other prophets, angels, or companions.**
  Show the Kaaba, mosques, nature, everyday scenes, and the child characters instead.
- The picture style is a soft storybook watercolor, like the art in `public/content/images/art/` (the original artwork from the Lovable prototype). New pictures should match it: gentle colours, one clear subject, nothing busy or flashing.

## Voice clips

The app plays recorded clips when they exist, and reads the text aloud otherwise. Put MP3 files in `public/content/audio/` with these names (no need to edit the lesson files):

- `<topic id>/<NN>.mp3`: the sentence (or question) on screen NN, e.g. `wudu/03.mp3`. Say only the English sentence.
- `arabic/<phrase>.mp3`: an Arabic phrase, named from its English letters in lower case with dashes, e.g. `arabic/assalamu-alaykum.mp3`. It plays right after the sentence. Best recorded by a real person.
- `common/yes-right.mp3`, `common/not-yet.mp3`, `common/look-again.mp3`, `common/right-order.mp3`.

`npm run make-voice -- --voice "<ElevenLabs voice>"` makes any missing clips with ElevenLabs (needs an API key). The build lists the clips that exist in `src/audio-files.json`.

## Learning worlds

The home map shows learning worlds: Why We Pray, Wudu, How to Pray, Duas, Quran, Stories, Seerah, Manners and Everyday tasks.
Each world is one file in `content/worlds/`, with many short lessons:

```json
{
  "id": "wudu",
  "title": "Wudu",
  "summary": "Getting clean to pray",
  "order": 20,
  "picture": { "src": "/content/images/art/wudu.jpg", "alt": "Wudu" },
  "lessons": [
    { "id": "wudu-x1", "title": "Washing hands", "emoji": "🙌", "status": "draft", "screens": [ ... ] }
  ]
}
```

- A lesson's `screens` use the same screen types as a topic.
- `group` is optional. Lessons with the same group show under one heading (used by Everyday tasks).
- A topic file in `content/topics/` joins a world with `"world": "wudu"`. It shows at the top of that world.
- Lesson ids must be different from every other lesson and topic id.
- In the Stories and Seerah worlds, never use a picture or emoji of a person. Use objects and places (📜, 🕋, 🌊).
- The world lessons came over from the first prototype. They are all `"draft"` until reviewed.
