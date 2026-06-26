"""Inizializza il database: crea le tabelle, carica i contenuti, crea l'admin.

Idempotente: si può rieseguire senza problemi.
Uso:
    ADMIN_EMAIL=admin@scuola.it ADMIN_PASSWORD=segreta123 python -m scripts.init_db
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select  # noqa: E402

from app.core.database import AsyncSessionLocal, engine  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.models import Base  # noqa: E402
from app.models.candidato import Candidato  # noqa: E402
from app.models.enums import Ruolo, StatoAccount  # noqa: E402
from app.services.seed import importa_tutti  # noqa: E402


async def main() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        u, e = await importa_tutti(db)
        print(f"Contenuti: {u} unità, {e} esercizi.")

        email = (os.environ.get("ADMIN_EMAIL") or "").strip().lower()
        password = os.environ.get("ADMIN_PASSWORD") or ""
        if email and password:
            res = await db.execute(select(Candidato).where(Candidato.email == email))
            admin = res.scalar_one_or_none()
            if admin is None:
                admin = Candidato(email=email, nome="Amministratore", cognome="")
                db.add(admin)
            admin.ruolo = Ruolo.admin
            admin.stato_account = StatoAccount.attivo
            admin.hashed_password = hash_password(password)
            await db.commit()
            print(f"Admin pronto: {email}")
        else:
            print("ADMIN_EMAIL/ADMIN_PASSWORD non impostati: admin non creato.")
    print("Init completato.")


if __name__ == "__main__":
    asyncio.run(main())
