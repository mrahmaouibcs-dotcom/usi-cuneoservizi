"""Router progressi e statistiche del candidato."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.deps import get_current_candidato
from ..models.candidato import Candidato
from ..schemas.progresso import ProgressoUnitaOut, StatisticheOut
from ..services.progresso import progresso_candidato, statistiche_candidato

router = APIRouter(prefix="/me", tags=["progressi"])


@router.get("/progressi", response_model=list[ProgressoUnitaOut])
async def i_miei_progressi(
    candidato: Candidato = Depends(get_current_candidato), db: AsyncSession = Depends(get_db)
):
    return await progresso_candidato(db, candidato)


@router.get("/statistiche", response_model=StatisticheOut)
async def le_mie_statistiche(
    candidato: Candidato = Depends(get_current_candidato), db: AsyncSession = Depends(get_db)
):
    return await statistiche_candidato(db, candidato)
