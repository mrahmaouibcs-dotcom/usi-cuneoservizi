"""CLI: carica i contenuti di seed nel database.

Uso:
    python -m scripts.seed_db
oppure:
    python scripts/seed_db.py
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal  # noqa: E402
from app.services.seed import importa_tutti  # noqa: E402


async def main() -> None:
    async with AsyncSessionLocal() as db:
        u, e = await importa_tutti(db)
    print(f"Seed completato: {u} unità, {e} esercizi importati.")


if __name__ == "__main__":
    asyncio.run(main())
