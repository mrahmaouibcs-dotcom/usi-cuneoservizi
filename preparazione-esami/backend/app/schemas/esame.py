"""Schemi della simulazione d'esame."""
import uuid
from typing import Any

from pydantic import BaseModel, Field

from .percorso import EsercizioPubblico


class EsameInizia(BaseModel):
    """Stato della prova in corso, con gli esercizi (senza soluzioni)."""
    id: uuid.UUID
    livello: str
    ente: str | None
    durata_totale_sec: int
    tempo_rimanente_sec: int
    stato: str
    n_esercizi: int
    esercizi: list[EsercizioPubblico]


class RispostaEsame(BaseModel):
    esercizio_id: uuid.UUID
    risposta: dict[str, Any] = Field(default_factory=dict)


class ConsegnaEsame(BaseModel):
    risposte: list[RispostaEsame] = Field(default_factory=list)


class SezioneReport(BaseModel):
    abilita: str
    etichetta: str
    ottenuto: int
    massimo: int
    valutata: bool


class EsameReport(BaseModel):
    id: uuid.UUID
    livello: str
    stato: str
    punteggio: int | None
    soglia: int
    esito: str | None
    superato: bool | None
    produzioni_in_attesa: int
    sezioni: list[SezioneReport]
    consegnata_at: str | None


class EsameStoricoItem(BaseModel):
    id: uuid.UUID
    livello: str
    punteggio: int | None
    esito: str | None
    iniziata_at: str
    consegnata_at: str | None
