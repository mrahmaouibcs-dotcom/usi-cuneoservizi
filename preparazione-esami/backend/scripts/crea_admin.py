"""CLI: crea (o aggiorna) un account amministratore.

Uso:
    ADMIN_EMAIL=admin@scuola.it ADMIN_PASSWORD=segreta123 python -m scripts.crea_admin
oppure:
    python scripts/crea_admin.py admin@scuola.it segreta123
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select  # noqa: E402

from app.core.database import AsyncSessionLocal  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.models.candidato import Candidato  # noqa: E402
from app.models.enums import Ruolo, StatoAccount  # noqa: E402


async def main(email: str, password: str) -> None:
    email = email.strip().lower()
    async with AsyncSessionLocal() as db:
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


if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("ADMIN_EMAIL", "")
    password = sys.argv[2] if len(sys.argv) > 2 else os.environ.get("ADMIN_PASSWORD", "")
    if not email or not password:
        print("Servono email e password (argomenti o ADMIN_EMAIL/ADMIN_PASSWORD).")
        sys.exit(1)
    asyncio.run(main(email, password))
