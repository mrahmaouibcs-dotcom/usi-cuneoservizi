"""Schemi per il pannello amministratore."""
import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from ..models.enums import Ente, Livello, Ruolo, StatoAccount


class CandidatoAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: EmailStr
    nome: str
    cognome: str
    ruolo: Ruolo
    livello: Livello | None
    ente_certificatore: Ente | None
    data_esame: date | None
    stato_account: StatoAccount
    codice_iscrizione: uuid.UUID
    created_at: datetime
    last_login: datetime | None


class CandidatoUpdate(BaseModel):
    nome: str | None = None
    cognome: str | None = None
    livello: Livello | None = None
    ente_certificatore: Ente | None = None
    data_esame: date | None = None
    stato_account: StatoAccount | None = None


class CandidatoCreatoAdmin(BaseModel):
    candidato: CandidatoAdminOut
    activation_token: str
    activation_url: str


class ImportErrore(BaseModel):
    riga: int
    email: str | None = None
    errore: str


class ImportResult(BaseModel):
    creati: int
    falliti: int
    errori: list[ImportErrore]
    candidati: list[CandidatoCreatoAdmin]


class StatisticheGlobali(BaseModel):
    candidati_totali: int
    candidati_attivi: int
    candidati_in_attesa: int
    candidati_a2: int
    candidati_b1: int
    tentativi_totali: int
    esercizi_disponibili: int
    unita_disponibili: int
