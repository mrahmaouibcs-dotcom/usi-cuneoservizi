"""Logica applicativa per la gestione dei candidati."""
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import get_settings
from ..core.security import generate_activation_token
from ..models.candidato import ActivationToken, Candidato
from ..models.enums import StatoAccount
from ..schemas.candidato import CandidatoCreate

settings = get_settings()


async def crea_candidato(
    db: AsyncSession, dati: CandidatoCreate
) -> tuple[Candidato, ActivationToken]:
    """Pre-registra un candidato (stato in_attesa) e genera il token di attivazione.

    Non esegue commit: lascia la transazione al chiamante.
    """
    candidato = Candidato(
        email=str(dati.email).lower(),
        nome=dati.nome,
        cognome=dati.cognome,
        ruolo=dati.ruolo,
        livello=dati.livello,
        ente_certificatore=dati.ente_certificatore,
        data_esame=dati.data_esame,
        stato_account=StatoAccount.in_attesa,
    )
    db.add(candidato)
    await db.flush()

    token = ActivationToken(
        token=generate_activation_token(),
        candidato_id=candidato.id,
        expires_at=datetime.now(timezone.utc)
        + timedelta(hours=settings.activation_token_expire_hours),
    )
    db.add(token)
    await db.flush()
    return candidato, token
