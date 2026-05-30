import type { Dictionary } from "@/lib/i18n";
import { staff } from "@/content/staff";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "•";
}

export default function Team({ dict }: { dict: Dictionary }) {
  const t = (k: string) => dict[k] ?? k;
  return (
    <section id="staff" className="py-20 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto reveal">
          <span className="text-ita-green font-bold text-sm uppercase tracking-widest">{t("team.kicker")}</span>
          <h2 className="mt-2 font-serif text-3xl md:text-4xl font-bold text-ink-900">{t("team.title")}</h2>
          <div
            className="mx-auto mt-3 h-1 w-24 rounded-full"
            style={{ background: "linear-gradient(90deg,#0e8f48 33%,#e5e5e5 33% 66%,#d2202f 66%)" }}
          />
          <p className="mt-4 text-ink-700">{t("team.subtitle")}</p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {staff.map((m, i) => (
            <div
              key={i}
              className="reveal text-center bg-cream rounded-2xl border border-slate-100 p-6 hover:-translate-y-1.5 hover:shadow-lg transition"
            >
              {m.photo ? (
                <span
                  className="mx-auto block w-24 h-24 rounded-full bg-cover bg-center ring-4 ring-white shadow"
                  style={{ backgroundImage: `url(${m.photo})` }}
                  aria-label={m.name}
                />
              ) : (
                <span className="mx-auto grid place-items-center w-24 h-24 rounded-full bg-gradient-to-br from-ita-green to-ita-red text-white font-serif font-bold text-2xl shadow">
                  {initials(m.name)}
                </span>
              )}
              <h3 className="mt-4 font-bold text-ink-900">{m.name}</h3>
              <p className="mt-1 text-sm text-ink-700">{m.role}</p>
              {m.langs && m.langs.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  <span className="text-[11px] font-semibold text-ink-700">{t("team.langs")}:</span>
                  {m.langs.map((l) => (
                    <span
                      key={l}
                      className="text-[11px] font-bold text-ita-green bg-green-50 border border-green-100 rounded px-1.5 py-0.5"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
