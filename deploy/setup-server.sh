#!/usr/bin/env bash
#
# setup-server.sh — Installazione COMPLETA di USI · CUNEOServizi su VPS Ubuntu/Debian.
# Installa: Node.js 22, PostgreSQL, Caddy (HTTPS automatico), clona il repo, build, servizio systemd.
# È idempotente: puoi rilanciarlo senza fare danni.
#
# USO (sulla VPS, come root):
#   curl -fsSL https://raw.githubusercontent.com/mrahmaouibcs-dotcom/usi-cuneoservizi/main/deploy/setup-server.sh | sudo bash
#
set -euo pipefail

REPO_URL="https://github.com/mrahmaouibcs-dotcom/usi-cuneoservizi.git"
DOMAIN="usi-cuneoservizi.it"
APP_USER="usi"
APP_BASE="/opt/usi"
APP_DIR="${APP_BASE}/usi-cuneoservizi"
PORT=3000

say(){ echo -e "\n\033[1;32m→ $*\033[0m"; }
warn(){ echo -e "\033[1;33m! $*\033[0m"; }

# --- 0. Controlli preliminari ---
if [ "$(id -u)" -ne 0 ]; then echo "Esegui come root:  sudo bash setup-server.sh"; exit 1; fi
if ! command -v apt-get >/dev/null 2>&1; then echo "Questo script richiede Ubuntu/Debian (apt)."; exit 1; fi

# --- 1. Segreti (letti dalla tastiera anche se lo script arriva da una pipe) ---
say "Configurazione iniziale — ti chiedo 2 password"
read -rsp "  Password per l'AREA ADMIN del sito (usa lettere e numeri): " ADMIN_PASSWORD </dev/tty; echo
while [ -z "${ADMIN_PASSWORD:-}" ]; do
  read -rsp "  Non può essere vuota. Password admin: " ADMIN_PASSWORD </dev/tty; echo
done
read -rsp "  Password della casella info@${DOMAIN} (INVIO per attivare l'email più tardi): " SMTP_PASS </dev/tty; echo
SMTP_PASS="${SMTP_PASS:-}"

DB_PASS="$(openssl rand -hex 24)"

# --- 2. Pacchetti di base ---
say "Aggiorno il sistema e installo i pacchetti base"
# noninteractive + needrestart in modalità automatica: niente schermate/prompt che bloccano
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a
export NEEDRESTART_SUSPEND=1
APT_OPTS='-y -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold'
apt-get update -y && apt-get $APT_OPTS upgrade
apt-get install $APT_OPTS curl git ufw openssl ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https

# --- 3. Swap (rete di sicurezza per la build su 2 GB di RAM) ---
if ! swapon --show 2>/dev/null | grep -q '/swapfile'; then
  say "Creo 2 GB di swap"
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# --- 4. Firewall (prima SSH, poi web, poi attiva) ---
say "Configuro il firewall (SSH + web)"
ufw allow OpenSSH >/dev/null 2>&1 || ufw allow 22 >/dev/null 2>&1 || true
ufw allow 80 >/dev/null 2>&1 || true
ufw allow 443 >/dev/null 2>&1 || true
ufw --force enable

# --- 5. Node.js 22 LTS ---
NODE_OK=0
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -v | sed 's/v\([0-9]*\).*/\1/')"
  [ -n "${NODE_MAJOR}" ] && [ "${NODE_MAJOR}" -ge 20 ] && NODE_OK=1
fi
if [ "${NODE_OK}" -ne 1 ]; then
  say "Installo Node.js 22 LTS"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
say "Node $(node -v) · npm $(npm -v)"

# --- 6. PostgreSQL (database locale, resta in Italia) ---
say "Installo e configuro PostgreSQL"
apt-get install -y postgresql
systemctl enable --now postgresql
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${APP_USER}'" | grep -q 1; then
  sudo -u postgres psql -c "ALTER USER ${APP_USER} WITH PASSWORD '${DB_PASS}';"
else
  sudo -u postgres psql -c "CREATE USER ${APP_USER} WITH PASSWORD '${DB_PASS}';"
