import type { MetadataRoute } from "next";
import { locales, defaultLocale } from "@/lib/locales";
import { serviceSlug } from "@/lib/services";
import { SITE_URL } from "@/lib/seo";

/**
 * Percorsi indicizzabili (senza prefisso lingua). L'area /admin è esclusa
 * di proposito (è anche noindex + disallow in robots.ts).
 */
const paths = [
  "",
  "/prenota",
  ...Object.values(serviceSlug).map((slug) => `/servizi/${slug}`),
  "/privacy",
  "/termini",
  "/cookie",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({
    url: `${SITE_URL}/${defaultLocale}${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.7,
    alternates: {
      languages: Object.fromEntries(
        locales.map((lang) => [lang, `${SITE_URL}/${lang}${path}`])
      ),
    },
  }));
}
