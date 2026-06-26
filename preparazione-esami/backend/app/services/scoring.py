"""Motore di correzione deterministico per gli esercizi auto-valutabili."""
from dataclasses import dataclass
from typing import Any

from ..models.enums import ExerciseType


@dataclass
class Risultato:
    punteggio: int
    punteggio_max: int
    corretto: bool | None  # None = richiede valutazione AI
    dettaglio: dict[str, Any]


def _norm(s: Any) -> str:
    return str(s).strip().lower().replace("’", "'")


def _norm_frase(s: Any) -> str:
    import re

    t = _norm(s)
    t = re.sub(r"[.?!,;:]", "", t)
    return re.sub(r"\s+", " ", t).strip()


def _quota(corrette: int, totali: int, punteggio_max: int) -> int:
    if totali <= 0:
        return 0
    return round(punteggio_max * corrette / totali)


def correggi(
    tipo: ExerciseType, contenuto: dict, soluzione: dict, risposta: dict, punteggio_max: int
) -> Risultato:
    """Corregge una risposta. `risposta` è il payload inviato dal candidato."""
    risposta = risposta or {}

    if tipo == ExerciseType.MCQ:
        scelta = risposta.get("scelta")
        ok = scelta == soluzione.get("corretta")
        return Risultato(punteggio_max if ok else 0, punteggio_max, ok, {"attesa": soluzione.get("corretta")})

    if tipo == ExerciseType.TRUE_FALSE:
        attese = soluzione.get("risposte", [])
        date = risposta.get("risposte", []) or []
        corrette = sum(
            1 for i, a in enumerate(attese) if i < len(date) and _norm(date[i]) == _norm(a)
        )
        p = _quota(corrette, len(attese), punteggio_max)
        return Risultato(p, punteggio_max, corrette == len(attese), {"corrette": corrette, "totali": len(attese)})

    if tipo == ExerciseType.FILL:
        attese = soluzione.get("risposte", [])
        date = risposta.get("risposte", []) or []
        corrette = sum(
            1 for i, a in enumerate(attese) if i < len(date) and _norm(date[i]) == _norm(a)
        )
        p = _quota(corrette, len(attese), punteggio_max)
        return Risultato(p, punteggio_max, corrette == len(attese), {"corrette": corrette, "totali": len(attese)})

    if tipo == ExerciseType.REORDER:
        attesa = soluzione.get("frase", "")
        accettate = [attesa, *soluzione.get("accettate", [])]
        data = risposta.get("frase")
        if data is None and isinstance(risposta.get("ordine"), list):
            data = " ".join(risposta["ordine"])
        norm = _norm_frase(data or "")
        ok = any(norm == _norm_frase(a) for a in accettate)
        return Risultato(punteggio_max if ok else 0, punteggio_max, ok, {"attesa": attesa})

    if tipo == ExerciseType.MATCH:
        attesa = soluzione.get("mappa", {})
        data = risposta.get("mappa", {}) or {}
        corrette = sum(1 for k, v in attesa.items() if str(data.get(k, data.get(str(k)))) == str(v))
        p = _quota(corrette, len(attesa), punteggio_max)
        return Risultato(p, punteggio_max, corrette == len(attesa), {"corrette": corrette, "totali": len(attesa)})

    if tipo == ExerciseType.ERROR_FIND:
        attesi = set(soluzione.get("indici_errati", []))
        dati = set(risposta.get("indici", []) or [])
        tp = len(attesi & dati)
        fp = len(dati - attesi)
        grezzo = max(0, tp - fp)
        p = _quota(grezzo, len(attesi), punteggio_max)
        return Risultato(p, punteggio_max, dati == attesi, {"attesi": sorted(attesi), "trovati": sorted(dati)})

    # Tipi valutati dall'AI o tramite media: nessuna correzione automatica
    return Risultato(0, punteggio_max, None, {"valutazione": "ai_o_media_richiesta"})
