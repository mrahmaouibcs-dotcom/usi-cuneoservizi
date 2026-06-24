import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4, Cairo } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { locales, hasLocale, isRtl } from "@/lib/locales";
import { getDictionary } from "@/lib/i18n";
import { site } from "@/lib/site";
import { SITE_URL, alternates, openGraph } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const sourceSerif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin"] });
const cairo = Cairo({ variable: "--font-cairo", subsets: ["arabic", "latin"] });

export const viewport: Viewport = {
  themeColor: "#0a8f3c",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return { metadataBase: new URL(SITE_URL) };
  const dict = await getDictionary(lang);
  const title = `${site.name} | ${dict["brand.tag"]}`;
  const description = dict["hero.subtitle"];
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s — ${site.name}`,
    },
    description,
    alternates: alternates(lang),
    openGraph: openGraph(lang, "", title, description),
    twitter: { card: "summary_large_image", title, description, images: ["/logo-usi.jpeg"] },
    icons: { icon: "/favicon.ico" },
  };
}

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
      <body className="min-h-full flex flex-col">
        <JsonLd />
        {children}
      </body>
    </html>
  );
}
