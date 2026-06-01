import type { Dictionary } from "@/lib/i18n";
import { Check } from "@/components/icons";

export default function WhyUs({ dict }: { dict: Dictionary }) {
  const t = (k: string) => dict[k] ?? k;
  const stats = [
    { target: "5000", suffix: "+", color: "text-ita-green", label: t("why.stat1") },
    { target: "5", suffix: "", color: "text-ita-red", label: t("why.stat2") },
    { target: "7", suffix: "", color: "text-ita-red", label: t("why.stat3") },
    { target: "98", suffix: "%", color: "text-ita-green", label: t("why.stat4") },
  ];
  return (
    <section id="chi-siamo" className="py-20">
      <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
        <div className="reveal">
          <span className="text-ita-green font-bold text-sm uppercase tracking-widest">{t("why.kicker")}</span>
          <h2 className="mt-2 font-serif text-3xl md:text-4xl font-bold text-ink-900">{t("why.title")}</h2>
          <p className="mt-4 text-ink-700 leading-relaxed">{t("why.desc")}</p>
          <ul className="mt-6 space-y-3">
            {[t("why.li1"), t("why.li2"), t("why.li3")].map((li) => (
              <li key={li} className="flex items-center gap-3 text-ink-800">
                <Check className="w-5 h-5 text-ita-green shrink-0" />
                <span>{li}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-5 reveal">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6">
              <div className={`font-serif text-4xl font-bold counter ${s.color}`} data-target={s.target} data-suffix={s.suffix}>
                0
              </div>
              <div className="mt-1 text-sm text-ink-700">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
