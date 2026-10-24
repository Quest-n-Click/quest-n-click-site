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
  studio: {
    storyboard: { src: "/gallery/4119-studio-storyboard.webp", alt: { en: "The Studio: the story organised in panels in the storyboard", fr: "Le Studio : l'histoire organisée en cases dans le storyboard" } },
    rooms: { src: "/gallery/4119-studio-rooms.webp", alt: { en: "The Studio: placing props and characters in a room", fr: "Le Studio : placement des objets et des personnages dans une salle" } },
    check: { src: "/gallery/4119-studio-check.webp", alt: { en: "The Studio: the validator and the solver's path", fr: "Le Studio : le validateur et le chemin du solveur" } },
  },
  assistant: { src: "/gallery/studio-assistant.jpg", w: 1000, h: 614 },
};
