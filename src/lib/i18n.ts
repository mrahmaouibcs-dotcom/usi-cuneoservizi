import "server-only";
import type { Locale } from "@/lib/locales";

const dictionaries = {
  it: () => import("@/dictionaries/it.json").then((m) => m.default),
  en: () => import("@/dictionaries/en.json").then((m) => m.default),
  fr: () => import("@/dictionaries/fr.json").then((m) => m.default),
  es: () => import("@/dictionaries/es.json").then((m) => m.default),
  ar: () => import("@/dictionaries/ar.json").then((m) => m.default),
};

export type Dictionary = Record<string, string>;

export const getDictionary = async (locale: Locale): Promise<Dictionary> =>
  dictionaries[locale]();
