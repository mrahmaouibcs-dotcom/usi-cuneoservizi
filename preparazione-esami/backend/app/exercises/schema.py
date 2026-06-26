"""Schemi di validazione per i contenuti degli esercizi.

Ogni tipo di esercizio ha:
  - `contenuto`  : ciò che vede il candidato (SENZA risposte)
  - `soluzione`  : le risposte corrette (mai inviate al client)

Questo modulo valida la coerenza interna di contenuto+soluzione e sa costruire
la "risposta corretta" a partire dalla soluzione (usata dai test e dal seed).
"""
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator

from ..models.enums import ExerciseType

# Tipi corretti automaticamente dal motore di scoring
AUTO_SCORED = {
    ExerciseType.MCQ,
    ExerciseType.TRUE_FALSE,
    ExerciseType.FILL,
    ExerciseType.REORDER,
    ExerciseType.MATCH,
    ExerciseType.ERROR_FIND,
}
# Tipi valutati dall'AI (fase 5) o che richiedono audio/registrazione
AI_OR_MEDIA = {
    ExerciseType.WRITE_FREE,
    ExerciseType.SPEAK_SIM,
    ExerciseType.DICTATION,
    ExerciseType.AUDIO_MCQ,
}


# --------------------------------------------------------------------------- #
#  Modelli contenuto / soluzione per tipo
# --------------------------------------------------------------------------- #
class MCQContenuto(BaseModel):
    domanda: str
    opzioni: list[str] = Field(min_length=2, max_length=6)


class MCQSoluzione(BaseModel):
    corretta: int


class TFContenuto(BaseModel):
    testo: str | None = None
    affermazioni: list[str] = Field(min_length=1)


class TFSoluzione(BaseModel):
    risposte: list[Literal["vero", "falso", "non_detto"]] = Field(min_length=1)


class Lacuna(BaseModel):
    # se 'opzioni' è valorizzato → menu a tendina; altrimenti testo libero
    opzioni: list[str] = Field(default_factory=list)


class FillContenuto(BaseModel):
    testo_template: str  # usa {0}, {1}, ... come segnaposto delle lacune
    lacune: list[Lacuna] = Field(min_length=1)


class FillSoluzione(BaseModel):
    risposte: list[str] = Field(min_length=1)


class ReorderContenuto(BaseModel):
    parole: list[str] = Field(min_length=2)


class ReorderSoluzione(BaseModel):
    frase: str
    # eventuali ordini alternativi ugualmente corretti (equità di correzione)
    accettate: list[str] = Field(default_factory=list)


class MatchContenuto(BaseModel):
    colonna_a: list[str] = Field(min_length=1)
    colonna_b: list[str] = Field(min_length=1)


class MatchSoluzione(BaseModel):
    # chiave = indice colonna_a (stringa), valore = indice colonna_b
    mappa: dict[str, int]


class WriteFreeContenuto(BaseModel):
    prompt: str
    parole_min: int = 0
    parole_max: int = 0


class WriteFreeSoluzione(BaseModel):
    criteri: list[str] = Field(default_factory=list)  # spunti per la valutazione AI


class ErrorFindContenuto(BaseModel):
    parole: list[str] = Field(min_length=2)  # frase tokenizzata
    frase: str | None = None


class ErrorFindSoluzione(BaseModel):
    indici_errati: list[int] = Field(min_length=1)
    correzioni: dict[str, str] = Field(default_factory=dict)


_CONTENT_MODELS: dict[ExerciseType, type[BaseModel]] = {
    ExerciseType.MCQ: MCQContenuto,
    ExerciseType.TRUE_FALSE: TFContenuto,
    ExerciseType.FILL: FillContenuto,
    ExerciseType.REORDER: ReorderContenuto,
    ExerciseType.MATCH: MatchContenuto,
    ExerciseType.WRITE_FREE: WriteFreeContenuto,
    ExerciseType.ERROR_FIND: ErrorFindContenuto,
}
_SOLUTION_MODELS: dict[ExerciseType, type[BaseModel]] = {
    ExerciseType.MCQ: MCQSoluzione,
    ExerciseType.TRUE_FALSE: TFSoluzione,
    ExerciseType.FILL: FillSoluzione,
    ExerciseType.REORDER: ReorderSoluzione,
    ExerciseType.MATCH: MatchSoluzione,
    ExerciseType.WRITE_FREE: WriteFreeSoluzione,
    ExerciseType.ERROR_FIND: ErrorFindSoluzione,
}


class ValidationError(Exception):
    pass


