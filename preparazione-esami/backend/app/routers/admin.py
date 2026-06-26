"""Router amministratore: gestione candidati, import CSV, statistiche."""
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import get_settings
from ..core.database import get_db
from ..core.deps import require_roles
from ..core.security import generate_activation_token
from ..models.candidato import ActivationToken, Candidato
from ..models.contenuti import Esercizio, Unita
from ..models.enums import Livello, Ruolo, StatoAccount
from ..models.progresso import TentativoEsercizio
from ..schemas.admin import (
    CandidatoAdminOut,
    CandidatoCreatoAdmin,
    CandidatoUpdate,
    ImportResult,
    StatisticheGlobali,
)
from ..schemas.candidato import CandidatoCreate
from ..schemas.common import Message
from ..schemas.progresso import StatisticheOut
from ..services.candidato_service import crea_candidato
from ..services.email import build_activation_url, invia_link_attivazione
from ..services.importazione import importa_csv
from ..services.progresso import statistiche_candidato

settings = get_settings()
router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_roles(Ruolo.admin))])


def _creato(cand: Candidato, token: str) -> CandidatoCreatoAdmin:
    return CandidatoCreatoAdmin(
        candidato=CandidatoAdminOut.model_validate(cand),
        activation_token=token,
        activation_url=build_activation_url(token),
    )


@router.get("/candidati", response_model=list[CandidatoAdminOut])
async def lista_candidati(
    livello: Livello | None = None,
    stato: StatoAccount | None = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(Candidato).where(Candidato.ruolo == Ruolo.candidato)
    if livello is not None:
        q = q.where(Candidato.livello == livello)
    if stato is not None:
        q = q.where(Candidato.stato_account == stato)
    res = await db.execute(q.order_by(Candidato.cognome, Candidato.nome))
    return [CandidatoAdminOut.model_validate(c) for c in res.scalars().all()]


@router.post("/candidati", response_model=CandidatoCreatoAdmin, status_code=201)
async def crea_singolo(dati: CandidatoCreate, db: AsyncSession = Depends(get_db)):
    exists = await db.execute(
        select(Candidato).where(Candidato.email == str(dati.email).lower())
    )
    if exists.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email già registrata")
    cand, tok = await crea_candidato(db, dati)
    await db.commit()
    await db.refresh(cand)
    await invia_link_attivazione(cand.email, tok.token)
    return _creato(cand, tok.token)


@router.post("/candidati/import", response_model=ImportResult)
async def import_candidati(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    raw = await file.read()
    try:
        testo = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        testo = raw.decode("latin-1")
    creati, errori = await importa_csv(db, testo)
    for cand, tok in creati:
        await invia_link_attivazione(cand.email, tok.token)
    return ImportResult(
        creati=len(creati),
        falliti=len(errori),
        errori=errori,
        candidati=[_creato(c, t.token) for c, t in creati],
    )


@router.post("/candidati/{candidato_id}/attivazione", response_model=CandidatoCreatoAdmin)
async def rigenera_attivazione(candidato_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Genera un nuovo link di attivazione per un candidato non ancora attivo."""
    cand = await db.get(Candidato, candidato_id)
    if cand is None:
        raise HTTPException(status_code=404, detail="Candidato non trovato")
    if cand.stato_account == StatoAccount.attivo:
        raise HTTPException(status_code=400, detail="Il candidato è già attivo")
    tok = ActivationToken(
        token=generate_activation_token(),
        candidato_id=cand.id,
        expires_at=datetime.now(timezone.utc)
        + timedelta(hours=settings.activation_token_expire_hours),
    )
    db.add(tok)
    await db.commit()
    await invia_link_attivazione(cand.email, tok.token)
    return _creato(cand, tok.token)


@router.patch("/candidati/{candidato_id}", response_model=CandidatoAdminOut)
async def aggiorna_candidato(
    candidato_id: uuid.UUID, dati: CandidatoUpdate, db: AsyncSession = Depends(get_db)
):
    cand = await db.get(Candidato, candidato_id)
    if cand is None:
        raise HTTPException(status_code=404, detail="Candidato non trovato")
    for campo, valore in dati.model_dump(exclude_unset=True).items():
        setattr(cand, campo, valore)
    await db.commit()
    await db.refresh(cand)
    return CandidatoAdminOut.model_validate(cand)


@router.delete("/candidati/{candidato_id}", response_model=Message)
async def elimina_candidato(candidato_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    cand = await db.get(Candidato, candidato_id)
    if cand is None:
        raise HTTPException(status_code=404, detail="Candidato non trovato")
    await db.delete(cand)  # cascade: tentativi, progressi, token
    await db.commit()
    return Message(detail="Candidato eliminato")


@router.get("/statistiche/globali", response_model=StatisticheGlobali)
async def statistiche_globali(db: AsyncSession = Depends(get_db)):
    async def _count(q):
        return (await db.execute(q)).scalar() or 0

    base = select(func.count()).select_from(Candidato).where(Candidato.ruolo == Ruolo.candidato)
    return StatisticheGlobali(
        candidati_totali=await _count(base),
        candidati_attivi=await _count(base.where(Candidato.stato_account == StatoAccount.attivo)),
        candidati_in_attesa=await _count(base.where(Candidato.stato_account == StatoAccount.in_attesa)),
        candidati_a2=await _count(base.where(Candidato.livello == Livello.A2)),
        candidati_b1=await _count(base.where(Candidato.livello == Livello.B1)),
        tentativi_totali=await _count(select(func.count()).select_from(TentativoEsercizio)),
        esercizi_disponibili=await _count(select(func.count()).select_from(Esercizio)),
        unita_disponibili=await _count(select(func.count()).select_from(Unita)),
    )


@router.get("/statistiche/candidato/{candidato_id}", response_model=StatisticheOut)
async def statistiche_di_candidato(candidato_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    cand = await db.get(Candidato, candidato_id)
    if cand is None:
        raise HTTPException(status_code=404, detail="Candidato non trovato")
    return await statistiche_candidato(db, cand)
