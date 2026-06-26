"""Valutazione AI delle produzioni scritte (Claude API).

GDPR: il payload inviato a Claude è ANONIMIZZATO — contiene solo la consegna e
il testo del candidato, mai nome/email/dati identificativi.

Usa il modello configurato (settings.anthropic_model). Se la chiave API non è
impostata, restituisce un esito "non disponibile" senza sollevare eccezioni.
"""
import json
import logging

from ..core.config import get_settings

logger = logging.getLogger("prepesami.ai")
settings = get_settings()

FEEDBACK_SYSTEM = """Sei un esaminatore certificato di italiano come lingua seconda.
Valuta la produzione scritta del candidato al livello {livello} ({ente}).
Sii costruttivo, preciso e usa un tono incoraggiante ma onesto.
Scrivi i contenuti testuali in italiano."""

# Schema della risposta — structured outputs garantiscono JSON valido
FEEDBACK_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "punteggio": {"type": "integer", "description": "Da 0 a 10"},
        "livello_raggiunto": {"type": "string"},
        "punti_di_forza": {"type": "array", "items": {"type": "string"}},
        "errori_principali": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "tipo": {"type": "string"},
                    "esempio": {"type": "string"},
                    "correzione": {"type": "string"},
                },
                "required": ["tipo", "esempio", "correzione"],
            },
        },
        "suggerimenti": {"type": "array", "items": {"type": "string"}},
        "testo_corretto": {"type": "string"},
    },
    "required": [
        "punteggio",
        "livello_raggiunto",
        "punti_di_forza",
        "errori_principali",
        "suggerimenti",
        "testo_corretto",
    ],
}


async def valuta_produzione(
    testo: str, livello: str, ente: str, consegna: str = ""
) -> dict:
    """Valuta un testo. Ritorna un dict con 'disponibile': bool e i campi del feedback."""
    if not settings.anthropic_api_key:
        return {"disponibile": False, "messaggio": "Valutazione AI non ancora configurata."}

    try:
        from anthropic import AsyncAnthropic
    except ImportError:
        return {"disponibile": False, "messaggio": "Libreria AI non installata."}

    client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    system = FEEDBACK_SYSTEM.format(livello=livello or "A2/B1", ente=ente or "CILS")
    # payload anonimizzato: solo consegna + testo
    user = f"Consegna dell'esercizio:\n{consegna}\n\nTesto del candidato:\n{testo}"
    try:
        resp = await client.messages.create(
            model=settings.anthropic_model,
            max_tokens=2000,
            system=system,
            output_config={"format": {"type": "json_schema", "schema": FEEDBACK_SCHEMA}},
            messages=[{"role": "user", "content": user}],
        )
        parts = [b.text for b in resp.content if getattr(b, "type", None) == "text"]
        data = json.loads("".join(parts))
        data["disponibile"] = True
        return data
    except Exception as e:  # errore rete / API / parsing
        logger.warning("Valutazione AI fallita: %s", e)
        return {"disponibile": False, "messaggio": "Valutazione non disponibile al momento."}
