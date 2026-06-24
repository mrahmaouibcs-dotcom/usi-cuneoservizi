# Audit SEO — USI – CUNEOServizi

> Analisi della piattaforma `usi-cuneoservizi.it` (Next.js 16 App Router, sito multilingua in 10 lingue).
> Data: 2026-06-24 · Branch: `claude/platform-seo-audit-xtiszk`

## Riepilogo

Le **fondamenta sono buone**: routing multilingua con `lang`/`dir` corretti (RTL per l'arabo), un solo `<h1>` per pagina, NAP (nome/indirizzo/telefono) coerente e contenuti tradotti in 10 lingue. Mancavano però **gli elementi tecnici che permettono a Google di indicizzare e classificare correttamente** il sito: sitemap, robots.txt, `hreflang`, canonical, dato strutturato (JSON-LD) e Open Graph. Per un'attività **locale** (CAF/patronato a Cuneo con più sedi) queste lacune limitavano fortemente la visibilità su ricerche locali e l'anteprima sui social. **In questo PR sono state implementate tutte le azioni a priorità ALTA** (vedi sotto); restano alcune rifiniture a priorità MEDIA/BASSA e attività off-platform (Analytics, Search Console, Google Business Profile).

## ✅ Implementato in questo PR

Dominio canonico: **`https://www.usi-cuneoservizi.it`** (centralizzato in `src/lib/site.ts`).

- **Sitemap XML** dinamica → `src/app/sitemap.ts` (tutte le route × 10 lingue con `hreflang`, esclusa `/admin`).
- **robots.txt** → `src/app/robots.ts` (allow `/`, disallow `/*/admin`, riferimento alla sitemap + `host`).
- **`metadataBase`** + **canonical** + **`hreflang`** (10 lingue + `x-default`) su tutte le pagine, tramite l'helper `src/lib/seo.ts`.
- **Open Graph** localizzato per pagina (home, prenota, servizi, legali) con `og:locale` per lingua e immagine; **Twitter Card** di base.
- **Metadata localizzati**: `layout.tsx` ora usa `generateMetadata` (titolo/descrizione dalla lingua corrente, con `title.template`); aggiunti metadata localizzati a `/prenota` e alle pagine legali.
- **Dati strutturati JSON-LD** `Organization`/`LocalBusiness` (NAP, lingue, indirizzo) → `src/components/JsonLd.tsx`, reso nel layout.
- **`theme-color`** via export `viewport` nel layout.

## 1. SEO Tecnica

| Controllo | Stato | File / Azione |
|---|---|---|
| `metadataBase` (URL assoluti per OG/canonical) | 🟢 Fatto | `layout.tsx` → `metadataBase: new URL(SITE_URL)` (www) |
| Sitemap XML | 🟢 Fatto | `src/app/sitemap.ts` — tutte le route × 10 lingue con `hreflang` |
| `robots.txt` | 🟢 Fatto | `src/app/robots.ts` — allow `/`, disallow `/*/admin`, sitemap + host |
| `hreflang` / `alternates.languages` | 🟢 Fatto | 10 lingue + `x-default` via `alternates()` in `src/lib/seo.ts` |
| Canonical (`alternates.canonical`) | 🟢 Fatto | URL canonico per pagina (home, prenota, servizi, legali) |
| Open Graph / Twitter Card | 🟢 Fatto | `openGraph()` localizzato per pagina + Twitter base. Migliorabile: immagine OG dedicata (`opengraph-image`) invece del logo |
| Dati strutturati JSON-LD | 🟢 Fatto (parz.) | `Organization`/`LocalBusiness` in `src/components/JsonLd.tsx`. Da aggiungere: `BreadcrumbList` (pagine servizio), `Service` |
| Metadata localizzati (home + legali) | 🟢 Fatto | `layout.tsx` usa `generateMetadata` localizzato + `title.template`; aggiunti a `/prenota` e pagine legali |
| `theme-color` | 🟢 Fatto | export `viewport` in `layout.tsx` |
| Web manifest / apple-touch-icon | 🔴 Mancante | Aggiungere `manifest.ts` e apple-touch-icon |
| Ottimizzazione immagini | 🟡 Da migliorare | Logo via `<img>` raw (`Header.tsx:24`, eslint-disable) invece di `next/image` → niente lazy-load/responsive, impatto su LCP |
| Attributi `lang` / `dir` | 🟢 OK | `layout.tsx:33-36` imposta `lang` per locale e `dir="rtl"` per l'arabo |
| `<h1>` unico per pagina | 🟢 OK | Hero, pagine servizio, prenota, legali: un solo `<h1>` ciascuna |
| `noindex` area riservata | 🟢 OK | `admin/page.tsx:10` → `robots: { index: false }` |
| Redirect root → lingua | 🟡 Rivedere | `proxy.ts:27` usa `redirect` (307 temporaneo) in base ad `Accept-Language`; valutare 308 e/o persistenza con cookie |
| Link "Accedi" nell'header | 🟡 Da sistemare | `Header.tsx:61` punta a `href="#"` (link morto) |

## 2. SEO On-Page

- 🟢 **Titoli efficaci**: il titolo home è ricco di keyword pertinenti (CAF, Patronato, Sindacato, Lingua, Immigrazione, Legale) — `layout.tsx:13`. Le pagine servizio generano titoli e descrizioni dedicati e tradotti — `servizi/[slug]/page.tsx:58-61`.
- 🔴 **Title/description non localizzati** sulla home e su `/prenota`: tutte le lingue ricevono lo stesso testo italiano del layout. Per `/en`, `/fr`, ecc. servono titoli nella lingua corrispondente (spostare i metadata in un `generateMetadata` che legge il dizionario).
- 🔴 **Pagine legali senza metadata**: privacy, termini, cookie e `/prenota` non definiscono metadata → ereditano il titolo generico del layout. Assegnare title/description unici (o almeno canonical + `hreflang`).
- 🟢 **Struttura heading** pulita: `<h1>` unico + `<h2>` sezioni nelle pagine servizio (`svcpage.whatWeDo`, `svcpage.docs`).
- 🟢 **Alt text** presente sul logo (`Header.tsx:26`); le altre icone sono SVG decorativi inline (corretto non descriverle).
- 🟡 **Breadcrumb solo visiva** nelle pagine servizio (`servizi/[slug]/page.tsx:88`): manca il corrispondente JSON-LD `BreadcrumbList`.
- 🟢 **Contenuti ricchi e tradotti** tramite dizionari (`src/dictionaries/*.json`) e contenuti servizi (`src/content/services.ts`) → buona base testuale multilingua.
- 🟡 **Link interni**: navigazione coerente (header/footer linkano servizi e legali), ma molti link home sono anchor (`#servizi`): assicurarsi che le pagine servizio dedicate (già esistenti e statiche) siano ben collegate per la link equity.

## 3. SEO Off-Page

- 🟢 **NAP coerente**: nome, indirizzo (Piazzale della Libertà 7, Cuneo), telefono e email centralizzati in `src/lib/site.ts` e ripetuti coerentemente nel footer → ottima base per le citazioni locali.
- 🔴 **Nessun dato strutturato `LocalBusiness`**: è l'elemento off-page/local più importante mancante. Con più sedi (`src/content/sedi.ts`: Cuneo, Roma ×2, Rieti, Bergamo, Imperia) si può pubblicare schema `LocalBusiness`/`Organization` con `address`, `telephone`, `geo`, `openingHours` e `areaServed`.
- 🔴 **Nessun `sameAs` / profili social**: il footer non contiene link a Facebook/Instagram/LinkedIn → impossibile collegare i profili nello schema `Organization`. Aggiungere i canali social e referenziarli in `sameAs`.
- 🟠 **Google Business Profile** (azione off-platform): creare/rivendicare la scheda GBP per la sede di Cuneo (e per le sedi gestite direttamente), con categoria "CAF"/"Patronato", orari, foto e recensioni — leva n.1 per le ricerche locali "CAF Cuneo", "patronato Cuneo".
- 🟠 **Citazioni e directory locali**: registrare l'attività su PagineGialle, directory di categoria e portali di servizi al cittadino con NAP identico a quello del sito.

## 4. Strategia & Monitoraggio

- 🔴 **Nessuna web analytics**: non risultano GA4, Plausible o simili. Installare uno strumento di analisi (preferibile soluzione GDPR-friendly, vista l'utenza e le pagine legali già presenti).
- 🔴 **Google Search Console non collegata**: nessun meta di verifica. Verificare la proprietà, inviare la sitemap e monitorare copertura indicizzazione + errori `hreflang`.
- 🟡 **Targeting keyword locale + multilingua**: definire keyword per servizio e lingua (es. "CAF Cuneo", "patronato Cuneo", "esame italiano A2 B1 Cuneo", "permesso di soggiorno Cuneo" e equivalenti per le comunità straniere target — arabo, cinese, ucraino, ecc.). Le pagine servizio dedicate sono il veicolo ideale.
- 🟡 **Contenuti editoriali**: valutare una sezione FAQ/guide (es. "documenti per il 730", "come prenotare il test di lingua") per intercettare query informazionali e arricchire i contenuti indicizzabili.
- 🟢 **Performance di base**: `next/font` con subset corretti (incl. arabo) — buono per CLS/caricamento font. Da completare con `next/image` per il logo e un'immagine OG ottimizzata.

## ⭐ Azioni prioritarie

- ✅ **ALTA — Indicizzazione** (fatto): `src/app/sitemap.ts` + `src/app/robots.ts` + `metadataBase`.
- ✅ **ALTA — `hreflang` + canonical** (fatto): `alternates.languages` (10 lingue + `x-default`) e `alternates.canonical` su tutte le pagine.
- ✅ **ALTA — Dati strutturati `LocalBusiness`/`Organization`** (fatto): JSON-LD con NAP e lingue. Da estendere con sedi/orari/`sameAs` quando disponibili i profili social.
- ✅ **MEDIA — Metadata localizzati + Open Graph** (fatto): title/description per lingua su home, `/prenota` e pagine legali + `openGraph`/`twitter`. Resta da creare un'immagine OG dedicata.
- 🟡 **MEDIA — Analytics + Search Console**: installare l'analisi (GDPR-friendly), verificare GSC e inviare la sitemap per monitorare risultati ed errori.
- 🟡 **MEDIA — Google Business Profile**: creare/rivendicare la scheda per Cuneo (e sedi dirette) con categoria, orari, foto e recensioni.
- 🟢 **BASSA — Rifiniture tecniche**: `BreadcrumbList` JSON-LD sulle pagine servizio, immagine OG dedicata, logo via `next/image`, `manifest.ts` + apple-touch-icon, sistemare il link "Accedi" (`Header.tsx:61` → `href="#"`), valutare redirect 308 con persistenza lingua via cookie.
