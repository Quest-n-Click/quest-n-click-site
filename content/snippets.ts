// Excerpts of the Rooms page of the documentation (wiki/en/create.rooms.md, "A room, step by step"), the sample game's
// living room. Kept as text: the site shows the shape of the content format, it does not run the engine.

export const SNIPPETS = {
  room: `import { defineRoom } from 'quest-n-click/content';

export default defineRoom({
  id: 'house',
  name: "Grandma's house",
  decor: 'decor/house',
  music: 'house',

  // Props: images on the background, each with states.
  props: {
    lamp:  { name: 'lamp', states: { off: 'house/r1c1', on: 'house/r1c2' } },
    stool: { name: 'stool', states: { shelf: 'house/r1c5', pulled: 'house/r1c6' } },
  },

  // Characters present.
  actors: {
    grandma: { char: 'grandma', facing: 'left' },
    cat: { char: 'cat', pose: 'sleep', visible: '!cat_awake' },
  },

  // Zones of the background that can be acted on.
  hotspots: {
    shelf: { name: 'shelf' },
    door:  { name: 'garden door' },
  },

  // Look. A list = a different line each time.
  look: {
    shelf: 'The shelf. Too high without a step up.',
    cupboard: ['An old cupboard.', 'Still an old cupboard.',
               'Someday I will check what is behind it.'],
  },
});`,
  rule: `// A reaction: a verb, a target, a condition, and what happens.
on: [
  { id: 'pull.stool', verb: 'pull', a: 'stool',
    if: { prop: ['stool', 'shelf'] },
    do: [
      { prop: ['stool', 'pulled'] },
      'There. A step up.',
    ] },

  { id: 'tie.rope', verb: 'use', a: 'rope', b: ['hook', 'bucket'],
    do: [
      { lose: 'rope' }, { set: 'tied' },
      'Tied. One end on the hook, the other on the bucket.',
      { say: ['grandma', 'Careful with that bucket, dear.'] },
    ] },
],

// Hints, from the walkie-talkie: the first whose condition is still false.
hints: [
  { until: { has: 'rope' }, lines: ['Khhh… check the side of the armchair.'] },
  { until: 'tied', lines: ['Khhh… a rope… it ties to things.'] },
],`,
  talk: `// Talk topics. "Bye" is added to every menu.
talk: {
  grandma: [
    { id: 'ask.basket', topic: "Grandma, what's in the basket?",
      do: [{ say: ['grandma', 'A surprise for everyone.'] }] },

    { id: 'ask.market', topic: 'Can I go to the market alone?',
      do: [
        { say: ['grandma', 'Alone?! With your scarf, your hat, your water bottle…'] },
        { say: ['grandma', '… Fine. Back by ten.'] },
      ] },
  ],
},

// On every entry into the room.
onEnter: [
  { once: ['The living room. Home base.'], id: 'arrival.first' },
],`,
} as const;
export type SnippetKey = keyof typeof SNIPPETS;
