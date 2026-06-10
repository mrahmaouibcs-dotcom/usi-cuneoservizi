# Deploy su Aruba — USI · CUNEOServizi

Guida passo-passo per pubblicare il sito (Next.js 16 + PostgreSQL) su una **VPS Aruba Cloud**, con HTTPS automatico e cutover sicuro da Vercel.

**Regola d'oro:** Vercel resta acceso finché il nuovo sito su Aruba non è verificato. Il dominio si "sposta" su Aruba **solo all'ultimo passo (G)**. Nessun minuto di sito offline.

---

## 0) Prerequisiti (acquisti su Aruba)
- [ ] **Cloud VPS O1I2** — 1 vCPU, 2 GB RAM, 40 GB SSD, **Linux (Ubuntu 22.04/24.04 LTS)**, datacenter Italia → ~3,99 €/mese.
- [ ] **Dominio `.it` "con email"** → `usi-cuneoservizi.it` (include le caselle email, tra cui `info@usi-cuneoservizi.it`).
- [ ] Annota: **IP pubblico della VPS**, utente/password root iniziali, password della casella email.

> Quando hai questi dati, passa i comandi qui sotto (oppure dammi IP + accesso SSH e li eseguo io).

---

## A) Primo accesso alla VPS
Dal tuo PC (PowerShell o terminale):
```bash
ssh root@IP_DELLA_VPS
```
Aggiorna il sistema:
```bash
apt update && apt upgrade -y
```

## B) Sicurezza di base
Crea un utente dedicato (non lavoriamo da root):
```bash
adduser usi            # scegli una password
usermod -aG sudo usi
```
Spazio di swap (rete di sicurezza per la build su 2 GB di RAM):
```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```
Firewall (lascia passare SSH + web):
```bash
apt install -y ufw
ufw allow OpenSSH && ufw allow 80 && ufw allow 443
ufw --force enable
```

## C) Installazione software (Node 22, PostgreSQL, Caddy, git)
```bash
# Node.js 22 LTS (Next 16 richiede Node >= 20.9)
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs git postgresql

# Caddy (reverse proxy con HTTPS automatico)
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy
```
Verifica versioni:
```bash
node -v   # atteso v22.x
caddy version
```

## D) Database PostgreSQL
Crea utente e database (scegli una password robusta al posto di `PWD_DB`):
```bash
sudo -u postgres psql -c "CREATE USER usi WITH PASSWORD 'PWD_DB';"
sudo -u postgres psql -c "CREATE DATABASE usi OWNER usi;"
```

## E) Pubblicazione dell'app
Passa all'utente `usi` e prepara la cartella:
```bash
su - usi
sudo mkdir -p /opt/usi && sudo chown usi:usi /opt/usi
cd /opt/usi
git clone https://github.com/mrahmaouibcs-dotcom/usi-cuneoservizi.git
cd usi-cuneoservizi
```
Crea il file `.env` (i segreti vivono SOLO qui, mai su GitHub):
```bash
cp deploy/env.production.example .env
nano .env        # inserisci: password DB (la stessa di PWD_DB), ADMIN_PASSWORD, password email
chmod 600 .env
```
Installa, crea le tabelle, compila:
```bash
npm ci --include=dev
npx prisma db push      # crea la tabella Booking sul PostgreSQL
npm run build
```
Installa il servizio che tiene l'app sempre attiva:
```bash
sudo cp deploy/usi-cuneoservizi.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now usi-cuneoservizi
sudo systemctl status usi-cuneoservizi   # deve risultare "active (running)"
```
Permetti all'utente `usi` di riavviare SOLO questo servizio senza password (serve allo script di deploy):
```bash
echo 'usi ALL=(root) NOPASSWD: /usr/bin/systemctl restart usi-cuneoservizi' | sudo tee /etc/sudoers.d/usi-deploy
```

## F) Reverse proxy + HTTPS (Caddy)
```bash
sudo cp /opt/usi/usi-cuneoservizi/deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```
> Caddy otterrà il certificato HTTPS in automatico **non appena il DNS punterà alla VPS** (passo G). Fino ad allora è normale che il certificato non sia ancora pronto.

## G) DNS + Cutover (l'ultimo passo)
Test rapido prima di spostare il dominio: nel pannello DNS Aruba puoi creare temporaneamente un sottodominio (es. `test.usi-cuneoservizi.it` → IP VPS) per verificare. Quando tutto è ok:
1. Pannello Aruba → **DNS del dominio** `usi-cuneoservizi.it`:
   - Record **A** `@` → **IP della VPS**
   - Record **A** `www` → **IP della VPS** (oppure CNAME `www` → `usi-cuneoservizi.it`)
2. Attendi la propagazione (di solito minuti, max qualche ora).
3. Apri **https://usi-cuneoservizi.it** → HTTPS valido (lucchetto), home in italiano.

## H) Verifica finale (checklist)
- [ ] Home carica su https e mostra il lucchetto.
- [ ] Cambio lingua IT/EN/FR/ES/AR funziona.
- [ ] **Prenotazione di prova** → arriva l'email a te e alla casella `info@`.
- [ ] **Area admin** `/it/admin` → login con `ADMIN_PASSWORD`, si vede la prenotazione di prova.
- [ ] `www.usi-cuneoservizi.it` redirige correttamente.

Solo a verifica completata: su **Vercel** puoi mettere il progetto in pausa o rimuovere il dominio (lo lasciamo come backup su `*.vercel.app`).

## I) Aggiornamenti futuri (ogni volta che cambiamo il sito)
Sul server, da utente `usi`:
```bash
cd /opt/usi/usi-cuneoservizi
bash deploy/deploy.sh
```
Lo script fa tutto: `git pull` → installa → aggiorna DB → build → riavvio.

## Manutenzione (leggera)
- **Aggiornamenti di sicurezza** del sistema, ogni tanto: `sudo apt update && sudo apt upgrade -y`.
- **Backup del database** (consigliato, periodico):
  ```bash
  sudo -u postgres pg_dump usi > ~/backup-usi-$(date +%F).sql
  ```
- **Log dell'app dal vivo:** `journalctl -u usi-cuneoservizi -f`

---

### Promemoria importanti
- Cambia **`ADMIN_PASSWORD`** prima di andare online (nel codice il default è provvisorio).
- Il file **`.env`** non è su GitHub: se ricrei la VPS va riscritto.
- A differenza di Vercel, **il deploy non è automatico**: dopo ogni modifica lancia `deploy/deploy.sh`.
