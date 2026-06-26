"""Schemi per l'invio delle risposte e il risultato."""
from typing import Any

from pydantic import BaseModel, Field


class InviaRisposta(BaseModel):
    risposta: dict[str, Any] = Field(default_factory=dict)
    durata_sec: int = 0


class RisultatoOut(BaseModel):
    punteggio: int
    punteggio_max: int
    corretto: bool | None  # None = in attesa di valutazione AI
    dettaglio: dict[str, Any] = Field(default_factory=dict)
    feedback_ai: dict[str, Any] | None = None
