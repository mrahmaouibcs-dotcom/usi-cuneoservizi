"""Router della simulazione d'esame (a tempo, formato enti certificatori)."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.deps import get_current_candidato
from ..models.candidato import Candidato
from ..models.esame import SessioneEsame
from ..schemas.esame import (
    ConsegnaEsame,
    EsameInizia,
    EsameReport,
    EsameStoricoItem,
)
from ..schemas.percorso import EsercizioPubblico
from ..services.esame import (
    _carica_esercizi,
    _stato_corrente,
    consegna,
    crea_sessione,
    tempo_rimanente_sec,
)
from datetime import datetime, timezone

router = APIRouter(prefix="/esame", tags=["esame"])

_NO_LIVELLO = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Nessun livello assegnato a questo account",
)


def _verifica_livello(candidato: Candidato) -> None:
    if candidato.livello is None:
        raise _NO_LIVELLO


async def _carica_sessione(
    db: AsyncSession, candidato: Candidato, sessione_id: uuid.UUID
) -> SessioneEsame:
    s = await db.get(SessioneEsame, sessione_id)
    if s is None or s.candidato_id != candidato.id:
        raise HTTPException(status_code=404, detail="Sessione non trovata")
    return s


async def _stato_iniziale(db: AsyncSession, sessione: SessioneEsame) -> EsameInizia:
    esercizi = await _carica_esercizi(db, sessione)
    return EsameInizia(
        id=sessione.id,
        livello=sessione.livello.value,
        ente=sessione.ente.value if sessione.ente else None,
        durata_totale_sec=sessione.durata_totale_sec,
        tempo_rimanente_sec=tempo_rimanente_sec(sessione),
        stato=_stato_corrente(sessione, datetime.now(timezone.utc)),
        n_esercizi=len(esercizi),
        esercizi=[EsercizioPubblico.model_validate(e) for e in esercizi],
    )


def _report(sessione: SessioneEsame) -> EsameReport:
    d = sessione.dettaglio or {}
    superato = None
    if sessione.esito == "superato":
        superato = True
    elif sessione.esito == "non_superato":
        superato = False
    return EsameReport(
        id=sessione.id,
        livello=sessione.livello.value,
        stato=sessione.stato,
        punteggio=sessione.punteggio,
        soglia=d.get("soglia", 60),
        esito=sessione.esito,
        superato=superato,
        produzioni_in_attesa=d.get("produzioni_in_attesa", 0),
        sezioni=d.get("sezioni", []),
        consegnata_at=sessione.consegnata_at.isoformat() if sessione.consegnata_at else None,
    )


@router.post("/inizia", response_model=EsameInizia)
async def inizia_esame(
    candidato: Candidato = Depends(get_current_candidato), db: AsyncSession = Depends(get_db)
):
    _verifica_livello(candidato)
    sessione = await crea_sessione(db, candidato)
    return await _stato_iniziale(db, sessione)


@router.get("/sessione/{sessione_id}", response_model=EsameInizia)
async def stato_esame(
    sessione_id: uuid.UUID,
    candidato: Candidato = Depends(get_current_candidato),
    db: AsyncSession = Depends(get_db),
):
    _verifica_livello(candidato)
    sessione = await _carica_sessione(db, candidato, sessione_id)
    return await _stato_iniziale(db, sessione)


@router.post("/sessione/{sessione_id}/consegna", response_model=EsameReport)
async def consegna_esame(
    sessione_id: uuid.UUID,
    body: ConsegnaEsame,
    candidato: Candidato = Depends(get_current_candidato),
    db: AsyncSession = Depends(get_db),
):
    _verifica_livello(candidato)
    sessione = await _carica_sessione(db, candidato, sessione_id)
    risposte = {str(r.esercizio_id): r.risposta for r in body.risposte}
    sessione = await consegna(db, sessione, risposte)
    return _report(sessione)


@router.get("/sessione/{sessione_id}/report", response_model=EsameReport)
async def report_esame(
    sessione_id: uuid.UUID,
    candidato: Candidato = Depends(get_current_candidato),
    db: AsyncSession = Depends(get_db),
):
    _verifica_livello(candidato)
    sessione = await _carica_sessione(db, candidato, sessione_id)
    if sessione.consegnata_at is None:
        raise HTTPException(status_code=409, detail="Prova non ancora consegnata")
    return _report(sessione)


@router.get("/storico", response_model=list[EsameStoricoItem])
async def storico_esami(
    candidato: Candidato = Depends(get_current_candidato), db: AsyncSession = Depends(get_db)
):
    _verifica_livello(candidato)
    res = await db.execute(
        select(SessioneEsame)
        .where(SessioneEsame.candidato_id == candidato.id)
        .order_by(SessioneEsame.iniziata_at.desc())
    )
    out = []
    for s in res.scalars().all():
        out.append(
            EsameStoricoItem(
                id=s.id,
                livello=s.livello.value,
                punteggio=s.punteggio,
                esito=s.esito,
                iniziata_at=s.iniziata_at.isoformat(),
                consegnata_at=s.consegnata_at.isoformat() if s.consegnata_at else None,
            )
        )
    return out
