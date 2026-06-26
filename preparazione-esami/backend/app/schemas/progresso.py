"""Schemi di progresso e statistiche del candidato."""
import uuid

from pydantic import BaseModel


class ProgressoUnitaOut(BaseModel):
    unita_id: uuid.UUID
    sezione: str
    titolo: str
    numero: int
    percentuale_completamento: float
    punteggio_medio: float
    esercizi_totali: int
    esercizi_completati: int


class StatisticheOut(BaseModel):
    esercizi_completati: int
    tentativi_totali: int
    punteggio_medio: float
    tempo_totale_sec: int
    streak_giorni: int
    unita_completate: int
    unita_totali: int
