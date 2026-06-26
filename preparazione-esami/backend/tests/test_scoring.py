"""Test del motore di scoring: punteggio pieno, parziale ed edge case."""
from app.models.enums import ExerciseType
from app.services.scoring import correggi


def test_mcq_giusto_e_sbagliato():
    c = {"domanda": "?", "opzioni": ["a", "b", "c"]}
    s = {"corretta": 1}
    assert correggi(ExerciseType.MCQ, c, s, {"scelta": 1}, 10).punteggio == 10
    assert correggi(ExerciseType.MCQ, c, s, {"scelta": 0}, 10).punteggio == 0


def test_true_false_parziale():
    c = {"affermazioni": ["a", "b", "c", "d"]}
    s = {"risposte": ["vero", "falso", "non_detto", "vero"]}
    r = correggi(ExerciseType.TRUE_FALSE, c, s, {"risposte": ["vero", "falso", "vero", "vero"]}, 10)
    assert r.punteggio == 8  # 3/4 corrette
    assert r.corretto is False


def test_fill_normalizza_maiuscole_spazi():
    c = {"testo_template": "{0}", "lacune": [{"opzioni": ["Casa"]}]}
    s = {"risposte": ["Casa"]}
    assert correggi(ExerciseType.FILL, c, s, {"risposte": ["  casa "]}, 10).punteggio == 10


def test_reorder_ignora_punteggiatura():
    c = {"parole": ["Io", "sto", "bene"]}
    s = {"frase": "Io sto bene"}
    assert correggi(ExerciseType.REORDER, c, s, {"frase": "io sto bene."}, 10).punteggio == 10
    assert correggi(ExerciseType.REORDER, c, s, {"ordine": ["Io", "sto", "bene"]}, 10).punteggio == 10
    assert correggi(ExerciseType.REORDER, c, s, {"frase": "bene sto io"}, 10).punteggio == 0


def test_match_parziale():
    c = {"colonna_a": ["x", "y"], "colonna_b": ["1", "2"]}
    s = {"mappa": {"0": 0, "1": 1}}
    assert correggi(ExerciseType.MATCH, c, s, {"mappa": {"0": 0, "1": 1}}, 10).punteggio == 10
    assert correggi(ExerciseType.MATCH, c, s, {"mappa": {"0": 0, "1": 0}}, 10).punteggio == 5


def test_error_find_penalizza_falsi_positivi():
    c = {"parole": ["a", "b", "c", "d"]}
    s = {"indici_errati": [1]}
    assert correggi(ExerciseType.ERROR_FIND, c, s, {"indici": [1]}, 10).punteggio == 10
    # un corretto + un falso positivo -> 0
    assert correggi(ExerciseType.ERROR_FIND, c, s, {"indici": [1, 2]}, 10).punteggio == 0


def test_write_free_richiede_valutazione_ai():
    c = {"prompt": "...", "parole_min": 60, "parole_max": 80}
    r = correggi(ExerciseType.WRITE_FREE, c, {}, {"testo": "..."}, 20)
    assert r.corretto is None
