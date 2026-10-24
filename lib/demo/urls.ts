import "server-only";
import { PAGES_GAME_URL, PAGES_STUDIO_URL } from "@/lib/i18n";
import { demoAvailable } from "./store";

/** Where the game and the Studio demo are played from: this site when it serves them, GitHub Pages until then. */
export async function demoUrls(): Promise<{ game: string; studio: string; local: boolean }> {
  if (await demoAvailable()) return { game: "/demo/", studio: "/demo/studio.html", local: true };
  return { game: PAGES_GAME_URL, studio: PAGES_STUDIO_URL, local: false };
}
