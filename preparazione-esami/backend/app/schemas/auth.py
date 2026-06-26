"""Schemi Pydantic per l'autenticazione."""
from pydantic import BaseModel, EmailStr, Field

from .candidato import CandidatoOut


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    candidato: CandidatoOut


class RefreshRequest(BaseModel):
    refresh_token: str


class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ActivationRequest(BaseModel):
    password: str = Field(min_length=8, description="Almeno 8 caratteri")
