import LegalView from "@/components/LegalView";
import { locales } from "@/lib/locales";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function CookiePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <LegalView lang={lang} docKey="cookie" />;
}
