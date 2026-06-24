import type { Metadata } from "next";
import { locales, defaultLocale, type Locale } from "@/lib/locales";
import { getDictionary } from "@/lib/i18n";
import { legalDocs, type LegalKey } from "@/content/legal";
import { site } from "@/lib/site";

/** URL di produzione (canonico, con www). Usato per canonical, hreflang, sitemap, OG. */
export const SITE_URL = site.url;

/** Codici Open Graph `og:locale` per ogni lingua del sito. */
const ogLocale: Record<Locale, string> = {
  it: "it_IT",
  en: "en_US",
  fr: "fr_FR",
  es: "es_ES",
  ar: "ar_AR",
  zh: "zh_CN",
  ru: "ru_RU",
  uk: "uk_UA",
  pl: "pl_PL",
  ro: "ro_RO",
};

/**
 * Costruisce canonical + hreflang per una pagina, dato il percorso senza lingua.
 * Esempi di `suffix`: "" (home), "/prenota", "/servizi/caf".
 */
export function alternates(lang: Locale, suffix = ""): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = `${SITE_URL}/${l}${suffix}`;
  languages["x-default"] = `${SITE_URL}/${defaultLocale}${suffix}`;
  return {
    canonical: `${SITE_URL}/${lang}${suffix}`,
    languages,
  };
}

/** Blocco Open Graph riusabile per una pagina. */
export function openGraph(
  lang: Locale,
  suffix: string,
  title: string,
  description: string
): NonNullable<Metadata["openGraph"]> {
  return {
    type: "website",
    siteName: site.name,
    url: `${SITE_URL}/${lang}${suffix}`,
    locale: ogLocale[lang],
    title,
    description,
    images: ["/logo-usi.jpeg"],
  };
}

/** Metadata localizzati per le pagine legali (privacy, termini, cookie). */
export async function legalMetadata(lang: Locale, key: LegalKey): Promise<Metadata> {
  const dict = await getDictionary(lang);
  const title = dict[legalDocs[key].titleKey];
  const description = `${title} — ${dict["brand.tag"]}`;
  const suffix = `/${key}`;
  return {
    title,
    description,
    alternates: alternates(lang, suffix),
    openGraph: openGraph(lang, suffix, `${title} — ${site.name}`, description),
  };
}
