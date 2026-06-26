"""Fixture di test: app su database SQLite in memoria (StaticPool)."""
import os

# Deve avvenire PRIMA di importare i moduli dell'app: l'engine viene creato
# a import-time e altrimenti tenterebbe di usare il driver PostgreSQL.
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite://")
# limite di rate alto nei test: la suite condivide IP e finestra di 60s
os.environ.setdefault("RATE_LIMIT_IP_PER_MIN", "100000")

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.database import get_db
from app.main import app
from app.models import Base


@pytest_asyncio.fixture
async def db_engine():
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
def session_factory(db_engine):
    return async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture
async def client(db_engine, session_factory):
    async def _override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
