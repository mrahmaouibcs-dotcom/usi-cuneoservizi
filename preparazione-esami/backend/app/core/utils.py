"""Utility varie."""
from datetime import datetime, timezone


def ensure_utc(dt: datetime) -> datetime:
    """Garantisce un datetime timezone-aware in UTC.

    SQLite restituisce datetime naive: li interpretiamo come UTC per poterli
    confrontare con datetime.now(timezone.utc).
    """
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)
