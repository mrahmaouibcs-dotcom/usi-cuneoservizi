"""Router del percorso didattico: unità, esercizi, invio risposte."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.deps import get_current_candidato
from ..models.candidato import Candidato
from ..models.contenuti import Esercizio, Unita
from ..schemas.percorso import (
    EsercizioListItem,
    EsercizioPubblico,
    UnitaDettaglio,
    UnitaListItem,
)
from ..schemas.tentativo import InviaRisposta, RisultatoOut
from ..services.progresso import registra_tentativo

router = APIRouter(tags=["percorso"])

_NO_LIVELLO = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Nessun livello assegnato a questo account",
)


def _verifica_livello(candidato: Candidato) -> None:
    if candidato.livello is None:
        raise _NO_LIVELLO


async def _carica_esercizio_del_livello(
    db: AsyncSession, candidato: Candidato, esercizio_id: uuid.UUID
) -> Esercizio:
    """Carica l'esercizio SOLO se appartiene a un'unità del livello del candidato.

    Restituisce 404 in caso contrario, per non rivelare l'esistenza di contenuti
    di altri livelli (isolamento A2/B1).
    """
    esercizio = await db.get(Esercizio, esercizio_id)
    if esercizio is None:
        raise HTTPException(status_code=404, detail="Esercizio non trovato")
    unita = await db.get(Unita, esercizio.unita_id)
    if unita is None or unita.livello != candidato.livello:
        raise HTTPException(status_code=404, detail="Esercizio non trovato")
    return esercizio


@router.get("/unita", response_model=list[UnitaListItem])
async def lista_unita(
    candidato: Candidato = Depends(get_current_candidato), db: AsyncSession = Depends(get_db)
):
    _verifica_livello(candidato)
    res = await db.execute(
        select(Unita)
        .where(Unita.livello == candidato.livello, Unita.is_published.is_(True))
        .order_by(Unita.sezione, Unita.numero)
    )
    return [UnitaListItem.model_validate(u) for u in res.scalars().all()]


@router.get("/unita/{unita_id}", response_model=UnitaDettaglio)
async def dettaglio_unita(
    unita_id: uuid.UUID,
    candidato: Candidato = Depends(get_current_candidato),
    db: AsyncSession = Depends(get_db),
):
    _verifica_livello(candidato)
    unita = await db.get(Unita, unita_id)
    if unita is None or unita.livello != candidato.livello or not unita.is_published:
        raise HTTPException(status_code=404, detail="Unità non trovata")
    res = await db.execute(
        select(Esercizio).where(Esercizio.unita_id == unita.id).order_by(Esercizio.ordine)
    )
    esercizi = [EsercizioListItem.model_validate(e) for e in res.scalars().all()]
    # costruzione esplicita per non toccare la relationship lazy (contesto async)
    return UnitaDettaglio(
        id=unita.id,
        livello=unita.livello,
        sezione=unita.sezione,
        numero=unita.numero,
        titolo=unita.titolo,
        tema=unita.tema,
        descrizione=unita.descrizione,
        obiettivi_cefr=unita.obiettivi_cefr,
        lezione=unita.lezione or {},
        lessico=unita.lessico or [],
        ordine=unita.ordine,
        esercizi=esercizi,
    )


@router.get("/esercizi/{esercizio_id}", response_model=EsercizioPubblico)
async def dettaglio_esercizio(
    esercizio_id: uuid.UUID,
    candidato: Candidato = Depends(get_current_candidato),
    db: AsyncSession = Depends(get_db),
):
    _verifica_livello(candidato)
    esercizio = await _carica_esercizio_del_livello(db, candidato, esercizio_id)
    # EsercizioPubblico NON include il campo 'soluzione'
    return EsercizioPubblico.model_validate(esercizio)


@router.post("/esercizi/{esercizio_id}/invia", response_model=RisultatoOut)
async def invia_risposta(
    esercizio_id: uuid.UUID,
    body: InviaRisposta,
    candidato: Candidato = Depends(get_current_candidato),
    db: AsyncSession = Depends(get_db),
):
    _verifica_livello(candidato)
    esercizio = await _carica_esercizio_del_livello(db, candidato, esercizio_id)
    return await registra_tentativo(db, candidato, esercizio, body.risposta, body.durata_sec)
