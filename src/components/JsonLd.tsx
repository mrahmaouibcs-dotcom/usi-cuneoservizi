import { site } from "@/lib/site";
import { SITE_URL } from "@/lib/seo";

/**
 * Dati strutturati schema.org (JSON-LD) per il SEO locale.
 * Descrive l'organizzazione e la sede principale di Cuneo come LocalBusiness,
 * con NAP coerente con src/lib/site.ts.
 */
export default function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    "@id": `${SITE_URL}/#organization`,
    name: site.name,
    legalName: site.legalName,
    url: SITE_URL,
    logo: `${SITE_URL}/logo-usi.jpeg`,
    image: `${SITE_URL}/logo-usi.jpeg`,
    telephone: site.phone,
    email: site.email,
    taxID: site.taxCode,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Piazzale della Libertà, 7",
      addressLocality: "Cuneo",
      addressRegion: "CN",
      postalCode: "12100",
      addressCountry: "IT",
    },
    areaServed: "IT",
    availableLanguage: ["it", "en", "fr", "es", "ar", "zh", "ru", "uk", "pl", "ro"],
  };

  return (
    <script
      type="application/ld+json"
      // I dati sono statici e controllati internamente.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
