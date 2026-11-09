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
- `audio` is optional. Without it, the device reads the text aloud.
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

## Pictures and characters

- The app is children-first. Lesson pictures are warm, flat illustrations of everyday Muslim children.
  The two recurring characters are **Kareem** (a boy in a white kufi cap) and **Noor** (a girl in a hijab).
- **Never draw Allah, the Prophet (peace be upon him), other prophets, angels, or companions.**
  Show the Kaaba, mosques, nature, everyday scenes, and the child characters instead.
- The picture style is a soft storybook watercolor, like the reference art in `public/content/images/art/` (taken from the Lovable prototype). New pictures should match it: gentle colours, one clear subject, nothing busy or flashing.
