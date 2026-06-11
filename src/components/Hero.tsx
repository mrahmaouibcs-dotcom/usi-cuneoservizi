import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/locales";
import { ArrowRight } from "@/components/icons";

export default function Hero({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const t = (k: string) => dict[k] ?? k;
  const profiles = [
    { emoji: "👷", title: t("profiles.worker"), desc: t("profiles.workerDesc"), accent: "green" },
    { emoji: "🧓", title: t("profiles.pensioner"), desc: t("profiles.pensionerDesc"), accent: "red" },
    { emoji: "🌍", title: t("profiles.migrant"), desc: t("profiles.migrantDesc"), accent: "green" },
    { emoji: "🏢", title: t("profiles.business"), desc: t("profiles.businessDesc"), accent: "red" },
  ];

  return (
    <section id="top" className="relative overflow-hidden bg-gradient-to-b from-white to-cream">
      <div className="blob blob-g w-72 h-72 -top-10 -left-10" />
      <div className="blob blob-r w-80 h-80 top-20 right-0" />
      <div className="blob blob-w w-64 h-64 bottom-0 left-1/3" />
      <div className="max-w-7xl mx-auto px-4 py-20 lg:py-28 relative grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 reveal">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-semibold text-ink-700">
            <span className="w-2 h-2 rounded-full bg-ita-green pulse-dot" />
            <span>{t("hero.badge")}</span>
          </span>
          <h1 className="mt-5 font-serif text-4xl md:text-5xl lg:text-[3.6rem] font-bold leading-[1.06] text-ink-900">
            <span className="grad-text">{t("hero.title")}</span>
          </h1>
          <p className="mt-5 text-lg text-ink-800 leading-relaxed max-w-2xl">{t("hero.subtitle")}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={`/${lang}/prenota`}
              className="btn-sheen inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-ita-green hover:bg-ita-green-dark text-white font-bold transition shadow-lg shadow-ita-green/30"
            >
              <span>{t("hero.ctaPrimary")}</span>
              <ArrowRight className="w-5 h-5 rtl:scale-x-[-1]" />
            </Link>
            <a
              href="#servizi"
              className="btn-sheen inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-ink-900 hover:bg-ink-800 text-white font-semibold transition shadow-lg shadow-ink-900/30"
            >
              {t("hero.ctaSecondary")}
            </a>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg">
            <div>
              <div className="font-serif text-3xl font-bold text-ita-green counter" data-target="5000" data-suffix="+">0</div>
              <div className="text-xs text-ink-700 mt-1">{t("why.stat1")}</div>
            </div>
            <div>
              <div className="font-serif text-3xl font-bold text-ink-900 counter" data-target="10">0</div>
              <div className="text-xs text-ink-700 mt-1">{t("why.stat2")}</div>
            </div>
            <div>
              <div className="font-serif text-3xl font-bold text-ita-red counter" data-target="98" data-suffix="%">0</div>
              <div className="text-xs text-ink-700 mt-1">{t("why.stat4")}</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 reveal">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="tricolor-flow h-1.5" />
            <div className="p-6">
              <div className="font-serif font-bold text-lg text-ink-900 mb-4">{t("profiles.title")}</div>
              <div className="grid grid-cols-2 gap-3">
                {profiles.map((p) => (
                  <button
                    key={p.title}
                    className={`text-start p-4 rounded-xl border border-slate-200 hover:-translate-y-1 transition ${
                      p.accent === "green"
                        ? "hover:border-ita-green hover:bg-green-50/50"
                        : "hover:border-ita-red hover:bg-red-50/50"
                    }`}
                  >
                    <div className="text-2xl mb-1">{p.emoji}</div>
                    <div className="font-bold text-sm text-ink-900">{p.title}</div>
                    <div className="text-xs text-ink-700">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
