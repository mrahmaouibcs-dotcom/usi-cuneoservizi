"""Schemi del percorso didattico (unità ed esercizi lato candidato)."""
import uuid
from typing import Any

from pydantic import BaseModel, ConfigDict

from ..models.enums import ExerciseType, Livello


class EsercizioListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    tipo: ExerciseType
    titolo: str
    ordine: int
    punteggio_max: int


class EsercizioPubblico(BaseModel):
    """Esercizio inviato al candidato: SENZA il campo 'soluzione'."""
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    unita_id: uuid.UUID
    tipo: ExerciseType
    titolo: str
    istruzioni: str
    contenuto: dict[str, Any]
    audio_url: str | None
    punteggio_max: int
    tempo_limite_sec: int | None
    ordine: int


class UnitaListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    livello: Livello
    sezione: str
    numero: int
    titolo: str
    descrizione: str
    obiettivi_cefr: list[str]
    ordine: int


class UnitaDettaglio(UnitaListItem):
    esercizi: list[EsercizioListItem]
