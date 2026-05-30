export const locales = ["it", "en", "fr", "es", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "it";

/** Lingue scritte da destra a sinistra */
export const rtlLocales: Locale[] = ["ar"];

export const isRtl = (locale: string) => rtlLocales.includes(locale as Locale);

/** Etichette mostrate nel selettore lingua */
export const localeNames: Record<Locale, string> = {
  it: "Italiano",
  en: "English",
  fr: "Français",
  es: "Español",
  ar: "العربية",
};

export const hasLocale = (locale: string): locale is Locale =>
  (locales as readonly string[]).includes(locale);
