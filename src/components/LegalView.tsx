import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "@/lib/locales";
import { getDictionary } from "@/lib/i18n";
import { site } from "@/lib/site";
import { legalDocs, type LegalKey } from "@/content/legal";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

export default async function LegalView({ lang, docKey }: { lang: string; docKey: LegalKey }) {
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = (k: string) => dict[k] ?? k;
  const doc = legalDocs[docKey];

  return (
    <>
      <div className="tricolor-flow h-2 w-full" />
      <TopBar dict={dict} />
      <Header dict={dict} lang={lang as Locale} />

      <main className="flex-1 bg-cream">
        <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink-900">{t(doc.titleKey)}</h1>
          <p className="mt-2 text-sm text-ink-700">
            {t("legal.updated")}: {doc.updated}
          </p>

          <div className="mt-4 rounded-lg bg-green-50/60 border border-green-100 px-4 py-3 text-sm text-ink-800">
            {t("legal.note")}
          </div>

          <p className="mt-6 text-ink-800 leading-relaxed">{doc.intro}</p>

          <div className="mt-8 space-y-7">
            {doc.sections.map((s) => (
              <section key={s.h}>
                <h2 className="font-serif text-xl font-bold text-ink-900">{s.h}</h2>
                {s.p && <p className="mt-2 text-ink-800 leading-relaxed">{s.p}</p>}
                {s.list && (
                  <ul className="mt-2 space-y-2">
                    {s.list.map((li) => (
                      <li key={li} className="flex items-start gap-2.5 text-ink-800">
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-ita-green shrink-0" />
                        <span>{li}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {/* Recapiti del Titolare */}
          <div className="mt-10 rounded-2xl border border-slate-100 bg-white shadow-sm p-6">
            <h2 className="font-serif text-lg font-bold text-ink-900 mb-2">{site.name}</h2>
            <p className="text-sm text-ink-700">{site.legalName}</p>
            <p className="mt-2 text-sm text-ink-800">{site.address}</p>
            <p className="text-sm text-ink-800">
              Tel: <a href={site.phoneHref} className="hover:text-ita-green">{site.phone}</a> · Email:{" "}
              <a href={`mailto:${site.email}`} className="hover:text-ita-green">{site.email}</a>
            </p>
            <p className="mt-1 text-sm text-ink-700">C.F. {site.taxCode}</p>
            <p className="mt-1 text-sm text-ink-700">{site.usicons}</p>
          </div>
        </article>
      </main>

      <Footer dict={dict} lang={lang as Locale} />
      <WhatsAppFloat />
    </>
  );
}
