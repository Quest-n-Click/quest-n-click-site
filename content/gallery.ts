import type { Locale } from "@/lib/i18n";

type Alt = Record<Locale, string>;
interface Shot {
  src: string;
  w: number;
  h: number;
  alt: Alt;
}

/** The engine's screenshots (wiki page start.gallery, `npm run docs:screenshots` on the real build) and the brand assets. */
export const GALLERY = {
  hero: {
    src: "/gallery/4119-hero.webp",
    w: 1440,
    h: 665,
    alt: {
      en: "The Pantry Key: Grandma's living room, nine verbs and the bag",
      fr: "The Pantry Key : le salon de Mamie, neuf verbes et le sac",
    },
  } satisfies Shot,
  discover: [
    { src: "/gallery/4119-player-map.webp", w: 1440, h: 665, alt: { en: "The world map of the demo, with the places to visit", fr: "La carte du monde de la démo, avec les lieux à visiter" } },
    { src: "/gallery/4119-player-scene.webp", w: 1440, h: 665, alt: { en: "A conversation with Grandma and her topics", fr: "Une conversation avec Mamie et ses sujets" } },
    { src: "/gallery/4119-player-minigame.webp", w: 1440, h: 665, alt: { en: "The pipes minigame, by touch or keyboard", fr: "Le minijeu des tuyaux, au toucher ou au clavier" } },
  ] satisfies Shot[],
  /** Each step shows one focused region (cut from the screenshot), and the whole screen on demand. */
  studio: {
    storyboard: {
      focus: { src: "/gallery/4119-studio-storyboard-focus.webp", w: 740, h: 493 },
      full: { src: "/gallery/4119-studio-storyboard.webp", w: 1440, h: 900 },
      alt: { en: "The Studio's storyboard: the opening panel and Grandma's lines, one field each", fr: "Le storyboard du Studio : la case d'ouverture et les répliques de Mamie, un champ chacune" },
    },
    rooms: {
      focus: { src: "/gallery/4119-studio-rooms-focus.webp", w: 440, h: 293 },
      full: { src: "/gallery/4119-studio-rooms.webp", w: 1440, h: 900 },
      alt: { en: "The Studio's Rooms tab: the pantry's look lines and its first reaction", fr: "L'onglet Salles du Studio : les lignes « regarder » du garde-manger et sa première réaction" },
    },
    check: {
      focus: { src: "/gallery/4119-studio-check-focus.webp", w: 700, h: 467 },
      full: { src: "/gallery/4119-studio-check.webp", w: 1440, h: 900 },
      alt: { en: "The Studio's Check tab: the solver's winning path, fifteen actions", fr: "L'onglet Vérification du Studio : le chemin gagnant du solveur, quinze actions" },
    },
  },
  assistant: { src: "/gallery/studio-assistant.jpg", w: 1000, h: 614 },
};
