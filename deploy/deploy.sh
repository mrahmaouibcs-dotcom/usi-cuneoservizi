#!/usr/bin/env bash
# Ripubblica il sito dopo modifiche al codice.
# Da eseguire sul server come utente "usi":  bash deploy/deploy.sh
set -euo pipefail

APP_DIR="/opt/usi/usi-cuneoservizi"
cd "$APP_DIR"

echo "→ [1/5] Aggiorno il codice da GitHub…"
git pull origin main

echo "→ [2/5] Installo le dipendenze (incluse le dev, servono per la build)…"
npm ci --include=dev

echo "→ [3/5] Allineo lo schema del database PostgreSQL…"
npx prisma db push

echo "→ [4/5] Compilo l'app (next build)…"
npm run build

echo "→ [5/5] Riavvio il servizio…"
sudo systemctl restart usi-cuneoservizi

echo "✓ Deploy completato — sito ripubblicato su https://usi-cuneoservizi.it"
