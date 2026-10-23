import type { Locale } from "@/lib/i18n";
import { en, type Messages } from "./en";
import { fr } from "./fr";

export const messages: Record<Locale, Messages> = { en, fr };
export type { Messages };
