import type { Locale } from "@/lib/locales";
import { site } from "@/lib/site";

/**
 * Le sedi mostrate nella sezione "Le nostre sedi" (in fondo alla home).
 * Per aggiungerne una, copia un blocco e compila i campi reali.
 * Solo "city" e "address" sono obbligatori; gli altri sono facoltativi.
 * Metti "autonomous: true" per le sedi gestite in autonomia (mostra una nota tradotta).
 * Il link alla mappa viene generato dall'indirizzo se non indichi "mapsHref".
 */
export type Sede = {
  city: string;
  name?: string;
  address: string;
  mapsHref?: string;
  phone?: string;
  phoneHref?: string;
  email?: string;
  autonomous?: boolean;
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
  {
    city: "Roma",
    name: "Sede 1",
    address: "Largo Giuseppe Veratti, 25 - 00146 Roma",
    autonomous: true,
  },
  {
    city: "Roma",
    name: "Sede 2",
    address: "Piazza Gaetano Mosca, 50/51 - 00148 Roma",
    autonomous: true,
  },
  {
    city: "Rieti",
    address: "Via Florido, 44 - 02030 Poggio Nativo (RI)",
    autonomous: true,
  },
  {
    city: "Bergamo",
    address: "Via Matteotti, 2/4 - 24040 Stezzano (BG)",
    autonomous: true,
  },
  {
    city: "Imperia",
    address: "Via F. Cascione, 144 - 18100 Imperia",
    autonomous: true,
  },
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

/** Etichetta per le sedi gestite in autonomia, tradotta. */
export const sediAutonomousLabel: Record<Locale, string> = {
  it: "Sede gestita in autonomia",
  en: "Independently managed office",
  fr: "Bureau géré de façon autonome",
  es: "Sede gestionada de forma autónoma",
  ar: "مكتب يُدار بشكل مستقل",
  zh: "由独立方自主管理的办事处",
  ru: "Офис под самостоятельным управлением",
  uk: "Офіс під самостійним управлінням",
  pl: "Placówka zarządzana niezależnie",
  ro: "Sediu gestionat în mod autonom",
};
