import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/locales";
import { site } from "@/lib/site";
import { serviceSlug } from "@/lib/services";
import { Phone, Mail, Pin } from "@/components/icons";

export default function Footer({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const t = (k: string) => dict[k] ?? k;
  const services: (keyof typeof serviceSlug)[] = ["caf", "patr", "sind", "immig", "legal"];
  const info = [
    { label: t("footer.privacy"), href: `/${lang}/privacy` },
    { label: t("footer.terms"), href: `/${lang}/termini` },
    { label: t("footer.cookie"), href: `/${lang}/cookie` },
    { label: t("nav.login"), href: `/${lang}/admin` },
  ];
  return (
    <footer id="contatti" className="bg-ink-900 text-amber-50/90 pt-16 pb-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="flag-wave relative w-11 h-11 rounded-lg overflow-hidden grid place-items-center">
              <span className="absolute inset-y-0 left-0 w-1/3 bg-ita-green" />
              <span className="absolute inset-y-0 left-1/3 w-1/3 bg-white" />
              <span className="absolute inset-y-0 right-0 w-1/3 bg-ita-red" />
              <span className="relative font-serif font-bold text-ink-900 text-lg">U</span>
            </span>
            <span className="font-serif font-bold text-lg text-white">
              <span className="text-ita-green">USI</span> – CUNEO<span className="text-ita-red">Servizi</span>
            </span>
          </div>
          <p className="text-[11px] uppercase tracking-wide text-amber-50/90 font-semibold mb-3">
            {site.legalName}
          </p>
          <p className="text-sm leading-relaxed">{t("footer.about")}</p>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4">{t("footer.servicesT")}</h4>
          <ul className="space-y-2 text-sm">
            {services.map((s) => (
              <li key={s}>
                <Link href={`/${lang}/servizi/${serviceSlug[s]}`} className="hover:text-white">
                  {t(`svc.${s}.t`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4">{t("footer.contactT")}</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Pin className="w-4 h-4 mt-0.5 text-ita-green shrink-0" />
              <span>{site.address}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-ita-green shrink-0" />
              <a href={site.phoneHref} className="hover:text-white transition">{site.phone}</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-ita-green shrink-0" />
              <a href={`mailto:${site.email}`} className="hover:text-white transition">{site.email}</a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4">{t("footer.legalT")}</h4>
          <ul className="space-y-2 text-sm">
            {info.map((i) => (
              <li key={i.label}>
                <Link href={i.href} className="hover:text-white">{i.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-12 pt-6 border-t border-white/10 text-sm text-center text-amber-50/80">
        © 2026 {site.name} — {t("footer.rights")}
      </div>
    </footer>
  );
}
