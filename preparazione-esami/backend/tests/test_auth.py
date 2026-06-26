"""Test del flusso di autenticazione e delle guardie di accesso."""
from datetime import datetime, timedelta, timezone

from app.core.security import decode_token, generate_activation_token
from app.models.candidato import ActivationToken, Candidato
from app.models.enums import Ente, Livello, Ruolo, StatoAccount


async def _seed_candidato(
    session_factory, *, email, livello=Livello.A2, ruolo=Ruolo.candidato, ore_validita=72
):
    token = generate_activation_token()
    async with session_factory() as s:
        cand = Candidato(
            email=email,
            nome="Mario",
            cognome="Rossi",
            livello=livello if ruolo == Ruolo.candidato else None,
            ente_certificatore=Ente.CILS if ruolo == Ruolo.candidato else None,
            ruolo=ruolo,
            stato_account=StatoAccount.in_attesa,
        )
        s.add(cand)
        await s.flush()
        at = ActivationToken(
            token=token,
            candidato_id=cand.id,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=ore_validita),
        )
        s.add(at)
        await s.commit()
    return token


async def test_flusso_completo_attivazione_login(client, session_factory):
    token = await _seed_candidato(session_factory, email="mario.rossi@example.com")

    # Login impossibile prima dell'attivazione
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "mario.rossi@example.com", "password": "Password123"},
    )
    assert r.status_code in (401, 403)

    # Attivazione: imposta password e attiva
    r = await client.post(
        f"/api/v1/auth/attiva/{token}", json={"password": "Password123"}
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["candidato"]["livello"] == "A2"
    access = data["access_token"]
    refresh = data["refresh_token"]

    # /me con token valido
    r = await client.get("/api/v1/me", headers={"Authorization": f"Bearer {access}"})
    assert r.status_code == 200
    assert r.json()["email"] == "mario.rossi@example.com"

    # Login ora funziona
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "mario.rossi@example.com", "password": "Password123"},
    )
    assert r.status_code == 200

    # Password errata
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "mario.rossi@example.com", "password": "sbagliata"},
    )
    assert r.status_code == 401

    # Refresh token -> nuovo access token
    r = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert r.status_code == 200
    assert "access_token" in r.json()

    # Il token di attivazione non è riutilizzabile
    r = await client.post(
        f"/api/v1/auth/attiva/{token}", json={"password": "AltraPass123"}
    )
    assert r.status_code == 400


async def test_me_senza_token_negato(client):
    r = await client.get("/api/v1/me")
    assert r.status_code in (401, 403)


async def test_jwt_contiene_livello_e_ruolo(client, session_factory):
    token = await _seed_candidato(session_factory, email="b1.user@example.com", livello=Livello.B1)
    r = await client.post(f"/api/v1/auth/attiva/{token}", json={"password": "Password123"})
    assert r.status_code == 200
    access = r.json()["access_token"]
    payload = decode_token(access)
    assert payload["livello"] == "B1"
    assert payload["ruolo"] == "candidato"
    assert payload["type"] == "access"


async def test_attivazione_token_scaduto(client, session_factory):
    token = await _seed_candidato(
        session_factory, email="scaduto@example.com", ore_validita=-1
    )
    r = await client.post(f"/api/v1/auth/attiva/{token}", json={"password": "Password123"})
    assert r.status_code == 400


async def test_token_manomesso_rifiutato(client):
    r = await client.get("/api/v1/me", headers={"Authorization": "Bearer non.valido.token"})
    assert r.status_code == 401
