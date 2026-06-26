"""Validazione dei contenuti di seed + coerenza con il motore di scoring."""
from pathlib import Path

import pytest

from app.exercises.schema import AUTO_SCORED, SeedFile, build_correct_answer, validate_exercise
from app.models.enums import ExerciseType
from app.services.scoring import correggi
from app.services.seed import SEED_DIR, importa_tutti

SEED_FILES = ["unita_a2.json", "unita_b1.json"]


def _carica_unita():
    import json

    unita = []
    for fname in SEED_FILES:
        data = json.loads((SEED_DIR / fname).read_text(encoding="utf-8"))
        unita.extend(SeedFile.model_validate(data).unita)
    return unita


def test_file_seed_presenti():
    for fname in SEED_FILES:
        assert (SEED_DIR / fname).exists(), f"manca {fname}"


def test_requisiti_quantitativi():
    unita = _carica_unita()
    a2 = [u for u in unita if u.livello == "A2"]
    b1 = [u for u in unita if u.livello == "B1"]
    assert len(a2) >= 3, "servono almeno 3 unità A2"
    assert len(b1) >= 3, "servono almeno 3 unità B1"
    for u in unita:
        assert len(u.esercizi) >= 5, f"unità '{u.titolo}': servono ≥5 esercizi"
        tipi = {e.tipo for e in u.esercizi}
        assert len(tipi) >= 3, f"unità '{u.titolo}': servono ≥3 tipi diversi"


def test_struttura_esercizi_valida():
    unita = _carica_unita()
    for u in unita:
        for ex in u.esercizi:
            validate_exercise(ex.tipo, ex.contenuto, ex.soluzione)


def test_le_soluzioni_ottengono_punteggio_pieno():
    """Garanzia forte: la risposta 'corretta' costruita dalla soluzione deve
    ottenere il punteggio massimo dal motore di scoring."""
    unita = _carica_unita()
    controllati = 0
    for u in unita:
        for ex in u.esercizi:
            if ex.tipo not in AUTO_SCORED:
                continue
            risposta = build_correct_answer(ex.tipo, ex.soluzione)
            assert risposta is not None
            ris = correggi(ex.tipo, ex.contenuto, ex.soluzione, risposta, ex.punteggio_max)
            assert ris.punteggio == ex.punteggio_max, (
                f"'{u.titolo}' / '{ex.titolo}' ({ex.tipo.value}): "
                f"atteso {ex.punteggio_max}, ottenuto {ris.punteggio}"
            )
            assert ris.corretto is True
            controllati += 1
    assert controllati >= 25, f"controllati solo {controllati} esercizi auto-correggibili"


def test_risposta_sbagliata_non_fa_punteggio_pieno():
    """Una risposta palesemente errata non deve ottenere il massimo."""
    unita = _carica_unita()
    for u in unita:
        for ex in u.esercizi:
            if ex.tipo == ExerciseType.MCQ:
                corretta = ex.soluzione["corretta"]
                sbagliata = (corretta + 1) % len(ex.contenuto["opzioni"])
                ris = correggi(ex.tipo, ex.contenuto, ex.soluzione, {"scelta": sbagliata}, ex.punteggio_max)
                assert ris.punteggio < ex.punteggio_max
                return


@pytest.mark.asyncio
async def test_import_nel_db(session_factory):
    """L'import nel DB è idempotente e crea unità ed esercizi."""
    async with session_factory() as db:
        u1, e1 = await importa_tutti(db)
    assert u1 >= 6
    assert e1 >= 30
    # secondo import: stessi numeri (idempotente, nessun duplicato)
    async with session_factory() as db:
        u2, e2 = await importa_tutti(db)
    assert (u2, e2) == (u1, e1)

    from sqlalchemy import func, select

    from app.models.contenuti import Esercizio, Unita

    async with session_factory() as db:
        tot_u = (await db.execute(select(func.count()).select_from(Unita))).scalar()
        tot_e = (await db.execute(select(func.count()).select_from(Esercizio))).scalar()
    assert tot_u == u1
    assert tot_e == e1
