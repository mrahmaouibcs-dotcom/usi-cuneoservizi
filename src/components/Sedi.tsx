import type { Locale } from "@/lib/locales";
import { sedi, sediTitle, sediIntro, sediAutonomousLabel } from "@/content/sedi";
import { Pin, Phone, Mail, Chevron } from "@/components/icons";

export default function Sedi({ lang }: { lang: Locale }) {
  return (
    <section id="sedi" className="py-16 bg-cream border-t border-slate-100">
      <div className="max-w-5xl mx-auto px-4">
        <details className="group rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <summary className="cursor-pointer list-none select-none flex items-center justify-between gap-4 px-6 py-5 [&::-webkit-details-marker]:hidden">
            <span className="font-serif text-2xl md:text-3xl font-bold text-ink-900">
              {sediTitle[lang]}
            </span>
            <span className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-green-50 text-ita-green transition-transform group-open:rotate-180">
              <Chevron className="w-5 h-5" />
            </span>
          </summary>

          <div className="px-6 pb-6">
            <p className="text-ink-700 mb-5 -mt-1">{sediIntro[lang]}</p>
            <div className="grid sm:grid-cols-2 gap-5">
              {sedi.map((s, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-5 bg-cream/40">
                  <div className="font-serif font-bold text-lg text-ink-900">
                    {s.city}
                    {s.name ? <span className="text-ink-700 font-sans font-semibold text-sm"> · {s.name}</span> : null}
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-ink-800">
                    <li className="flex items-start gap-2">
                      <Pin className="w-4 h-4 mt-0.5 text-ita-green shrink-0" />
                      <a
                        href={s.mapsHref ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`}
                        target="_blank"
                        rel="noopener"
                        className="hover:text-ita-green transition"
                      >
                        {s.address}
                      </a>
                    </li>
                    {s.phone && (
                      <li className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-ita-green shrink-0" />
                        <a href={s.phoneHref ?? `tel:${s.phone}`} className="hover:text-ita-green transition">
                          {s.phone}
                        </a>
                      </li>
                    )}
                    {s.email && (
                      <li className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-ita-green shrink-0" />
                        <a href={`mailto:${s.email}`} className="hover:text-ita-green transition">
                          {s.email}
                        </a>
                      </li>
                    )}
                    {s.autonomous && (
                      <li>
                        <span className="inline-block text-[11px] font-semibold text-ita-red bg-red-50 border border-red-100 rounded px-2 py-0.5">
                          {sediAutonomousLabel[lang]}
                        </span>
                      </li>
                    )}
                    {s.note && <li className="text-xs text-ink-700 italic">{s.note}</li>}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}
