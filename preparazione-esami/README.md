# Preparazione Esami Italiano A2 / B1 — piattaforma riservata

Applicazione full-stack per la preparazione agli esami di lingua italiana
**A2 / B1** (allineata a CILS, CELI, PLIDA, IT), ad **accesso riservato** ai
candidati iscritti al centro di preparazione. L'app per i candidati è pensata
per essere **installabile su smartphone** (PWA).

> Progetto separato e indipendente dal sito aziendale (`/src`) e dalla PWA
> dimostrativa (`/italiano-facile`). Vive interamente in questa cartella.

## Stack

| Strato | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind — **PWA installabile** |
| Backend | FastAPI (Python 3.11), Pydantic v2 |
| Database | PostgreSQL (SQLAlchemy async + Alembic) |
| Auth | JWT Bearer (access 1h / refresh 7g) + attivazione via link 72h |
| AI | Claude API (`claude-sonnet-4-6`) — feedback su scrittura/orale |
| Cache | Redis (sessioni, rate-limit) |
| Storage | S3-compatible (audio esercizi) |

## Struttura

```
preparazione-esami/
├── backend/            # FastAPI
│   ├── app/
│   │   ├── core/       # config, database, security, deps, utils
│   │   ├── models/     # SQLAlchemy ORM
│   │   ├── schemas/    # Pydantic v2
│   │   ├── routers/    # auth, candidato, (percorso/esercizi/… in arrivo)
│   │   ├── services/   # email, candidato, (ai_feedback in arrivo)
│   │   ├── middleware/ # rate limiter
│   │   └── main.py
│   ├── alembic/        # migrations
│   └── tests/          # pytest
├── frontend/           # Next.js PWA (fase 4)
└── docker-compose.yml
```

## Avvio rapido (Docker)

```bash
cd preparazione-esami
docker compose up --build
# Backend:  http://localhost:8000  ·  Docs: http://localhost:8000/docs
```
Le migrazioni Alembic vengono applicate automaticamente all'avvio del backend.

## Sviluppo backend in locale (senza Docker)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # poi personalizza
# DB Postgres locale, oppure SQLite per prova rapida:
export DATABASE_URL="sqlite+aiosqlite:///./dev.db"
alembic upgrade head
uvicorn app.main:app --reload
```

## Test

```bash
cd backend && source .venv/bin/activate
pytest -q          # i test girano su SQLite in memoria, nessun servizio esterno
```

## Sicurezza / accesso (requisito primario)

- **Nessuna registrazione pubblica**: i candidati sono pre-registrati dall'admin.
- Attivazione account tramite link email valido 72h → impostazione password.
- Login con email + password → access token (1h) + refresh token (7g).
- Livello (`A2`/`B1`) e ruolo sono **congelati nel JWT** al login: non modificabili lato client.
- Ruoli: `candidato`, `tutor`, `admin`.
- Rate limiting per IP (Redis nelle fasi successive).

## Roadmap (build a fasi)

- [x] **Fase 1 — Backend foundation**: schema DB, migrations Alembic, auth completo (login/attivazione/refresh/logout, JWT con ruoli e livello), rate-limit base, test pytest. ✅
- [ ] **Fase 2 — Seed contenuti**: ≥3 unità A2 + ≥3 B1, ognuna con ≥5 esercizi di tipi diversi, allineati al QCER.
- [ ] **Fase 3 — API**: percorso → esercizi (invio/valutazione) → simulazione esame → admin (CRUD + import CSV).
- [ ] **Fase 4 — Frontend PWA**: Next.js installabile su smartphone, layout candidato, dashboard, percorso, `ExerciseEngine` (MCQ/FILL → tutti i tipi).
- [ ] **Fase 5 — Claude AI**: feedback in streaming per `WRITE_FREE` e `SPEAK_SIM` (payload anonimizzato).
- [ ] **Fase 6 — Admin panel**: gestione candidati, import CSV, statistiche.

## Note GDPR

- Payload verso Claude API **anonimizzati** (nessun nome/email/dato identificativo).
- `data retention`: tentativi eliminati 2 anni dopo la data esame.
- Diritto all'oblio: `DELETE /api/v1/me` (fase successiva).
- Log di accesso conservati 6 mesi.
