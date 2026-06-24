import type { Metadata } from "next";
import LegalView from "@/components/LegalView";
import { locales, hasLocale } from "@/lib/locales";
import { legalMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return legalMetadata(lang, "termini");
}

export default async function TerminiPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <LegalView lang={lang} docKey="termini" />;
}
