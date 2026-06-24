import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/locales";
import { getDictionary } from "@/lib/i18n";
import { site } from "@/lib/site";
import { alternates, openGraph } from "@/lib/seo";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import BookingWizard from "@/components/booking/BookingWizard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  const title = dict["booking.title"];
  const description = dict["booking.subtitle"];
  return {
    title,
    description,
    alternates: alternates(lang, "/prenota"),
    openGraph: openGraph(lang, "/prenota", `${title} — ${site.name}`, description),
  };
}

export default async function PrenotaPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = (k: string) => dict[k] ?? k;

  return (
    <>
      <div className="tricolor-flow h-2 w-full" />
      <TopBar dict={dict} />
      <Header dict={dict} lang={lang} />
      <main className="flex-1 bg-cream">
        <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink-900">{t("booking.title")}</h1>
            <p className="mt-3 text-ink-700">{t("booking.subtitle")}</p>
          </div>
          <Suspense>
            <BookingWizard dict={dict} lang={lang} />
          </Suspense>
        </section>
      </main>
      <Footer dict={dict} lang={lang} />
      <WhatsAppFloat />
    </>
  );
}
