import type { Locale } from "@/lib/i18n";

export interface Shot {
  src: string;
  w: number;
  h: number;
  caption: Record<Locale, string>;
  who: "player" | "author";
}

/** The engine's gallery (wiki page start.gallery), taken by `npm run docs:screenshots` on the real build. */
export const GALLERY: Shot[] = [
  { src: "/gallery/4119-player-scene.webp", w: 1440, h: 665, who: "player", caption: { en: "Conversations with topics, choices and a transcript", fr: "Des conversations avec sujets, choix et transcription" } },
  { src: "/gallery/4119-player-minigame.webp", w: 1440, h: 665, who: "player", caption: { en: "Minigames, playable by touch or keyboard", fr: "Des minijeux, au toucher ou au clavier" } },
  { src: "/gallery/4119-player-map.webp", w: 1440, h: 665, who: "player", caption: { en: "A world map, characters who move between places", fr: "Une carte du monde, des personnages qui se déplacent" } },
  { src: "/gallery/4119-player-ending.webp", w: 1440, h: 665, who: "player", caption: { en: "An ending that remembers what the player guessed", fr: "Une fin qui se souvient de ce que le joueur a deviné" } },
  { src: "/gallery/4119-studio-rooms.webp", w: 1440, h: 900, who: "author", caption: { en: "Rooms: the real engine, a placement editor on top, every line editable in place", fr: "Salles : le vrai moteur, un éditeur de placement par-dessus, chaque ligne modifiable sur place" } },
  { src: "/gallery/4119-studio-storyboard.webp", w: 1440, h: 900, who: "author", caption: { en: "Storyboard: the story panel by panel, checked against the game", fr: "Storyboard : l'histoire case par case, vérifiée contre le jeu" } },
  { src: "/gallery/4119-studio-assets.webp", w: 1440, h: 900, who: "author", caption: { en: "Assets: every sheet and cell, where it is used, the prompt to make it", fr: "Assets : chaque planche et chaque case, où elle sert, le prompt pour la faire" } },
  { src: "/gallery/4119-studio-check.webp", w: 1440, h: 900, who: "author", caption: { en: "Check: the validator and the solver, run again after every save", fr: "Vérification : le validateur et le solveur, relancés après chaque sauvegarde" } },
];
