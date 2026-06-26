# Preparazione Esami Italiano A2 / B1 — piattaforma riservata

Applicazione per la **preparazione** agli esami di lingua italiana **A2 / B1**
(contenuti allineati al QCER / enti CILS, CELI, PLIDA, IT). I candidati iscritti
al centro si allenano sull'app; l'esame vero si sostiene **in aula**.

- **App candidato**: PWA **installabile su smartphone**, semplice, pensata per
  principianti (pulsanti grandi, un'azione per schermata, feedback a colori).
- **Accesso riservato**: nessuna registrazione pubblica. I candidati sono creati
  dall'amministratore e si attivano tramite link.
- **Un solo server**: il backend FastAPI serve sia le API sia la PWA.

> Progetto separato e indipendente dal sito aziendale (`/src`) e dalla PWA
> dimostrativa (`/italiano-facile`). Vive interamente in questa cartella.

## Stack

| Strato | Tecnologia |
|---|---|
| App candidato | PWA installabile (React + htm via CDN, **nessun build tool**) |
| Backend/API | FastAPI (Python 3.11), Pydantic v2, SQLAlchemy async |
| Database | PostgreSQL (prod) · SQLite (dev/test) |
| Auth | JWT (access 1h / refresh 7g) + attivazione via link 72h, ruoli |
| AI (fase 5) | Claude API — feedback su scrittura libera |
| Cache | Redis (rate-limit) |

## Struttura

```
preparazione-esami/
├── backend/            # FastAPI + API + serve la PWA
│   ├── app/  (core, models, schemas, routers, services, middleware, exercises)
│   ├── scripts/  init_db.py · seed_db.py · crea_admin.py
│   ├── alembic/  (migrazioni, opzionali)
│   └── tests/    (pytest, 31 test)
├── frontend/           # PWA candidato (statica, servita dal backend)
├── data/seed/          # contenuti didattici A2 / B1 (JSON)
└── docker-compose.yml
```

## Avvio rapido con Docker (consigliato)

```bash
cd preparazione-esami
# (facoltativo) imposta admin e chiave segreta:
export ADMIN_EMAIL=admin@scuola.it ADMIN_PASSWORD=unaPasswordSicura SECRET_KEY=$(openssl rand -hex 32)
docker compose up --build
```
Al primo avvio crea automaticamente tabelle, contenuti e l'account admin.
Apri **http://localhost:8000** → schermata di accesso. Le API e la documentazione
interattiva sono su **http://localhost:8000/docs**.

## Avvio in locale senza Docker (prova rapida con SQLite)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

export DATABASE_URL="sqlite+aiosqlite:///./dev.db"
export ADMIN_EMAIL=admin@scuola.it ADMIN_PASSWORD=unaPasswordSicura
python -m scripts.init_db          # tabelle + contenuti + admin
uvicorn app.main:app --reload
# apri http://localhost:8000
```

## Come si usa (flusso del centro)

1. **Accedi come admin** (le credenziali impostate sopra).
2. Crea i candidati: `POST /api/v1/admin/candidati` (o import CSV
   `POST /api/v1/admin/candidati/import`). Colonne CSV:
   `email,nome,cognome,livello,ente_certificatore,data_esame`.
3. Ogni candidato riceve un **link di attivazione** (in dev viene stampato nei
   log del backend; in produzione si invia via email configurando SMTP).
4. Il candidato apre il link, sceglie la password, **installa l'app** sul
   telefono ("Aggiungi a schermata Home") e si allena.

## Contenuti e simulazione d'esame

- **Programma completo A2 e B1**: 16 unità (8 per livello), 166 esercizi
  originali allineati al QCER e al formato degli enti (CILS/CELI/PLIDA/IT).
  Ogni unità ha una **lezione** (teoria con tabelle ed esempi), il **lessico**
  con pronuncia e esercizi su **tutte e 6 le abilità**: grammatica, lessico,
  comprensione scritta, comprensione orale, produzione scritta e orale.
- **Audio**: pronuncia tramite la sintesi vocale italiana del browser (nessun
  file audio da gestire). La comprensione orale nasconde il testo: si ascolta.
- **Produzione orale** (`SPEAK_SIM`): il browser trascrive il parlato
  (riconoscimento vocale `it-IT`, con fallback a testo) e la risposta è valutata
  come la produzione scritta.
- **Simulazione d'esame** (`/api/v1/esame/*`): prova a tempo gestita dal server
  (A2 60′, B1 70′), composta dal pool del livello secondo un blueprint per
  sezioni (ascolto, lettura, strutture, lessico, produzione). Le risposte si
  inviano **in blocco** alla consegna; punteggio normalizzato su **100** con
  **soglia 60**. Report finale per sezione; le produzioni, se manca la chiave
  AI, restano "da valutare".

## Test

```bash
cd backend && source .venv/bin/activate
pytest -q          # SQLite in memoria, nessun servizio esterno
```

## Sicurezza / accesso

- Nessuna registrazione pubblica: candidati pre-registrati dall'admin.
- Attivazione via link valido 72h → impostazione password.
- Login → access token (1h) + refresh token (7g).
- **Livello (A2/B1) e ruolo congelati nel JWT** al login: non modificabili dal
  client. Un candidato A2 non vede mai contenuti B1 e viceversa (404).
- Le **soluzioni** degli esercizi non vengono mai inviate al client.
- Rate limiting per IP.

## Stato (build a fasi)

- [x] **Fase 1** — Backend: schema DB, auth completo, test
- [x] **Fase 2** — Contenuti A2/B1 (37 esercizi) + motore di correzione + QA
- [x] **Fase 3** — API didattica: percorso, esercizi, invio risposte, progressi
- [x] **Fase 4** — PWA candidato installabile (E2E verificata)
- [x] **Fase 5** — Feedback AI (Claude) per la scrittura libera (richiede `ANTHROPIC_API_KEY`)
- [x] **Fase 6** — Admin: candidati, import CSV, statistiche + pannello grafico nella PWA
- [x] **Fase 7** — Programma completo A2/B1 (166 esercizi, 6 abilità) + audio + produzione orale
- [x] **Fase 8** — Simulazione d'esame cronometrata (formato enti), report su 100, soglia 60

## Note GDPR

- Diritto all'oblio: `DELETE /api/v1/admin/candidati/{id}` elimina il candidato
  e, in cascata, tentativi e progressi.
- I payload inviati a Claude (fase 5) saranno **anonimizzati** (nessun
  nome/email/dato identificativo).
- Conservazione log di accesso: 6 mesi (da configurare in produzione).
