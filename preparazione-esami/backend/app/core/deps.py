"""Dependency di autenticazione e autorizzazione."""
import uuid

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.candidato import Candidato
from ..models.enums import Ruolo, StatoAccount
from .database import get_db
from .security import decode_token

bearer_scheme = HTTPBearer(auto_error=True)

_CRED_EXC = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Credenziali non valide",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_candidato(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Candidato:
    try:
        payload = decode_token(creds.credentials)
        if payload.get("type") != "access":
            raise _CRED_EXC
        sub = payload.get("sub")
        cid = uuid.UUID(str(sub))
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token scaduto",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.PyJWTError, ValueError, TypeError):
        raise _CRED_EXC

    candidato = await db.get(Candidato, cid)
    if candidato is None:
        raise _CRED_EXC
    if candidato.stato_account != StatoAccount.attivo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account non attivo")
    return candidato


def require_roles(*roles: Ruolo):
    """Dependency factory: limita l'accesso ai ruoli indicati."""
    async def checker(candidato: Candidato = Depends(get_current_candidato)) -> Candidato:
        if candidato.ruolo not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Permessi insufficienti"
            )
        return candidato

    return checker
