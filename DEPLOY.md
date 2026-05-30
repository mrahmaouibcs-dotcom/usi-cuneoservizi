# Pubblicazione del sito — USI · CUNEOServizi

Soluzione consigliata (gratuita per iniziare): **Vercel** (host) + **Neon** (database PostgreSQL).

> Perché un database PostgreSQL? In locale usiamo SQLite (file `dev.db`), che però non viene conservato sugli host moderni. In produzione si usa un PostgreSQL gestito gratuito (Neon). Il codice cambia di una sola riga.

---

## Passo 1 — Crea gli account (gratuiti)
1. **GitHub** → https://github.com (registrati)
2. **Vercel** → https://vercel.com → "Sign up" → accedi **con GitHub**
3. **Neon** → https://neon.tech → accedi con GitHub → crea un progetto → copia la **Connection string** (inizia con `postgresql://...`)

## Passo 2 — Carica il codice su GitHub
Crea su GitHub un repository vuoto (es. `usi-cuneoservizi`), poi dalla cartella `usi-cuneoservizi`:
```
git remote add origin <URL-del-tuo-repo>.git
git branch -M main
git push -u origin main
```

## Passo 3 — Passa il database a PostgreSQL
1. In `prisma/schema.prisma` cambia il provider:
   ```
   datasource db {
     provider = "postgresql"   // era "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
2. Imposta `DATABASE_URL` con la connection string di Neon (in `.env` e su Vercel).
3. Crea le tabelle sul database:
   ```
   npx prisma db push
   ```
> 👉 Questi passaggi posso farli io in 2 minuti: ti basta darmi la connection string di Neon.

## Passo 4 — Deploy su Vercel
1. Vercel → **Add New… → Project** → importa il repo GitHub.
2. **Root Directory**: seleziona `usi-cuneoservizi` (se il repo è già questa cartella, lascia `./`).
3. **Environment Variables** (Settings → Environment Variables):
   | Nome | Valore |
   |---|---|
   | `DATABASE_URL` | connection string Neon |
   | `ADMIN_PASSWORD` | la password dell'area admin (cambiala!) |
   | `SMTP_HOST` `SMTP_PORT` `SMTP_SECURE` `SMTP_USER` `SMTP_PASS` | credenziali email (opzionale) |
   | `MAIL_FROM` `MAIL_OFFICE` | mittente e destinatario notifiche |
4. **Deploy**. Al termine avrai un indirizzo tipo `usi-cuneoservizi.vercel.app`.

## Passo 5 — Dominio personalizzato (opzionale)
Vercel → Project → **Settings → Domains** → aggiungi `usi-cuneoservizi.it` e segui le istruzioni DNS che Vercel ti mostra (da impostare presso chi gestisce il dominio).

---

## Promemoria importanti
- **Cambia `ADMIN_PASSWORD`** prima di pubblicare (ora è provvisoria).
- Per le **email reali** inserisci le credenziali SMTP della casella `info@usi-cuneoservizi.it`.
- Ad ogni `git push`, Vercel ripubblica automaticamente il sito aggiornato.
- Build: Vercel rileva Next.js da solo; `prisma generate` parte in automatico (`postinstall`).