fi
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${APP_USER}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE ${APP_USER} OWNER ${APP_USER};"

# --- 7. Caddy (reverse proxy + HTTPS automatico via Let's Encrypt) ---
if ! command -v caddy >/dev/null 2>&1; then
  say "Installo Caddy"
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  apt-get update -y && apt-get install -y caddy
fi

# --- 8. Utente applicativo + codice ---
id -u "${APP_USER}" >/dev/null 2>&1 || adduser --disabled-password --gecos "" "${APP_USER}"
mkdir -p "${APP_BASE}" && chown "${APP_USER}:${APP_USER}" "${APP_BASE}"
if [ -d "${APP_DIR}/.git" ]; then
  say "Aggiorno il codice esistente (git pull)"
  sudo -u "${APP_USER}" git -C "${APP_DIR}" pull origin main
else
  say "Clono il repository da GitHub"
  sudo -u "${APP_USER}" git clone "${REPO_URL}" "${APP_DIR}"
fi

# --- 9. File .env (segreti, solo sul server) ---
say "Scrivo la configurazione (.env)"
cat > "${APP_DIR}/.env" <<ENVEOF
DATABASE_URL="postgresql://${APP_USER}:${DB_PASS}@localhost:5432/${APP_USER}?schema=public"
ADMIN_PASSWORD="${ADMIN_PASSWORD}"
SMTP_HOST="smtps.aruba.it"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="info@${DOMAIN}"
SMTP_PASS="${SMTP_PASS}"
MAIL_FROM="USI - CUNEOServizi <info@${DOMAIN}>"
MAIL_OFFICE="info@${DOMAIN}"
ENVEOF
chown "${APP_USER}:${APP_USER}" "${APP_DIR}/.env"
chmod 600 "${APP_DIR}/.env"

# --- 10. Dipendenze + schema DB + build (come utente app) ---
say "Installo le dipendenze, creo le tabelle e compilo (qualche minuto)…"
sudo -u "${APP_USER}" bash -lc "cd '${APP_DIR}' && npm ci --include=dev && npx prisma db push && npm run build"

# --- 11. Servizio systemd (app sempre attiva) ---
say "Installo il servizio di sistema"
cp "${APP_DIR}/deploy/usi-cuneoservizi.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now usi-cuneoservizi
echo "${APP_USER} ALL=(root) NOPASSWD: /usr/bin/systemctl restart usi-cuneoservizi" > /etc/sudoers.d/usi-deploy
chmod 440 /etc/sudoers.d/usi-deploy

# --- 12. Caddy: applico la configurazione ---
say "Attivo il reverse proxy con HTTPS"
cp "${APP_DIR}/deploy/Caddyfile" /etc/caddy/Caddyfile
systemctl reload caddy 2>/dev/null || systemctl restart caddy

# --- 13. Healthcheck locale ---
sleep 4
if curl -fsS "http://127.0.0.1:${PORT}" >/dev/null 2>&1; then
  say "L'app risponde correttamente in locale (porta ${PORT}). ✓"
else
  warn "L'app non risponde ancora su ${PORT}. Diagnostica:  journalctl -u usi-cuneoservizi -n 50"
fi

IP="$(curl -fsS https://api.ipify.org 2>/dev/null || echo 'IP_DELLA_VPS')"
cat <<DONEEOF

============================================================
  INSTALLAZIONE COMPLETATA ✓
============================================================
  IP di questa VPS:  ${IP}

  ULTIMO PASSO — DNS (pannello Aruba del dominio ${DOMAIN}):
     record A   @     ->  ${IP}
     record A   www   ->  ${IP}
     (NON toccare i record MX: l'email continua a funzionare)

  Appena il DNS punta qui, Caddy attiva HTTPS da solo.
  Poi apri:  https://${DOMAIN}

  Comandi utili:
   - Stato app:     systemctl status usi-cuneoservizi
   - Log dal vivo:  journalctl -u usi-cuneoservizi -f
   - Ripubblicare:  sudo -u ${APP_USER} bash ${APP_DIR}/deploy/deploy.sh
============================================================
DONEEOF
