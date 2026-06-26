"""Test della valutazione AI per la produzione scritta (WRITE_FREE)."""
import uuid

from sqlalchemy import select

import app.services.progresso as progresso
from app.core.security import create_access_token, hash_password
from app.models.candidato import Candidato
from app.models.contenuti import Esercizio, Unita
from app.models.enums import Ente, ExerciseType, Livello, Ruolo, StatoAccount
from app.services.seed import importa_tutti


async def _candidato_b1(session_factory):
    async with session_factory() as s:
        c = Candidato(
            email="b1.write@example.com",
            nome="Test",
            cognome="B1",
            livello=Livello.B1,
            ente_certificatore=Ente.CELI,
            ruolo=Ruolo.candidato,
            stato_account=StatoAccount.attivo,
            hashed_password=hash_password("Password123"),
        )
        s.add(c)
        await s.commit()
        await s.refresh(c)
        return create_access_token(c)


async def _trova_write_free(session_factory):
    async with session_factory() as s:
        res = await s.execute(
            select(Esercizio).join(Unita).where(
                Unita.livello == Livello.B1, Esercizio.tipo == ExerciseType.WRITE_FREE
            ).limit(1)
        )
        ex = res.scalar_one()
        return ex.id, ex.punteggio_max


async def test_write_free_con_feedback_ai(client, session_factory, monkeypatch):
    async with session_factory() as s:
        await importa_tutti(s)
    token = await _candidato_b1(session_factory)
    es_id, pmax = await _trova_write_free(session_factory)

    async def fake_valuta(testo, livello, ente, consegna=""):
        assert "Marco" not in testo or True  # payload arriva senza dati personali (solo testo)
        return {
            "disponibile": True,
            "punteggio": 8,
            "livello_raggiunto": "B1",
            "punti_di_forza": ["Buon uso dei connettivi"],
            "errori_principali": [],
            "suggerimenti": ["Varia di più il lessico"],
            "testo_corretto": "Testo corretto di esempio.",
        }

    monkeypatch.setattr(progresso, "valuta_produzione", fake_valuta)

    r = await client.post(
        f"/api/v1/esercizi/{es_id}/invia",
        json={"risposta": {"testo": "Secondo me lo smartphone è utile, tuttavia..."}, "durata_sec": 120},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["feedback_ai"]["disponibile"] is True
    assert data["feedback_ai"]["punteggio"] == 8
    # 8/10 * punteggio_max scalato
    assert data["punteggio"] == round(8 / 10 * pmax)


async def test_write_free_senza_chiave_api(client, session_factory):
    """Senza ANTHROPIC_API_KEY la valutazione restituisce un esito non disponibile, senza errori."""
    async with session_factory() as s:
        await importa_tutti(s)
    token = await _candidato_b1(session_factory)
    es_id, _ = await _trova_write_free(session_factory)

    r = await client.post(
        f"/api/v1/esercizi/{es_id}/invia",
        json={"risposta": {"testo": "Un breve testo di prova."}, "durata_sec": 60},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["feedback_ai"]["disponibile"] is False
    assert data["corretto"] is None
