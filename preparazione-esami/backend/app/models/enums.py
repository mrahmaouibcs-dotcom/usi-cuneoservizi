"""Enumerazioni del dominio."""
import enum


class Livello(str, enum.Enum):
    A2 = "A2"
    B1 = "B1"


class Ente(str, enum.Enum):
    CILS = "CILS"     # Università per Stranieri di Siena
    CELI = "CELI"     # Università per Stranieri di Perugia
    PLIDA = "PLIDA"   # Società Dante Alighieri
    IT = "IT"         # Università Roma Tre


class Ruolo(str, enum.Enum):
    candidato = "candidato"
    tutor = "tutor"
    admin = "admin"


class StatoAccount(str, enum.Enum):
    in_attesa = "in_attesa"
    attivo = "attivo"
    sospeso = "sospeso"


class Abilita(str, enum.Enum):
    grammatica = "grammatica"
    lessico = "lessico"
    comprensione_scritta = "comprensione_scritta"
    comprensione_orale = "comprensione_orale"
    produzione_scritta = "produzione_scritta"
    produzione_orale = "produzione_orale"


class ExerciseType(str, enum.Enum):
    MCQ = "MCQ"                 # Scelta multipla
    FILL = "FILL"              # Cloze / riempimento lacune
    MATCH = "MATCH"            # Abbinamento
    REORDER = "REORDER"        # Riordino
    DICTATION = "DICTATION"    # Dettato
    AUDIO_MCQ = "AUDIO_MCQ"    # Ascolto + scelta multipla
    WRITE_FREE = "WRITE_FREE"  # Scrittura libera (valutata da Claude)
    SPEAK_SIM = "SPEAK_SIM"    # Simulazione orale (valutata da Claude)
    TRUE_FALSE = "TRUE_FALSE"  # Vero / Falso / Non detto
    ERROR_FIND = "ERROR_FIND"  # Trova l'errore
