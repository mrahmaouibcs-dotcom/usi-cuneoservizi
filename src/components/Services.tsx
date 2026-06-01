import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/locales";
import { serviceSlug, type ServiceId } from "@/lib/services";
import {
  ArrowRight,
  IconCaf,
  IconPatronato,
  IconSindacato,
  IconLingua,
  Globe,
  IconLegale,
  IconTutela,
} from "@/components/icons";

const SERVICES = [
  { key: "caf", Icon: IconCaf, accent: "green" },
  { key: "patr", Icon: IconPatronato, accent: "red" },
  { key: "sind", Icon: IconSindacato, accent: "green" },
  { key: "lang", Icon: IconLingua, accent: "red" },
  { key: "immig", Icon: Globe, accent: "green" },
  { key: "legal", Icon: IconLegale, accent: "red" },
  { key: "tutela", Icon: IconTutela, accent: "green" },
] as const;

export default function Services({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const t = (k: string) => dict[k] ?? k;
  return (
    <section id="servizi" className="py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto reveal">
          <span className="text-ita-green font-bold text-sm uppercase tracking-widest">
            {t("services.kicker")}
          </span>
          <h2 className="mt-2 font-serif text-3xl md:text-4xl font-bold text-ink-900">
            {t("services.title")}
          </h2>
          <div
            className="mx-auto mt-3 h-1 w-24 rounded-full"
            style={{ background: "linear-gradient(90deg,#0e8f48 33%,#e5e5e5 33% 66%,#d2202f 66%)" }}
          />
          <p className="mt-4 text-ink-700">{t("services.subtitle")}</p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map(({ key, Icon, accent }) => {
            const green = accent === "green";
            return (
              <div key={key} className="svc reveal bg-white rounded-2xl border border-slate-100 p-7 shadow-sm">
                <div
                  className={`w-12 h-12 rounded-xl grid place-items-center mb-4 ${
                    green ? "bg-green-50 text-ita-green" : "bg-red-50 text-ita-red"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-xl text-ink-900">
                  <Link href={`/${lang}/servizi/${serviceSlug[key as ServiceId]}`} className="hover:text-ita-green transition-colors">
                    {t(`svc.${key}.t`)}
                  </Link>
                </h3>
                <p className="mt-2 text-sm text-ink-700 leading-relaxed">{t(`svc.${key}.d`)}</p>
                <Link
                  href={`/${lang}/prenota?service=${key}`}
                  className={`mt-4 inline-flex items-center gap-1.5 text-sm font-bold hover:gap-2.5 transition-all ${
                    green ? "text-ita-green" : "text-ita-red"
                  }`}
                >
                  <span>{t("svc.cta")}</span>
                  <ArrowRight className="w-4 h-4 rtl:scale-x-[-1]" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
