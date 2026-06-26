"""Schemi Pydantic per il candidato."""
import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from ..models.enums import Ente, Livello, Ruolo, StatoAccount


class CandidatoOut(BaseModel):
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
    created_at: datetime
    last_login: datetime | None


class CandidatoCreate(BaseModel):
    """Pre-registrazione candidato (lato admin)."""
    email: EmailStr
    nome: str
    cognome: str
    livello: Livello
    ente_certificatore: Ente
    data_esame: date | None = None
    ruolo: Ruolo = Ruolo.candidato


class CandidatoCreated(BaseModel):
    """Risposta alla creazione: include il link/token di attivazione (dev)."""
    candidato: CandidatoOut
    activation_token: str
    activation_url: str
