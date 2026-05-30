import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/locales";
import { site } from "@/lib/site";
import { Calendar, WhatsApp } from "@/components/icons";

export default function BookingCTA({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const t = (k: string) => dict[k] ?? k;
  return (
    <section id="prenota" className="relative py-20 overflow-hidden bg-ink-900 text-white">
      <div className="blob blob-g w-72 h-72 -top-16 left-10 opacity-30" />
      <div className="blob blob-r w-72 h-72 -bottom-16 right-10 opacity-30" />
      <div className="absolute top-0 inset-x-0 tricolor-flow h-1.5" />
      <div className="max-w-4xl mx-auto px-4 text-center relative reveal">
        <h2 className="font-serif text-3xl md:text-4xl font-bold">{t("cta.title")}</h2>
        <p className="mt-3 text-lg text-white/95">{t("cta.subtitle")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={`/${lang}/prenota`}
            className="btn-sheen inline-flex items-center gap-2 px-7 py-4 rounded-lg bg-ita-green hover:bg-ita-green-dark text-white font-bold transition"
          >
            <Calendar className="w-5 h-5" />
            <span>{t("cta.book")}</span>
          </Link>
          <a
            href={site.whatsappHref}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 font-semibold transition"
          >
            <WhatsApp className="w-5 h-5 text-[#25D366]" />
            <span>{t("cta.whatsapp")}</span>
          </a>
        </div>
        <div className="mt-6 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm text-white/95">
          <span>{t("cta.pay")}</span>
          <span className="font-semibold text-white">{site.paymentMethods}</span>
        </div>
      </div>
    </section>
  );
}
