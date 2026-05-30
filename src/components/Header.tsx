import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/locales";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Calendar, User } from "@/components/icons";
import { site } from "@/lib/site";

export default function Header({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const t = (k: string) => dict[k] ?? k;
  const nav = [
    { href: `/${lang}#servizi`, label: t("nav.services") },
    { href: `/${lang}#come-funziona`, label: t("nav.how") },
    { href: `/${lang}#chi-siamo`, label: t("nav.about") },
    { href: `/${lang}#lingue`, label: t("nav.languages") },
    { href: `/${lang}#contatti`, label: t("nav.contact") },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
        <Link href={`/${lang}`} className="flex items-center gap-3">
          <span className="flag-wave relative w-12 h-12 rounded-lg overflow-hidden shadow-md grid place-items-center">
            <span className="absolute inset-y-0 left-0 w-1/3 bg-ita-green" />
            <span className="absolute inset-y-0 left-1/3 w-1/3 bg-white" />
            <span className="absolute inset-y-0 right-0 w-1/3 bg-ita-red" />
            <span className="relative font-serif font-bold text-ink-900 text-xl drop-shadow">U</span>
          </span>
          <span className="leading-tight">
            <span className="block text-[9px] sm:text-[10px] text-ink-700 font-semibold uppercase tracking-wide leading-snug max-w-[15rem] sm:max-w-[20rem]">
              {site.legalName}
            </span>
            <span className="block font-serif font-bold text-xl sm:text-2xl tracking-tight">
              <span className="text-ita-green">USI</span>{" "}
              <span className="text-ink-900">– CUNEO</span>
              <span className="text-ita-red">Servizi</span>
            </span>
            <span className="hidden sm:block text-[11px] text-ink-700 font-semibold uppercase tracking-wider">
              {t("brand.tag")}
            </span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8 text-[15px] font-semibold text-ink-700">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="nav-link">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher current={lang} />
          <a
            href="#"
            className="btn-sheen hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-ink-900 hover:bg-ink-800 text-white text-sm font-bold transition shadow-lg shadow-ink-900/30"
          >
            <User className="w-4 h-4" />
            <span>{t("nav.login")}</span>
          </a>
          <Link
            href={`/${lang}/prenota`}
            className="btn-sheen inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-ita-red hover:bg-ita-red-dark text-white text-sm font-bold transition shadow-lg shadow-ita-red/25"
          >
            <Calendar className="w-4 h-4" />
            <span>{t("nav.book")}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
