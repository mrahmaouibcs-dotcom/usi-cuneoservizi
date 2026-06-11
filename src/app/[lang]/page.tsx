import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/locales";
import { getDictionary } from "@/lib/i18n";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import MarqueeBanner from "@/components/MarqueeBanner";
import Services from "@/components/Services";
import HowItWorks from "@/components/HowItWorks";
import WhyUs from "@/components/WhyUs";
import Team from "@/components/Team";
import Languages from "@/components/Languages";
import BookingCTA from "@/components/BookingCTA";
import Sedi from "@/components/Sedi";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import ClientFx from "@/components/ClientFx";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <div className="tricolor-flow h-2 w-full" />
      <TopBar dict={dict} />
      <Header dict={dict} lang={lang} />
      <main className="flex-1">
        <Hero dict={dict} lang={lang} />
        <MarqueeBanner dict={dict} />
        <Services dict={dict} lang={lang} />
        <HowItWorks dict={dict} />
        <WhyUs dict={dict} />
        <Team dict={dict} />
        <Languages dict={dict} lang={lang} />
        <BookingCTA dict={dict} lang={lang} />
        <Sedi lang={lang} />
      </main>
      <Footer dict={dict} lang={lang} />
      <WhatsAppFloat />
      <ClientFx />
    </>
  );
}
