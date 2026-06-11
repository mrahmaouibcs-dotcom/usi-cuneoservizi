import type { Locale } from "@/lib/locales";
import { site } from "@/lib/site";

/**
 * Le sedi mostrate nella sezione "Le nostre sedi" (in fondo alla home).
 * Per aggiungerne una, copia un blocco e compila i campi reali.
 * Solo "city" e "address" sono obbligatori; gli altri sono facoltativi.
 * Se una sede è gestita in autonomia, indicalo in "note".
 */
export type Sede = {
  city: string;
  name?: string;
  address: string;
  mapsHref?: string;
  phone?: string;
  phoneHref?: string;
  email?: string;
  note?: string;
};

export const sedi: Sede[] = [
  {
    city: "Cuneo",
    name: "Sede principale",
    address: site.address,
    mapsHref: site.mapsHref,
    phone: site.phone,
    phoneHref: site.phoneHref,
    email: site.email,
  },
  // --- Altre sedi (da completare con i dati reali) ---
  // {
  //   city: "Torino",
  //   address: "Via Esempio 1, 10100 Torino (TO)",
  //   phone: "+39 011 000 0000",
  //   email: "torino@usi-cuneoservizi.it",
  //   note: "Sede affiliata, gestita in autonomia",
  // },
];

/** Titolo della sezione, tradotto in tutte le lingue del sito. */
export const sediTitle: Record<Locale, string> = {
  it: "Le nostre sedi",
  en: "Our offices",
  fr: "Nos bureaux",
  es: "Nuestras sedes",
  ar: "مكاتبنا",
  zh: "我们的办事处",
  ru: "Наши офисы",
  uk: "Наші офіси",
  pl: "Nasze placówki",
  ro: "Sediile noastre",
};

/** Sottotitolo breve della sezione. */
export const sediIntro: Record<Locale, string> = {
  it: "Indirizzi e contatti delle nostre sedi.",
  en: "Addresses and contacts of our offices.",
  fr: "Adresses et contacts de nos bureaux.",
  es: "Direcciones y contactos de nuestras sedes.",
  ar: "عناوين مكاتبنا وبيانات الاتصال.",
  zh: "我们办事处的地址和联系方式。",
  ru: "Адреса и контакты наших офисов.",
  uk: "Адреси та контакти наших офісів.",
  pl: "Adresy i kontakty naszych placówek.",
  ro: "Adresele și contactele sediilor noastre.",
};
