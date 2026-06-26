"""Entry point FastAPI."""
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .core.config import get_settings
from .middleware.rate_limiter import RateLimiterMiddleware
from .routers import admin, auth, candidato, percorso, progressi

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
app.include_router(admin.router, prefix=settings.api_v1_prefix)


@app.get(settings.api_v1_prefix + "/health", tags=["meta"])
async def health() -> dict[str, str]:
    return {"status": "ok", "app": settings.app_name, "env": settings.environment}


# PWA candidato servita da FastAPI (un solo server). Montata per ultima: le
# rotte API registrate sopra hanno la precedenza sul catch-all statico.
_frontend = Path(settings.frontend_dir) if settings.frontend_dir else Path(__file__).resolve().parents[2] / "frontend"
if _frontend.is_dir():
    app.mount("/", StaticFiles(directory=str(_frontend), html=True), name="frontend")
