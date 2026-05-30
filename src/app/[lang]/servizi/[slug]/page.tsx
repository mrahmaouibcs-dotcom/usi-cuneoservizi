import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hasLocale, locales, type Locale } from "@/lib/locales";
import { getDictionary } from "@/lib/i18n";
import { site } from "@/lib/site";
import {
  serviceSlug,
  serviceFromSlug,
  serviceDuration,
  type ServiceId,
} from "@/lib/services";
import { serviceContent } from "@/content/services";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import {
  ArrowRight,
  Calendar,
  Check,
  Phone,
  Pin,
  IconCaf,
  IconPatronato,
  IconSindacato,
  IconLingua,
  Globe,
  IconLegale,
} from "@/components/icons";

const ICON: Record<ServiceId, (p: { className?: string }) => React.ReactElement> = {
  caf: IconCaf,
  patr: IconPatronato,
  sind: IconSindacato,
  lang: IconLingua,
  immig: Globe,
  legal: IconLegale,
};

export function generateStaticParams() {
  return locales.flatMap((lang) =>
    Object.values(serviceSlug).map((slug) => ({ lang, slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const id = serviceFromSlug(slug);
  if (!hasLocale(lang) || !id) return {};
  const dict = await getDictionary(lang);
  return {
    title: `${dict[`svc.${id}.t`]} — ${site.name}`,
    description: serviceContent[id].intro,
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const id = serviceFromSlug(slug);
  if (!hasLocale(lang) || !id) notFound();

  const dict = await getDictionary(lang);
  const t = (k: string) => dict[k] ?? k;
  const c = serviceContent[id];
  const Icon = ICON[id];

  return (
    <>
      <div className="tricolor-flow h-2 w-full" />
      <TopBar dict={dict} />
      <Header dict={dict} lang={lang} />

      <main className="flex-1 bg-cream">
        {/* Intestazione servizio */}
        <section className="bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
            <nav className="text-sm text-ink-700 mb-5 flex items-center gap-2">
              <Link href={`/${lang}`} className="hover:text-ita-green">USI – CUNEOServizi</Link>
              <span>/</span>
              <Link href={`/${lang}#servizi`} className="hover:text-ita-green">{t("svcpage.allServices")}</Link>
            </nav>
            <div className="flex items-start gap-4">
              <span className="w-14 h-14 shrink-0 rounded-xl bg-green-50 text-ita-green grid place-items-center border border-green-100">
                <Icon className="w-7 h-7" />
              </span>
              <div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink-900">{t(`svc.${id}.t`)}</h1>
                <p className="mt-3 text-lg text-ink-800 max-w-3xl leading-relaxed">{c.intro}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-12 grid lg:grid-cols-3 gap-8">
          {/* Contenuto */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
              <h2 className="font-serif text-xl font-bold text-ink-900 mb-4">{t("svcpage.whatWeDo")}</h2>
              <ul className="grid sm:grid-cols-2 gap-3">
                {c.prestazioni.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-ink-800">
                    <Check className="w-5 h-5 text-ita-green shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
              <h2 className="font-serif text-xl font-bold text-ink-900 mb-4">{t("svcpage.docs")}</h2>
              <ul className="space-y-2.5">
                {c.documenti.map((d) => (
                  <li key={d} className="flex items-start gap-2.5 text-ink-800">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-ita-red shrink-0" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
              {c.note && (
                <div className="mt-5 rounded-xl bg-green-50/60 border border-green-100 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-ita-green mb-1">{t("svcpage.note")}</div>
                  <p className="text-sm text-ink-800">{c.note}</p>
                </div>
              )}
            </div>

            <p className="text-xs text-ink-700">{t("svcpage.langNote")}</p>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-24">
              <div className="tricolor-flow h-1.5" />
              <div className="p-6">
                <div className="text-sm text-ink-700">
                  {t("booking.duration")}: <strong className="text-ink-900">{serviceDuration[id]} {t("booking.mins")}</strong>
                </div>
                <Link
                  href={`/${lang}/prenota?service=${id}`}
                  className="btn-sheen mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-ita-green hover:bg-ita-green-dark text-white font-bold transition"
                >
                  <Calendar className="w-5 h-5" />
                  {t("svcpage.bookThis")}
                </Link>
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <div className="font-semibold text-ink-900 mb-2">{t("svcpage.help")}</div>
                  <a href={site.phoneHref} className="flex items-center gap-2 text-sm text-ink-700 hover:text-ita-green">
                    <Phone className="w-4 h-4 text-ita-green" /> {site.phone}
                  </a>
                  <a
                    href={site.whatsappHref}
                    target="_blank"
                    rel="noopener"
                    className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#1c8c4e] hover:underline"
                  >
                    WhatsApp: {site.whatsapp}
                  </a>
                  <div className="mt-3 flex items-start gap-2 text-sm text-ink-700">
                    <Pin className="w-4 h-4 text-ita-green shrink-0 mt-0.5" /> {site.address}
                  </div>
                </div>
              </div>
            </div>
            <Link
              href={`/${lang}#servizi`}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-800 hover:text-ita-green"
            >
              <ArrowRight className="w-4 h-4 rotate-180 rtl:rotate-0" />
              {t("svcpage.allServices")}
            </Link>
          </aside>
        </section>
      </main>

      <Footer dict={dict} lang={lang} />
      <WhatsAppFloat />
    </>
  );
}