def validate_exercise(tipo: ExerciseType, contenuto: dict, soluzione: dict) -> None:
    """Valida contenuto+soluzione e la loro coerenza incrociata.

    Solleva ValidationError con un messaggio chiaro in caso di problemi.
    """
    if tipo not in _CONTENT_MODELS:
        # tipi solo-AI/media non hanno (ancora) uno schema seedabile qui
        raise ValidationError(f"Tipo non supportato dal validatore seed: {tipo}")

    try:
        c = _CONTENT_MODELS[tipo].model_validate(contenuto)
        s = _SOLUTION_MODELS[tipo].model_validate(soluzione)
    except Exception as e:  # pydantic ValidationError
        raise ValidationError(f"[{tipo.value}] struttura non valida: {e}") from e

    # coerenza incrociata
    if tipo == ExerciseType.MCQ:
        if not (0 <= s.corretta < len(c.opzioni)):
            raise ValidationError("[MCQ] indice 'corretta' fuori range")
    elif tipo == ExerciseType.TRUE_FALSE:
        if len(s.risposte) != len(c.affermazioni):
            raise ValidationError("[TRUE_FALSE] numero risposte ≠ numero affermazioni")
    elif tipo == ExerciseType.FILL:
        if len(s.risposte) != len(c.lacune):
            raise ValidationError("[FILL] numero risposte ≠ numero lacune")
        for i, lac in enumerate(c.lacune):
            if lac.opzioni and s.risposte[i] not in lac.opzioni:
                raise ValidationError(f"[FILL] risposta lacuna {i} non tra le opzioni")
    elif tipo == ExerciseType.MATCH:
        n_a, n_b = len(c.colonna_a), len(c.colonna_b)
        for k, v in s.mappa.items():
            if not k.isdigit() or not (0 <= int(k) < n_a):
                raise ValidationError(f"[MATCH] chiave '{k}' non valida")
            if not (0 <= v < n_b):
                raise ValidationError(f"[MATCH] valore {v} fuori range colonna_b")
    elif tipo == ExerciseType.ERROR_FIND:
        for idx in s.indici_errati:
            if not (0 <= idx < len(c.parole)):
                raise ValidationError(f"[ERROR_FIND] indice {idx} fuori range")


def build_correct_answer(tipo: ExerciseType, soluzione: dict) -> dict | None:
    """Costruisce la risposta 'perfetta' a partire dalla soluzione.

    Restituisce None per i tipi non auto-correggibili (valutazione AI).
    """
    if tipo == ExerciseType.MCQ:
        return {"scelta": soluzione["corretta"]}
    if tipo == ExerciseType.TRUE_FALSE:
        return {"risposte": soluzione["risposte"]}
    if tipo == ExerciseType.FILL:
        return {"risposte": soluzione["risposte"]}
    if tipo == ExerciseType.REORDER:
        return {"frase": soluzione["frase"]}
    if tipo == ExerciseType.MATCH:
        return {"mappa": soluzione["mappa"]}
    if tipo == ExerciseType.ERROR_FIND:
        return {"indici": soluzione["indici_errati"]}
    return None


# --------------------------------------------------------------------------- #
#  Modelli del file di seed
# --------------------------------------------------------------------------- #
ABILITA_VALIDE = {
    "grammatica",
    "lessico",
    "comprensione_scritta",
    "comprensione_orale",
    "produzione_scritta",
    "produzione_orale",
}


class SeedEsercizio(BaseModel):
    tipo: ExerciseType
    abilita: str = "grammatica"
    titolo: str
    istruzioni: str = ""
    contenuto: dict[str, Any]
    soluzione: dict[str, Any] = Field(default_factory=dict)
    audio_url: str | None = None
    punteggio_max: int = 10
    tempo_limite_sec: int | None = None


class SeedSezioneLezione(BaseModel):
    titolo: str
    testo: str = ""
    tabella: dict[str, Any] | None = None  # { headers: [...], rows: [[...]] }
    esempi: list[str] = Field(default_factory=list)


class SeedLezione(BaseModel):
    introduzione: str = ""
    sezioni: list[SeedSezioneLezione] = Field(default_factory=list)


class SeedVocabolo(BaseModel):
    parola: str
    traduzione: str = ""
    esempio: str = ""


class SeedUnita(BaseModel):
    livello: Literal["A2", "B1"]
    sezione: str
    numero: int
    titolo: str
    tema: str = ""
    descrizione: str = ""
    obiettivi_cefr: list[str] = Field(default_factory=list)
    lezione: SeedLezione = Field(default_factory=SeedLezione)
    lessico: list[SeedVocabolo] = Field(default_factory=list)
    ordine: int = 0
    is_published: bool = True
    esercizi: list[SeedEsercizio] = Field(min_length=1)


class SeedFile(BaseModel):
    unita: list[SeedUnita] = Field(min_length=1)
