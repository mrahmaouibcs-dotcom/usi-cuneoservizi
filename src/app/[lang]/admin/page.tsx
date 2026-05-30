import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/locales";
import { getDictionary } from "@/lib/i18n";
import { isAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { site } from "@/lib/site";
import { loginAction, logoutAction, setStatusAction, deleteAction } from "./actions";
import { User, Phone, Mail } from "@/components/icons";

export const metadata = { robots: { index: false } };

const STATUS = {
  pending: { label: "In attesa", cls: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confermata", cls: "bg-green-100 text-green-800" },
  cancelled: { label: "Annullata", cls: "bg-red-100 text-red-700" },
} as const;

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { error } = await searchParams;

  // ---- LOGIN ----
  if (!(await isAdmin())) {
    return (
      <div className="min-h-screen grid place-items-center bg-cream px-4">
        <form
          action={loginAction}
          className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
        >
          <div className="tricolor-flow h-1.5" />
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="relative w-11 h-11 rounded-lg overflow-hidden grid place-items-center shadow">
                <span className="absolute inset-y-0 left-0 w-1/3 bg-ita-green" />
                <span className="absolute inset-y-0 left-1/3 w-1/3 bg-white" />
                <span className="absolute inset-y-0 right-0 w-1/3 bg-ita-red" />
                <span className="relative font-serif font-bold text-ink-900">U</span>
              </span>
              <div className="font-serif font-bold text-lg text-ink-900">Area Admin</div>
            </div>
            <label className="block text-sm font-semibold text-ink-800 mb-1">Password</label>
            <input
              type="password"
              name="password"
              autoFocus
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-ita-green text-ink-900"
            />
            <input type="hidden" name="lang" value={lang} />
            {error && <p className="mt-2 text-sm text-ita-red font-medium">Password errata.</p>}
            <button
              type="submit"
              className="mt-5 w-full px-5 py-2.5 rounded-lg bg-ink-900 hover:bg-ink-800 text-white font-bold transition"
            >
              Accedi
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ---- DASHBOARD ----
  const dict = await getDictionary(lang);
  const bookings = await prisma.booking.findMany({
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });
  const counts = {
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };
  const fmtDate = (d: string) => {
    const [y, m, dd] = d.split("-").map(Number);
    return new Intl.DateTimeFormat("it-IT", { weekday: "short", day: "numeric", month: "short" }).format(
      new Date(y, m - 1, dd)
    );
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="tricolor-flow h-1.5" />
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-serif font-bold text-lg text-ink-900">
            <span className="text-ita-green">USI</span> – Admin prenotazioni
          </div>
          <form action={logoutAction}>
            <input type="hidden" name="lang" value={lang} />
            <button className="text-sm font-semibold text-ink-700 hover:text-ita-red">Esci</button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-4 mb-6 max-w-md">
          <Stat n={counts.pending} label="In attesa" cls="text-amber-600" />
          <Stat n={counts.confirmed} label="Confermate" cls="text-ita-green" />
          <Stat n={counts.cancelled} label="Annullate" cls="text-ita-red" />
        </div>

        {bookings.length === 0 ? (
          <p className="text-ink-700">Nessuna prenotazione al momento.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-700 border-b border-slate-100 bg-slate-50/60">
                  <th className="p-3 font-semibold">Data / Ora</th>
                  <th className="p-3 font-semibold">Servizio</th>
                  <th className="p-3 font-semibold">Cliente</th>
                  <th className="p-3 font-semibold">Contatti</th>
                  <th className="p-3 font-semibold">Note</th>
                  <th className="p-3 font-semibold">Stato</th>
                  <th className="p-3 font-semibold text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const st = STATUS[b.status as keyof typeof STATUS] ?? STATUS.pending;
                  return (
                    <tr key={b.id} className="border-b border-slate-50 last:border-0 align-top">
                      <td className="p-3 whitespace-nowrap font-semibold text-ink-900">
                        {fmtDate(b.date)}
                        <div className="text-ink-700 font-normal">{b.time}</div>
                      </td>
                      <td className="p-3 text-ink-800">{dict[`svc.${b.service}.t`] ?? b.service}</td>
                      <td className="p-3 text-ink-900 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-ink-700" />
                          {b.firstName} {b.lastName}
                        </span>
                      </td>
                      <td className="p-3 text-ink-700">
                        <a href={`tel:${b.phone}`} className="flex items-center gap-1.5 hover:text-ita-green">
                          <Phone className="w-3.5 h-3.5" /> {b.phone}
                        </a>
                        <a href={`mailto:${b.email}`} className="flex items-center gap-1.5 hover:text-ita-green mt-0.5">
                          <Mail className="w-3.5 h-3.5" /> {b.email}
                        </a>
                      </td>
                      <td className="p-3 text-ink-700 max-w-[14rem]">{b.notes || "—"}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1.5 justify-end">
                          {b.status !== "confirmed" && (
                            <StatusBtn lang={lang} id={b.id} status="confirmed" className="bg-ita-green hover:bg-ita-green-dark">
                              Conferma
                            </StatusBtn>
                          )}
                          {b.status !== "cancelled" && (
                            <StatusBtn lang={lang} id={b.id} status="cancelled" className="bg-amber-500 hover:bg-amber-600">
                              Annulla
                            </StatusBtn>
                          )}
                          <form action={deleteAction}>
                            <input type="hidden" name="lang" value={lang} />
                            <input type="hidden" name="id" value={b.id} />
                            <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-ita-red hover:bg-ita-red-dark transition">
                              Elimina
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-xs text-ink-700">
          Sede: {site.address} · {site.phone}
        </p>
      </main>
    </div>
  );
}

function Stat({ n, label, cls }: { n: number; label: string; cls: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
      <div className={`text-3xl font-serif font-bold ${cls}`}>{n}</div>
      <div className="text-xs text-ink-700 mt-1">{label}</div>
    </div>
  );
}

function StatusBtn({
  lang,
  id,
  status,
  className,
  children,
}: {
  lang: string;
  id: string;
  status: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <form action={setStatusAction}>
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition ${className}`}>
        {children}
      </button>
    </form>
  );
}
