"""Test della simulazione d'esame: composizione, timer, isolamento, consegna."""
import uuid

from sqlalchemy import select

from app.core.security import create_access_token, hash_password
from app.exercises.schema import build_correct_answer
from app.models.candidato import Candidato
from app.models.contenuti import Esercizio
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
        return c.id, create_access_token(c)


async def _seed(session_factory):
    async with session_factory() as s:
        await importa_tutti(s)


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


async def test_inizia_esame_compone_prova_senza_soluzioni(client, session_factory):
    await _seed(session_factory)
    _, token = await _candidato_attivo(session_factory, "ex-a2@example.com", Livello.A2)
    r = await client.post("/api/v1/esame/inizia", headers=_auth(token))
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["stato"] == "in_corso"
    assert data["durata_totale_sec"] == 3600
    assert 0 < data["tempo_rimanente_sec"] <= 3600
    assert data["n_esercizi"] == len(data["esercizi"]) >= 8
    # nessuna soluzione esposta e tutte le abilità rappresentate
    abilita = {e["abilita"] for e in data["esercizi"]}
    for e in data["esercizi"]:
        assert "soluzione" not in e
    assert {"grammatica", "comprensione_orale", "produzione_orale"} <= abilita


async def test_inizia_due_volte_riprende_la_stessa_sessione(client, session_factory):
    await _seed(session_factory)
    _, token = await _candidato_attivo(session_factory, "ex-resume@example.com", Livello.A2)
    a = (await client.post("/api/v1/esame/inizia", headers=_auth(token))).json()
    b = (await client.post("/api/v1/esame/inizia", headers=_auth(token))).json()
    assert a["id"] == b["id"]  # nessuna nuova sessione mentre una è in corso


async def test_consegna_corretta_punteggio_pieno_su_sezioni_oggettive(client, session_factory):
    await _seed(session_factory)
    _, token = await _candidato_attivo(session_factory, "ex-score@example.com", Livello.B1)
    sess = (await client.post("/api/v1/esame/inizia", headers=_auth(token))).json()

    # costruisco le risposte corrette per gli esercizi auto-corretti
    risposte = []
    async with session_factory() as s:
        for e in sess["esercizi"]:
            es = await s.get(Esercizio, uuid.UUID(e["id"]))
            corretta = build_correct_answer(es.tipo, dict(es.soluzione))
            if corretta is not None:
                risposte.append({"esercizio_id": e["id"], "risposta": corretta})

    r = await client.post(
        f"/api/v1/esame/sessione/{sess['id']}/consegna",
        json={"risposte": risposte},
        headers=_auth(token),
    )
    assert r.status_code == 200, r.text
    rep = r.json()
    assert rep["punteggio"] == 100  # tutte le sezioni oggettive corrette
    assert rep["soglia"] == 60
    # senza chiave AI le produzioni restano in attesa di valutazione manuale
    assert rep["produzioni_in_attesa"] >= 1
    assert rep["esito"] == "in_attesa_valutazione"
    assert any(sez["abilita"] == "grammatica" for sez in rep["sezioni"])


async def test_consegna_vuota_non_supera(client, session_factory):
    await _seed(session_factory)
    _, token = await _candidato_attivo(session_factory, "ex-fail@example.com", Livello.A2)
    sess = (await client.post("/api/v1/esame/inizia", headers=_auth(token))).json()
    # nessuna risposta: punteggio 0 sulle sezioni oggettive
    r = await client.post(
        f"/api/v1/esame/sessione/{sess['id']}/consegna",
        json={"risposte": []},
        headers=_auth(token),
    )
    rep = r.json()
    assert rep["punteggio"] == 0
    assert rep["esito"] in ("non_superato", "in_attesa_valutazione")


async def test_consegna_idempotente_e_report(client, session_factory):
    await _seed(session_factory)
    _, token = await _candidato_attivo(session_factory, "ex-idem@example.com", Livello.A2)
    sess = (await client.post("/api/v1/esame/inizia", headers=_auth(token))).json()
    r1 = (await client.post(f"/api/v1/esame/sessione/{sess['id']}/consegna", json={"risposte": []}, headers=_auth(token))).json()
    r2 = (await client.post(f"/api/v1/esame/sessione/{sess['id']}/consegna", json={"risposte": []}, headers=_auth(token))).json()
    assert r1["punteggio"] == r2["punteggio"]
    rep = (await client.get(f"/api/v1/esame/sessione/{sess['id']}/report", headers=_auth(token))).json()
    assert rep["stato"] == "consegnata"


async def test_isolamento_sessione_tra_candidati(client, session_factory):
    await _seed(session_factory)
    _, tok1 = await _candidato_attivo(session_factory, "ex-own@example.com", Livello.A2)
    _, tok2 = await _candidato_attivo(session_factory, "ex-other@example.com", Livello.A2)
    sess = (await client.post("/api/v1/esame/inizia", headers=_auth(tok1))).json()
    # un altro candidato NON può vedere la sessione (404)
    r = await client.get(f"/api/v1/esame/sessione/{sess['id']}", headers=_auth(tok2))
    assert r.status_code == 404
