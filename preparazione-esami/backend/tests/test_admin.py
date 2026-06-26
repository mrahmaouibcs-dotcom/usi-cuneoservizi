"""Test del pannello admin: creazione, import CSV, statistiche, permessi."""
from app.core.security import create_access_token, hash_password
from app.models.candidato import Candidato
from app.models.enums import Ente, Livello, Ruolo, StatoAccount


async def _utente(session_factory, email, ruolo, livello=None):
    async with session_factory() as s:
        c = Candidato(
            email=email,
            nome="X",
            cognome="Y",
            ruolo=ruolo,
            livello=livello,
            ente_certificatore=Ente.CILS if ruolo == Ruolo.candidato else None,
            stato_account=StatoAccount.attivo,
            hashed_password=hash_password("Password123"),
        )
        s.add(c)
        await s.commit()
        await s.refresh(c)
        return create_access_token(c)


def _auth(t):
    return {"Authorization": f"Bearer {t}"}


async def test_candidato_non_accede_admin(client, session_factory):
    tok = await _utente(session_factory, "cand@example.com", Ruolo.candidato, Livello.A2)
    r = await client.get("/api/v1/admin/candidati", headers=_auth(tok))
    assert r.status_code == 403


async def test_admin_crea_candidato_e_attivazione(client, session_factory):
    tok = await _utente(session_factory, "admin@example.com", Ruolo.admin)
    r = await client.post(
        "/api/v1/admin/candidati",
        headers=_auth(tok),
        json={
            "email": "nuovo@example.com",
            "nome": "Anna",
            "cognome": "Bianchi",
            "livello": "B1",
            "ente_certificatore": "CELI",
        },
    )
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["candidato"]["stato_account"] == "in_attesa"
    assert data["candidato"]["livello"] == "B1"
    token_att = data["activation_token"]
    assert token_att and "?attiva=" in data["activation_url"]

    # email duplicata -> 409
    r = await client.post(
        "/api/v1/admin/candidati",
        headers=_auth(tok),
        json={"email": "nuovo@example.com", "nome": "A", "cognome": "B", "livello": "A2", "ente_certificatore": "CILS"},
    )
    assert r.status_code == 409

    # il candidato può attivarsi e accedere
    r = await client.post(f"/api/v1/auth/attiva/{token_att}", json={"password": "MiaPass123"})
    assert r.status_code == 200
    assert r.json()["candidato"]["email"] == "nuovo@example.com"


async def test_admin_lista_e_filtri(client, session_factory):
    tok = await _utente(session_factory, "admin2@example.com", Ruolo.admin)
    for em, lv in [("a@e.com", "A2"), ("b@e.com", "B1"), ("c@e.com", "A2")]:
        await client.post(
            "/api/v1/admin/candidati",
            headers=_auth(tok),
            json={"email": em, "nome": "N", "cognome": "C", "livello": lv, "ente_certificatore": "CILS"},
        )
    r = await client.get("/api/v1/admin/candidati", headers=_auth(tok))
    assert len([c for c in r.json() if c["ruolo"] == "candidato"]) == 3
    r = await client.get("/api/v1/admin/candidati?livello=A2", headers=_auth(tok))
    assert all(c["livello"] == "A2" for c in r.json())
    assert len(r.json()) == 2


async def test_admin_import_csv(client, session_factory):
    tok = await _utente(session_factory, "admin3@example.com", Ruolo.admin)
    csv = (
        "email,nome,cognome,livello,ente_certificatore,data_esame\n"
        "uno@e.com,Uno,Rossi,A2,CILS,2026-09-15\n"
        "due@e.com,Due,Verdi,B1,PLIDA,\n"
        "tre,Tre,Errato,A2,CILS,\n"  # email non valida -> errore
        "quattro@e.com,Quattro,Blu,C2,CILS,\n"  # livello non valido -> errore
    )
    r = await client.post(
        "/api/v1/admin/candidati/import",
        headers=_auth(tok),
        files={"file": ("candidati.csv", csv.encode("utf-8"), "text/csv")},
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["creati"] == 2
    assert data["falliti"] == 2
    assert len(data["candidati"]) == 2
    assert all("?attiva=" in c["activation_url"] for c in data["candidati"])


async def test_admin_statistiche_globali(client, session_factory):
    tok = await _utente(session_factory, "admin4@example.com", Ruolo.admin)
    await client.post(
        "/api/v1/admin/candidati",
        headers=_auth(tok),
        json={"email": "z@e.com", "nome": "Z", "cognome": "Z", "livello": "A2", "ente_certificatore": "CILS"},
    )
    r = await client.get("/api/v1/admin/statistiche/globali", headers=_auth(tok))
    assert r.status_code == 200
    s = r.json()
    assert s["candidati_totali"] >= 1
    assert s["candidati_in_attesa"] >= 1
    assert s["candidati_a2"] >= 1


async def test_admin_elimina_candidato(client, session_factory):
    tok = await _utente(session_factory, "admin5@example.com", Ruolo.admin)
    r = await client.post(
        "/api/v1/admin/candidati",
        headers=_auth(tok),
        json={"email": "del@e.com", "nome": "D", "cognome": "L", "livello": "A2", "ente_certificatore": "CILS"},
    )
    cid = r.json()["candidato"]["id"]
    r = await client.delete(f"/api/v1/admin/candidati/{cid}", headers=_auth(tok))
    assert r.status_code == 200
    r = await client.get("/api/v1/admin/candidati", headers=_auth(tok))
    assert all(c["id"] != cid for c in r.json())
