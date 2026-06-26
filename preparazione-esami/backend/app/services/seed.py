"""Caricamento idempotente dei contenuti didattici dai file JSON di seed."""
import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..exercises.schema import SeedFile, validate_exercise
from ..models.contenuti import Esercizio, Unita
from ..models.enums import ExerciseType, Livello

# .../backend/app/services/seed.py -> .../  (repo preparazione-esami)
SEED_DIR = Path(__file__).resolve().parents[3] / "data" / "seed"
SEED_FILES = ["unita_a2.json", "unita_b1.json"]


def carica_seed_file(path: Path) -> SeedFile:
    data = json.loads(path.read_text(encoding="utf-8"))
    seed = SeedFile.model_validate(data)
    # validazione di coerenza contenuto/soluzione per ogni esercizio
    for u in seed.unita:
        for idx, ex in enumerate(u.esercizi):
            validate_exercise(ex.tipo, ex.contenuto, ex.soluzione)
    return seed


async def importa_unita(db: AsyncSession, seed: SeedFile) -> tuple[int, int]:
    """Importa/aggiorna unità ed esercizi. Idempotente per (livello, sezione, numero)."""
    n_unita = n_eser = 0
    for su in seed.unita:
        res = await db.execute(
            select(Unita).where(
                Unita.livello == Livello(su.livello),
                Unita.sezione == su.sezione,
                Unita.numero == su.numero,
            )
        )
        unita = res.scalar_one_or_none()
        if unita is None:
            unita = Unita(
                livello=Livello(su.livello),
                sezione=su.sezione,
                numero=su.numero,
            )
            db.add(unita)
        unita.titolo = su.titolo
        unita.tema = su.tema
        unita.descrizione = su.descrizione
        unita.obiettivi_cefr = su.obiettivi_cefr
        unita.lezione = su.lezione.model_dump()
        unita.lessico = [v.model_dump() for v in su.lessico]
        unita.ordine = su.ordine
        unita.is_published = su.is_published
        await db.flush()
        n_unita += 1

        # rimpiazza gli esercizi dell'unità (re-seed pulito)
        existing = await db.execute(select(Esercizio).where(Esercizio.unita_id == unita.id))
        for e in existing.scalars().all():
            await db.delete(e)
        await db.flush()

        for ordine, ex in enumerate(su.esercizi):
            db.add(
                Esercizio(
                    unita_id=unita.id,
                    tipo=ExerciseType(ex.tipo),
                    abilita=ex.abilita,
                    titolo=ex.titolo,
                    istruzioni=ex.istruzioni,
                    contenuto=ex.contenuto,
                    soluzione=ex.soluzione,
                    audio_url=ex.audio_url,
                    punteggio_max=ex.punteggio_max,
                    tempo_limite_sec=ex.tempo_limite_sec,
                    ordine=ordine,
                )
            )
            n_eser += 1
        await db.flush()
    await db.commit()
    return n_unita, n_eser


async def importa_tutti(db: AsyncSession) -> tuple[int, int]:
    tot_u = tot_e = 0
    for fname in SEED_FILES:
        path = SEED_DIR / fname
        if not path.exists():
            continue
        seed = carica_seed_file(path)
        u, e = await importa_unita(db, seed)
        tot_u += u
        tot_e += e
    return tot_u, tot_e
