"""Sicurezza: hashing password, JWT (access/refresh), token di attivazione."""
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from passlib.context import CryptContext

from .config import get_settings

settings = get_settings()

# pbkdf2_sha256: puro Python, nessuna dipendenza nativa. In produzione si può
# passare ad argon2/bcrypt aggiungendo lo schema e la relativa libreria.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)


def _create_token(
    subject: uuid.UUID, claims: dict[str, Any], expires_delta: timedelta, token_type: str
) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        **claims,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_access_token(candidato) -> str:
    """Access token: livello e ruolo sono 'congelati' nel JWT al login."""
    livello = candidato.livello.value if candidato.livello is not None else None
    ruolo = candidato.ruolo.value if candidato.ruolo is not None else None
    return _create_token(
        candidato.id,
        {"email": candidato.email, "ruolo": ruolo, "livello": livello},
        timedelta(minutes=settings.access_token_expire_minutes),
        "access",
    )


def create_refresh_token(candidato) -> str:
    return _create_token(
        candidato.id, {}, timedelta(days=settings.refresh_token_expire_days), "refresh"
    )


def decode_token(token: str) -> dict[str, Any]:
    """Decodifica e valida (firma + scadenza). Solleva jwt.PyJWTError se invalido."""
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])


def generate_activation_token() -> str:
    return secrets.token_urlsafe(32)
