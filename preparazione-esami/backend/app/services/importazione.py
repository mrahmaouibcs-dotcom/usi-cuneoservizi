"""Import candidati da CSV.

Colonne attese (intestazione obbligatoria):
    email,nome,cognome,livello,ente_certificatore,data_esame
('data_esame' è opzionale, formato AAAA-MM-GG)
"""
import csv
import io
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.candidato import ActivationToken, Candidato
from ..schemas.candidato import CandidatoCreate
from .candidato_service import crea_candidato


def _parse_data(val: str | None) -> date | None:
    if not val or not val.strip():
        return None
    return date.fromisoformat(val.strip())


async def importa_csv(
    db: AsyncSession, contenuto: str
) -> tuple[list[tuple[Candidato, ActivationToken]], list[dict]]:
    """Crea i candidati dal CSV. Ritorna (creati, errori). Commit a fine import."""
    reader = csv.DictReader(io.StringIO(contenuto))
    creati: list[tuple[Candidato, ActivationToken]] = []
    errori: list[dict] = []

    for i, row in enumerate(reader, start=2):  # riga 1 = intestazione
        email = (row.get("email") or "").strip()
        try:
            dati = CandidatoCreate(
                email=email,
                nome=(row.get("nome") or "").strip(),
                cognome=(row.get("cognome") or "").strip(),
                livello=(row.get("livello") or "").strip(),
                ente_certificatore=(row.get("ente_certificatore") or "").strip(),
                data_esame=_parse_data(row.get("data_esame")),
            )
            exists = await db.execute(
                select(Candidato).where(Candidato.email == str(dati.email).lower())
            )
            if exists.scalar_one_or_none() is not None:
                raise ValueError("email già presente")
            cand, tok = await crea_candidato(db, dati)
            creati.append((cand, tok))
        except Exception as e:  # validazione pydantic, data, duplicati...
            errori.append({"riga": i, "email": email or None, "errore": str(e)})

    await db.commit()
    return creati, errori
