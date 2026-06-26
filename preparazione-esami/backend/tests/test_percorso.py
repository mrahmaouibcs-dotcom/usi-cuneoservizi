"""Test del percorso didattico: isolamento livelli, no leak soluzioni, scoring, progressi."""
from sqlalchemy import select

from app.core.security import create_access_token, hash_password
from app.exercises.schema import build_correct_answer
from app.models.candidato import Candidato
from app.models.contenuti import Esercizio, Unita
from app.models.enums import Ente, ExerciseType, Livello, Ruolo, StatoAccount
from app.services.seed import importa_tutti


async def _candidato_attivo(session_factory, email, livello):
    async with session_factory() as s:
        c = Candidato(
            email=email,
            nome="Test",
            cognome="Utente",
            livello=livello,
            ente_certificatore=Ente.CILS,
            ruolo=Ruolo.candidato,
            stato_account=StatoAccount.attivo,
            hashed_password=hash_password("Password123"),
        )
        s.add(c)
        await s.commit()
        await s.refresh(c)
        token = create_access_token(c)
        return c.id, token


async def _seed(session_factory):
    async with session_factory() as s:
        await importa_tutti(s)


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


async def test_lista_unita_solo_del_proprio_livello(client, session_factory):
    await _seed(session_factory)
    _, token = await _candidato_attivo(session_factory, "a2@example.com", Livello.A2)
    r = await client.get("/api/v1/unita", headers=_auth(token))
    assert r.status_code == 200
    unita = r.json()
    assert len(unita) >= 3
    assert all(u["livello"] == "A2" for u in unita)


async def test_esercizio_non_espone_soluzione(client, session_factory):
    await _seed(session_factory)
    _, token = await _candidato_attivo(session_factory, "a2b@example.com", Livello.A2)
    r = await client.get("/api/v1/unita", headers=_auth(token))
    unita_id = r.json()[0]["id"]
    r = await client.get(f"/api/v1/unita/{unita_id}", headers=_auth(token))
    assert r.status_code == 200
    es_id = r.json()["esercizi"][0]["id"]
    r = await client.get(f"/api/v1/esercizi/{es_id}", headers=_auth(token))
    assert r.status_code == 200
    assert "soluzione" not in r.json()  # la soluzione non deve MAI uscire


async def test_isolamento_livelli_a2_non_vede_b1(client, session_factory):
    await _seed(session_factory)
    _, token_a2 = await _candidato_attivo(session_factory, "iso@example.com", Livello.A2)
    # prendo un esercizio B1 direttamente dal DB
    async with session_factory() as s:
        res = await s.execute(
            select(Esercizio.id).join(Unita).where(Unita.livello == Livello.B1).limit(1)
        )
        es_b1 = res.scalar_one()
        res = await s.execute(select(Unita.id).where(Unita.livello == Livello.B1).limit(1))
        unita_b1 = res.scalar_one()
    # un candidato A2 NON deve accedere a contenuti B1 (404, non 403, per non rivelarli)
    assert (await client.get(f"/api/v1/esercizi/{es_b1}", headers=_auth(token_a2))).status_code == 404
    assert (await client.get(f"/api/v1/unita/{unita_b1}", headers=_auth(token_a2))).status_code == 404


async def test_invio_risposta_corretta_punteggio_pieno(client, session_factory):
    await _seed(session_factory)
    _, token = await _candidato_attivo(session_factory, "score@example.com", Livello.A2)
    # trovo un MCQ A2 e la sua soluzione (dal DB)
    async with session_factory() as s:
        res = await s.execute(
            select(Esercizio)
            .join(Unita)
            .where(Unita.livello == Livello.A2, Esercizio.tipo == ExerciseType.MCQ)
            .limit(1)
        )
        es = res.scalar_one()
        es_id, soluzione, pmax = es.id, dict(es.soluzione), es.punteggio_max

    risposta = build_correct_answer(ExerciseType.MCQ, soluzione)
    r = await client.post(
        f"/api/v1/esercizi/{es_id}/invia",
        json={"risposta": risposta, "durata_sec": 12},
        headers=_auth(token),
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["punteggio"] == pmax
    assert data["corretto"] is True

    # risposta errata -> meno del massimo
    sbagliata = {"scelta": (soluzione["corretta"] + 1)}
    r = await client.post(
        f"/api/v1/esercizi/{es_id}/invia",
        json={"risposta": sbagliata, "durata_sec": 5},
        headers=_auth(token),
    )
    assert r.json()["punteggio"] < pmax


async def test_progressi_e_statistiche(client, session_factory):
    await _seed(session_factory)
    _, token = await _candidato_attivo(session_factory, "prog@example.com", Livello.A2)
    # completo correttamente tutti gli esercizi MCQ/FILL/REORDER/ecc. di una unità
    r = await client.get("/api/v1/unita", headers=_auth(token))
    unita_id = r.json()[0]["id"]

    import uuid as _uuid

    async with session_factory() as s:
        res = await s.execute(select(Esercizio).where(Esercizio.unita_id == _uuid.UUID(unita_id)))
        esercizi = res.scalars().all()
        dati = [(e.id, e.tipo, dict(e.soluzione)) for e in esercizi]

    inviati = 0
    for es_id, tipo, soluzione in dati:
        risposta = build_correct_answer(tipo, soluzione)
        if risposta is None:  # tipi AI: saltati
            continue
        await client.post(
            f"/api/v1/esercizi/{es_id}/invia",
            json={"risposta": risposta, "durata_sec": 10},
            headers=_auth(token),
        )
        inviati += 1

    r = await client.get("/api/v1/me/progressi", headers=_auth(token))
    assert r.status_code == 200
    prog = next(p for p in r.json() if p["unita_id"] == unita_id)
    assert prog["esercizi_completati"] == inviati
    assert prog["punteggio_medio"] == 100.0  # tutte risposte corrette

    r = await client.get("/api/v1/me/statistiche", headers=_auth(token))
    assert r.status_code == 200
    stats = r.json()
    assert stats["esercizi_completati"] == inviati
    assert stats["tempo_totale_sec"] >= inviati * 10
    assert stats["streak_giorni"] >= 1


async def test_accesso_senza_token_negato(client, session_factory):
    await _seed(session_factory)
    assert (await client.get("/api/v1/unita")).status_code in (401, 403)
