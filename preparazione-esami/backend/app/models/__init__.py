"""Registra tutti i modelli sulla metadata di Base."""
from .base import Base
from .candidato import ActivationToken, Candidato
from .contenuti import Esercizio, Unita
from .esame import SessioneEsame
from .logs import AccessLog
from .progresso import ProgressoCandidato, TentativoEsercizio

__all__ = [
    "Base",
    "Candidato",
    "ActivationToken",
    "Unita",
    "Esercizio",
    "TentativoEsercizio",
    "ProgressoCandidato",
    "SessioneEsame",
    "AccessLog",
]
