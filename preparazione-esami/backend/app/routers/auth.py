"""Router di autenticazione."""
import uuid
from datetime import datetime, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.deps import get_current_candidato
from ..core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from ..core.utils import ensure_utc
from ..models.candidato import ActivationToken, Candidato
from ..models.enums import StatoAccount
from ..schemas.auth import (
    ActivationRequest,
    LoginRequest,
    RefreshRequest,
    RefreshResponse,
    TokenResponse,
)
from ..schemas.candidato import CandidatoOut
from ..schemas.common import Message

router = APIRouter(prefix="/auth", tags=["auth"])


def _tokens_for(candidato: Candidato) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(candidato),
        refresh_token=create_refresh_token(candidato),
        candidato=CandidatoOut.model_validate(candidato),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    res = await db.execute(select(Candidato).where(Candidato.email == str(body.email).lower()))
    candidato = res.scalar_one_or_none()
    if (
        candidato is None
        or not candidato.hashed_password
        or not verify_password(body.password, candidato.hashed_password)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Email o password non corretti"
        )
    if candidato.stato_account != StatoAccount.attivo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account non attivo. Completa prima l'attivazione.",
        )
    candidato.last_login = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(candidato)
    return _tokens_for(candidato)


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)) -> RefreshResponse:
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError("tipo token errato")
        cid = uuid.UUID(str(payload.get("sub")))
    except (jwt.PyJWTError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token non valido"
        )
    candidato = await db.get(Candidato, cid)
    if candidato is None or candidato.stato_account != StatoAccount.attivo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token non valido"
        )
    return RefreshResponse(access_token=create_access_token(candidato))


@router.post("/attiva/{token}", response_model=TokenResponse)
async def attiva_account(
    token: str, body: ActivationRequest, db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    at = await db.get(ActivationToken, token)
    if at is None or at.used_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token di attivazione non valido o già usato",
        )
    if ensure_utc(at.expires_at) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Token di attivazione scaduto"
        )
    candidato = await db.get(Candidato, at.candidato_id)
    if candidato is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Candidato inesistente"
        )

    candidato.hashed_password = hash_password(body.password)
    candidato.stato_account = StatoAccount.attivo
    candidato.last_login = datetime.now(timezone.utc)
    at.used_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(candidato)
    return _tokens_for(candidato)


@router.post("/logout", response_model=Message)
async def logout(_: Candidato = Depends(get_current_candidato)) -> Message:
    # Token stateless: il client elimina i token. La revoca server-side
    # (blacklist Redis) sarà aggiunta in una fase successiva.
    return Message(detail="Logout effettuato")
