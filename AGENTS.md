<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# USI · CUNEOServizi — sito e prenotazioni

**Titolare:** Mohamed RAHMAOUI · **Sito:** www.usi-cuneoservizi.it · **Lingua di lavoro: italiano semplice.**

## ⚠️ Progetto a sé — non mescolare

Questa cartella è **indipendente** da `Desktop\SBRIGO-BuroAI-V3-dev` (piattaforma SBRIGO BuroAI), che ha
uno stack **opposto** (HTML/JS vanilla single-file + Node core zero-dipendenze). Sono due lavori separati:
non portare qui convenzioni, file o decisioni di SBRIGO, e non portare là quelle di qui.

## Cos'è

Sito del centro multiservizi **USI 1912 / CUNEOServizi** (Cuneo): CAF, patronato, servizi sindacali,
esami di lingua italiana, immigrazione, assistenza giuridica, tutela consumatori. **10 lingue.**
Sede principale a Cuneo; le altre sedi in home sono affiliate e si gestiscono in autonomia.

## Stack e pubblicazione

Next.js 16 + React 19 + TypeScript + Tailwind 4 + **Prisma/PostgreSQL** + `nodemailer`.
Gira su una **VPS Aruba Cloud** (Ubuntu) dietro **Caddy**, come servizio systemd. **Il deploy non è
automatico:** dopo ogni modifica va lanciato a mano sul server (vedi `DEPLOY-ARUBA.md`):

```bash
cd /opt/usi/usi-cuneoservizi && bash deploy/deploy.sh
```

**Due database distinti — attenzione:** il `.env` locale punta a **Neon** (cloud, ambiente di *collaudo*,
residuo dell'epoca Vercel); la **produzione** usa PostgreSQL locale sulla VPS (`localhost:5432/usi`).
Un `prisma db push` dal proprio PC tocca il collaudo, non la produzione. Il file `.env.local`
(gitignorato) spegne l'SMTP in locale, così le prove non mandano email vere all'ufficio.

## Come si lavora qui

- **Italiano** nei commenti, nei messaggi di commit e nel parlato; se serve un termine tecnico, spiegalo.
- **Chiedere prima di assumere** quando qualcosa è ambiguo.
- **Human-in-the-loop** su azioni sensibili (pubblicazione, email reali, cancellazioni).
- **Verificare dal comportamento**, non dalla lettura del codice: `scripts/verifica-prenotazioni.mjs`.
- **Regola d'oro:** il sito non deve promettere ciò che non fa. Una promessa non mantenuta in vetrina
  vale come un guasto. Prima si prova a *rendere vera* la promessa; solo se non si può, la si toglie.

## Sistema di prenotazione (rifatto il 2026-07-28)

**Regole d'agenda** — vivono tutte in `src/lib/schedule.ts`, **unica fonte di verità**. Se cambia un
orario, si cambia lì e cambia ovunque (anche il testo mostrato sul sito).

| | |
|---|---|
| Giorni e fasce | Lun-Ven, **10:00-12:00** e **16:00-18:00** |
| Durate | 30 min (CAF, patronato, tutela) · 45 min (sindacali, immigrazione, legale) · 60 min (esami lingua) |
| Preavviso minimo | 24 ore |
| Finestra | 1 mese |
| Chiusure | Festivi italiani in automatico (Pasquetta calcolata). Ferie e patrono: `CHIUSURE_EXTRA` |
| Operatore | **Uno solo** → due appuntamenti non possono mai sovrapporsi |
| Pagamento | **In sede** (contanti, bancomat, Visa, Mastercard). *Nessun pagamento online* |

Capienza reale: **8 appuntamenti/giorno** da 30 min, **4/giorno** da 45 o 60 min.

**Come funziona.** La disponibilità è calcolata **sul server** (`GET /api/availability`) leggendo il
database — il browser non sa chi ha già prenotato e non deve saperlo. Un appuntamento deve stare
**interamente** dentro la fascia: un esame da 60 min non parte alle 11:30, finirebbe dopo la chiusura.

**Perché non si può prenotare due volte lo stesso posto.** La tabella **`BookingSlot`** è la griglia di
occupazione: una riga per ogni casella da 30 minuti, con chiave primaria `AAAA-MM-GGTHH:MM`. È il
**database** a rifiutare i duplicati, anche se due persone confermano nello stesso identico istante —
un controllo scritto solo nel codice lascerebbe scoperto l'attimo fra "verifico" e "salvo".
Un appuntamento lungo occupa più caselle (60 min alle 10:00 → `10:00` e `10:30`).
Annullare dall'admin **libera** le caselle; ripristinare le riprende, o avvisa se sono state occupate.

**Se aggiungi o cambi un servizio:** aggiorna `src/lib/services.ts` (`serviceIds`, `serviceDuration`,
`serviceSlug`) **e** le chiavi `svc.<id>.t` in **tutte e 10** le lingue in `src/dictionaries/`.
Le lingue devono avere esattamente le stesse chiavi: una mancante si vede a schermo come chiave grezza.

## Script

| Comando | A cosa serve |
|---|---|
| `node --env-file=.env scripts/verifica-prenotazioni.mjs` | **Collaudo** end-to-end (col sito acceso). Crea prenotazioni di prova, verifica che doppioni e sovrapposizioni siano rifiutati, poi cancella tutto. Solo su database di collaudo. |
| `node --env-file=.env scripts/backfill-slots.mjs` | Ricostruisce le caselle d'agenda mancanti. Ripetibile. Già incluso in `deploy.sh`: non serve lanciarlo a mano. Aggiungi `--scrivi` per eseguire davvero. |

## Lavori aperti

- **Anti-abuso su `POST /api/bookings`** — l'indirizzo è pubblico e senza limiti: poche decine di
  richieste automatiche riempirebbero l'agenda di prenotazioni finte e sommergerebbero l'ufficio di
  email (ogni prenotazione ne invia due). **È la priorità.**
- **Promemoria email** il giorno prima dell'appuntamento (oggi non esistono, e il sito non li promette più).
- **Area cliente** per seguire le proprie pratiche (oggi non esiste; `/it/admin` è il pannello dello staff).
- **`ADMIN_PASSWORD`** deve essere impostata nel `.env` del server: senza, il codice ripiega su una
  password di riserva scritta nel repository.
