# Audit SEO — USI – CUNEOServizi

> Analisi della piattaforma `usi-cuneoservizi.it` (Next.js 16 App Router, sito multilingua in 10 lingue).
> Data: 2026-06-24 · Branch: `claude/platform-seo-audit-xtiszk`

## Riepilogo

Le **fondamenta sono buone**: routing multilingua con `lang`/`dir` corretti (RTL per l'arabo), un solo `<h1>` per pagina, NAP (nome/indirizzo/telefono) coerente e contenuti tradotti in 10 lingue. Mancano però **gli elementi tecnici che permettono a Google di indicizzare e classificare correttamente** il sito: nessuna sitemap, nessun robots.txt, nessun `hreflang`, nessun canonical, nessun dato strutturato (JSON-LD) e nessun Open Graph. Per un'attività **locale** (CAF/patronato a Cuneo con più sedi) queste lacune limitano fortemente la visibilità su ricerche locali e l'anteprima sui social. Priorità: sbloccare l'indicizzazione (sitemap + robots + `metadataBase`), collegare le versioni linguistiche (`hreflang`) e aggiungere lo schema `LocalBusiness`.

## 1. SEO Tecnica

| Controllo | Stato | File / Azione |
|---|---|---|
| `metadataBase` (URL assoluti per OG/canonical) | 🔴 Mancante | `src/app/[lang]/layout.tsx` — aggiungere `metadataBase: new URL("https://usi-cuneoservizi.it")` |
| Sitemap XML | 🔴 Mancante | Creare `src/app/sitemap.ts` con tutte le route × 10 lingue (home, `/prenota`, `/servizi/[slug]`, legali) |
| `robots.txt` | 🔴 Mancante | Creare `src/app/robots.ts`: `allow /`, `disallow /*/admin`, riferimento alla sitemap |
| `hreflang` / `alternates.languages` | 🔴 Mancante | Per un sito in 10 lingue è **critico**: collegare le versioni linguistiche + `x-default`, in ogni `generateMetadata` |
| Canonical (`alternates.canonical`) | 🔴 Mancante | Definire URL canonico per ogni pagina (evita duplicati tra lingue/anchor/`?service=`) |
| Open Graph / Twitter Card | 🔴 Mancante | Nessun `openGraph`/`twitter` né immagine OG → anteprime social vuote. Aggiungere in layout + immagine `opengraph-image` |
| Dati strutturati JSON-LD | 🔴 Mancante | Nessuno schema. Aggiungere `LocalBusiness`/`Organization`, `BreadcrumbList` (pagine servizio), `Service` |
| Metadata localizzati (home + legali) | 🟡 Parziale | `layout.tsx:12` ha titolo/descrizione **statici in italiano** per tutte le 10 lingue. Le pagine servizio sono localizzate (`servizi/[slug]/page.tsx:49`), ma home, `/prenota`, privacy/termini/cookie no |
| Web manifest / `theme-color` / apple-touch-icon | 🔴 Mancante | Nessun `manifest.ts`, nessun `viewport.themeColor` |
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

- 🔴 **ALTA — Sbloccare l'indicizzazione**: creare `src/app/sitemap.ts` (tutte le route × 10 lingue) e `src/app/robots.ts` (con disallow di `/admin` e link alla sitemap); aggiungere `metadataBase` in `layout.tsx`.
- 🔴 **ALTA — `hreflang` + canonical**: implementare `alternates.languages` (10 lingue + `x-default`) e `alternates.canonical` su tutte le pagine — essenziale per un sito multilingua, evita contenuti duplicati e indica a Google la versione giusta per ogni utente.
- 🔴 **ALTA — Dati strutturati `LocalBusiness`/`Organization`**: aggiungere JSON-LD con NAP, sedi, orari e `sameAs` → forte impatto sulle ricerche locali e sui rich result.
- 🟡 **MEDIA — Metadata localizzati + Open Graph**: rendere title/description dipendenti dalla lingua (home, `/prenota`, pagine legali) e aggiungere `openGraph`/`twitter` con immagine OG dedicata.
- 🟡 **MEDIA — Analytics + Search Console**: installare l'analisi, verificare GSC e inviare la sitemap per monitorare risultati ed errori.
- 🟡 **MEDIA — Google Business Profile**: creare/rivendicare la scheda per Cuneo (e sedi dirette) con categoria, orari, foto e recensioni.
- 🟢 **BASSA — Rifiniture tecniche**: `BreadcrumbList` JSON-LD sulle pagine servizio, logo via `next/image`, `manifest.ts` + `theme-color` + apple-touch-icon, sistemare il link "Accedi" (`Header.tsx:61` → `href="#"`), valutare redirect 308 con persistenza lingua via cookie.
