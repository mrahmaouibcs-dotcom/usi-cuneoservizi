import type { Dictionary } from "@/lib/i18n";

export default function HowItWorks({ dict }: { dict: Dictionary }) {
  const t = (k: string) => dict[k] ?? k;
  const steps = [
    { n: "1", bg: "bg-ita-green shadow-ita-green/30", title: t("how.s1t"), desc: t("how.s1d") },
    { n: "2", bg: "bg-ink-800", title: t("how.s2t"), desc: t("how.s2d") },
    { n: "3", bg: "bg-ita-red shadow-ita-red/30", title: t("how.s3t"), desc: t("how.s3d") },
  ];
  return (
    <section id="come-funziona" className="py-20 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto reveal">
          <span className="text-ita-red font-bold text-sm uppercase tracking-widest">{t("how.kicker")}</span>
          <h2 className="mt-2 font-serif text-3xl md:text-4xl font-bold text-ink-900">{t("how.title")}</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="reveal bg-cream rounded-2xl border border-slate-100 p-7 text-center hover:-translate-y-1.5 transition">
              <div className={`w-14 h-14 mx-auto rounded-full ${s.bg} text-white grid place-items-center text-xl font-bold shadow-lg`}>
                {s.n}
              </div>
              <h3 className="mt-4 font-serif font-bold text-lg text-ink-900">{s.title}</h3>
              <p className="mt-2 text-sm text-ink-700">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
