import type { Metadata } from "next";
import { Inter, Source_Serif_4, Cairo } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { locales, hasLocale, isRtl, type Locale } from "@/lib/locales";
import { site } from "@/lib/site";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const sourceSerif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin"] });
const cairo = Cairo({ variable: "--font-cairo", subsets: ["arabic", "latin"] });

export const metadata: Metadata = {
  title: `${site.name} | CAF, Patronato, Sindacato, Lingua, Immigrazione, Legale`,
  description:
    "Centro multiservizi per cittadini e immigrati: CAF, patronato, servizi sindacali, esami di lingua italiana A2 e B1, immigrazione e assistenza giuridica. Prenotazione online in 5 lingue.",
};

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html
      lang={lang}
      dir={isRtl(lang) ? "rtl" : "ltr"}
      className={`${inter.variable} ${sourceSerif.variable} ${cairo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
