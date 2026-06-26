"""Configurazione centralizzata (Pydantic Settings v2).

Tutti i valori sono sovrascrivibili tramite variabili d'ambiente o file .env.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # --- App ---
    app_name: str = "Preparazione Esami Italiano A2/B1"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"

    # --- Sicurezza / JWT ---
    secret_key: str = "CAMBIAMI-in-produzione-con-una-chiave-lunga-e-casuale"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60        # 1 ora (criterio di accettazione)
    refresh_token_expire_days: int = 7           # 7 giorni
    activation_token_expire_hours: int = 72      # link attivazione valido 72h

    # --- Database ---
    # In sviluppo/Docker: PostgreSQL. Per i test viene sovrascritto con SQLite.
    database_url: str = (
        "postgresql+asyncpg://prepesami:prepesami@localhost:5432/prepesami"
    )

    # --- Redis (sessioni / rate-limit) ---
    redis_url: str = "redis://localhost:6379/0"

    # --- Rate limiting ---
    rate_limit_ip_per_min: int = 60
    rate_limit_user_per_min: int = 200

    # --- LLM (Claude API) — usato nelle fasi successive ---
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-6"

    # --- Email (attivazione / magic link) ---
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = "no-reply@preparazione-esami.it"

    # --- Storage S3 (audio esercizi) ---
    s3_endpoint_url: str = ""
    s3_bucket: str = "prepesami-audio"
    s3_access_key: str = ""
    s3_secret_key: str = ""

    # --- Frontend ---
    frontend_base_url: str = "http://localhost:3000"

    # --- CORS (lista separata da virgole per evitare il parsing JSON in env) ---
    cors_origins: str = "http://localhost:3000,http://localhost:8000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
