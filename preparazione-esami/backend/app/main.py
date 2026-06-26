"""Entry point FastAPI."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import get_settings
from .middleware.rate_limiter import RateLimiterMiddleware
from .routers import auth, candidato, percorso, progressi

settings = get_settings()

app = FastAPI(title=settings.app_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimiterMiddleware)

app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(candidato.router, prefix=settings.api_v1_prefix)
app.include_router(percorso.router, prefix=settings.api_v1_prefix)
app.include_router(progressi.router, prefix=settings.api_v1_prefix)


@app.get(settings.api_v1_prefix + "/health", tags=["meta"])
async def health() -> dict[str, str]:
    return {"status": "ok", "app": settings.app_name, "env": settings.environment}
