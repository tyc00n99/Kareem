// ABA-informed tips for grown-ups, adapted from the Lovable prototype.
export type Tip = { emoji: string; title: string; what: string; how: string[] };
export type TipGroup = { id: string; title: string; tips: Tip[] };

export const ABA_TIPS: TipGroup[] = [
  {
    id: "reinforcement",
    title: "Reinforcement",
    tips: [
      { emoji: "⭐", title: "Positive reinforcement", what: "Give something the child likes right after the behavior you want to see more of.", how: ["Reward within 3 seconds so the link is clear.", "Name the behavior: \"You washed your hands, great job!\"", "A simple star chart on the fridge works as a token system. (The app itself never scores the child.)"] },
      { emoji: "🎯", title: "Find real motivators", what: "A reward only works if the child actually wants it.", how: ["Do a quick preference check: offer 3 items and see which they pick.", "Rotate rewards so they don't lose value.", "Save the most-loved reward for the hardest tasks."] },
      { emoji: "📉", title: "Thin the schedule", what: "Start by rewarding every success, then slowly reward less often.", how: ["Every time → every 2nd time → now and then.", "Keep praise frequent even when tangible rewards drop.", "Move faster only when the skill is steady."] },
      { emoji: "🪙", title: "Token economy", what: "Tokens (stars) are earned and traded for a bigger reward.", how: ["Show the goal visually: 5 stars = park.", "Never take earned tokens away as punishment.", "Start with a small goal so they win early."] },
      { emoji: "🗣️", title: "Behavior-specific praise", what: "Praise the exact action, not just \"good job\".", how: ["\"You waited your turn so nicely.\"", "Match your energy to what the child enjoys—some prefer a calm voice.", "Add an Islamic phrase: \"MashaAllah, you said Bismillah!\""] },
    ],
  },
  {
    id: "prompting",
    title: "Prompting and fading",
    tips: [
      { emoji: "🖐️", title: "Prompt hierarchy", what: "Give only as much help as needed: full physical → partial physical → model → gesture → verbal → independent.", how: ["Start with the help that guarantees success (errorless learning).", "Step down one level once they succeed several times.", "The progress page shows which questions needed a second try."] },
      { emoji: "⏳", title: "Time delay", what: "Wait a few seconds before helping to give the child a chance to respond.", how: ["Start with 0 seconds, then 2, then 4.", "Count silently in your head.", "If they answer on their own, reward big."] },
      { emoji: "🚫", title: "Avoid prompt dependence", what: "Children can learn to wait for help if prompts stay the same.", how: ["Fade gestures to a small point.", "Stand a little farther back each session.", "Reward independent tries more than helped ones."] },
    ],
  },
  {
    id: "teaching",
    title: "Teaching methods",
    tips: [
      { emoji: "🔗", title: "Task analysis and chaining", what: "Break a routine (wudu, prayer) into small steps and teach them in order.", how: ["Forward chaining: teach step 1, then add step 2.", "Backward chaining: you do every step but the last; the child finishes and gets the reward.", "Every lesson in this app is already broken into small steps, one idea per screen."] },
      { emoji: "🃏", title: "Discrete trial training (DTT)", what: "Short, repeated teaching moments: instruction → response → feedback.", how: ["Keep instructions short: \"Touch Alif.\"", "Do 5–10 trials, then a break.", "Mix easy (known) and new items to keep confidence up."] },
      { emoji: "🧸", title: "Natural environment teaching", what: "Teach during real life and play, not just at the table.", how: ["Practice Bismillah at real meals.", "Practice salam when guests arrive.", "Follow the child's interest and build learning into it."] },
      { emoji: "📸", title: "Visual supports", what: "Pictures make language and routines easier to understand.", how: ["Use the First/Then board on the kid's home page.", "Print a picture schedule for wudu near the sink.", "Use the Talk board so the child can request with pictures."] },
      { emoji: "🎬", title: "Video and live modeling", what: "Children learn by watching someone do the skill.", how: ["Let them watch a sibling pray.", "Model the step slowly, then say \"Your turn.\"", "Record your child doing it well and replay it."] },
      { emoji: "🔁", title: "Generalization", what: "A skill is only learned when it works with different people, places and materials.", how: ["Practice wudu at home, the masjid and grandma's.", "Have both parents and the teacher run the same lesson.", "Change the pictures or wording a little."] },
    ],
  },
  {
    id: "behavior",
    title: "Handling behavior",
    tips: [
      { emoji: "🔍", title: "ABC data", what: "Write down the Antecedent (before), Behavior, and Consequence (after) to find the function.", how: ["Look for patterns: time of day, demands, noise.", "Common functions: escape, attention, tangible, sensory.", "Share notes with the child's BCBA."] },
      { emoji: "🔀", title: "Replacement behavior", what: "Teach a better way to get the same need met.", how: ["If they hit to escape work, teach the break card.", "Reward the new behavior every time at first.", "Make the new way easier than the old one."] },
      { emoji: "🧘", title: "Antecedent strategies", what: "Prevent problems before they start.", how: ["Give warnings: \"2 more minutes, then prayer.\"", "Offer choices: \"Red mat or blue mat?\"", "Start with easy tasks (behavioral momentum)."] },
      { emoji: "🙈", title: "Planned ignoring", what: "Don't reinforce attention-seeking behavior that is safe to ignore.", how: ["Stay calm and neutral.", "Give attention the moment appropriate behavior returns.", "Never ignore unsafe behavior."] },
      { emoji: "🛋️", title: "Calm-down space", what: "A quiet, sensory-friendly spot is a support, not a punishment.", how: ["Teach the child to ask for it with the Break button.", "Include soft items, headphones, a dhikr counter.", "Use a timer so they know when they return."] },
    ],
  },
  {
    id: "data",
    title: "Tracking progress",
    tips: [
      { emoji: "📊", title: "Mastery criteria", what: "Decide when a skill is mastered, e.g. 80% independent across 3 sessions.", how: ["In this app, Mastered means finished twice, the last time with every question right first try.", "Review each child's progress page weekly.", "Move mastered lessons to maintenance practice."] },
      { emoji: "🗓️", title: "Short, frequent sessions", what: "Many short sessions beat one long one.", how: ["5–10 minutes, 2–3 times a day.", "End on a success.", "Use the same time each day for routine."] },
    ],
  },
];
