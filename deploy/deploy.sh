#!/usr/bin/env bash
# Ripubblica il sito dopo modifiche al codice.
# Da eseguire sul server come utente "usi":  bash deploy/deploy.sh
set -euo pipefail

APP_DIR="/opt/usi/usi-cuneoservizi"
cd "$APP_DIR"

echo "→ [1/6] Aggiorno il codice da GitHub…"
git pull origin main

echo "→ [2/6] Installo le dipendenze (incluse le dev, servono per la build)…"
npm ci --include=dev

echo "→ [3/6] Allineo lo schema del database PostgreSQL…"
npx prisma db push

# Ogni appuntamento occupa delle "caselle" di agenda (tabella BookingSlot) che
# impediscono le doppie prenotazioni. Le prenotazioni create prima che la tabella
# esistesse non ne hanno: senza questo passaggio non occuperebbero nulla e si
# potrebbe prenotare sopra di loro. Lo script è ripetibile: dopo la prima volta
# non fa più niente, quindi lo lasciamo qui e non c'è più da ricordarselo.
echo "→ [4/6] Ricostruisco le caselle di agenda mancanti…"
node --env-file=.env scripts/backfill-slots.mjs --scrivi

echo "→ [5/6] Compilo l'app (next build)…"
npm run build

echo "→ [6/6] Riavvio il servizio…"
sudo systemctl restart usi-cuneoservizi

echo "✓ Deploy completato — sito ripubblicato su https://usi-cuneoservizi.it"
