"""Rate limiting per IP (sliding window in memoria).

Implementazione semplice e senza dipendenze per la Fase 1.
Nelle fasi successive si potrà sostituire con un backend Redis condiviso e
aggiungere il limite per-utente (200 req/min).
"""
import time
from collections import defaultdict, deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from ..core.config import get_settings

settings = get_settings()
_WINDOW = 60.0  # secondi


class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._hits: dict[str, deque] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        ip = request.client.host if request.client else "unknown"
        now = time.monotonic()
        bucket = self._hits[ip]
        while bucket and bucket[0] <= now - _WINDOW:
            bucket.popleft()
        if len(bucket) >= settings.rate_limit_ip_per_min:
            return JSONResponse(
                {"detail": "Troppe richieste, riprova tra poco."}, status_code=429
            )
        bucket.append(now)
        return await call_next(request)
