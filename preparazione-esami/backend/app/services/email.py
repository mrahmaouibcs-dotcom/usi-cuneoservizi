"""Invio email (attivazione / magic link).

In sviluppo logga soltanto il link. In produzione collegare un provider SMTP
usando le impostazioni smtp_* di Settings.
"""
import logging

from ..core.config import get_settings

logger = logging.getLogger("prepesami.email")
settings = get_settings()


def build_activation_url(token: str) -> str:
    return f"{settings.frontend_base_url}/attiva/{token}"


async def invia_link_attivazione(email: str, token: str) -> None:
    url = build_activation_url(token)
    if not settings.smtp_host:
        logger.info("[DEV] Link di attivazione per %s: %s", email, url)
        return
    # TODO (fase successiva): invio reale via SMTP (aiosmtplib).
    logger.info("Invio link di attivazione a %s", email)
