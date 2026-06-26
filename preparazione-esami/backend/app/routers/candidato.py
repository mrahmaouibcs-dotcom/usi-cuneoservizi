"""Router 'self' del candidato."""
from fastapi import APIRouter, Depends

from ..core.deps import get_current_candidato
from ..models.candidato import Candidato
from ..schemas.candidato import CandidatoOut

router = APIRouter(tags=["candidato"])


@router.get("/me", response_model=CandidatoOut)
async def leggi_profilo(candidato: Candidato = Depends(get_current_candidato)) -> CandidatoOut:
    return CandidatoOut.model_validate(candidato)
