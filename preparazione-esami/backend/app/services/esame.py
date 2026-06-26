"""Simulazione d'esame: composizione della prova, timer e correzione finale.

La prova è assemblata dal pool di esercizi (già validati) del livello del
candidato, distribuiti per abilità secondo un "blueprint" ispirato al formato
degli enti certificatori (CILS/CELI/PLIDA/IT). Il punteggio è normalizzato su
100 con soglia di superamento a 60.
"""
import random
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.utils import ensure_utc
from ..models.candidato import Candidato
from ..models.contenuti import Esercizio, Unita
from ..models.enums import ExerciseType, Livello
from ..models.esame import SessioneEsame
from .ai_feedback import valuta_produzione
from .scoring import correggi

SOGLIA_SUPERAMENTO = 60  # punteggio minimo su 100

# Tipi valutati dall'AI (produzione)
AI_TIPI = {ExerciseType.WRITE_FREE, ExerciseType.SPEAK_SIM}

# Quante voci per abilità e quanto dura la prova, per livello.
# L'ordine delle sezioni segue la prassi d'esame: ascolto, lettura, strutture,
# produzione scritta, produzione orale.
_SEZIONI_ORDINE = [
    "comprensione_orale",
    "comprensione_scritta",
    "grammatica",
    "lessico",
    "produzione_scritta",
    "produzione_orale",
]
SEZIONE_LABEL = {
    "comprensione_orale": "Ascolto",
    "comprensione_scritta": "Comprensione della lettura",
    "grammatica": "Strutture grammaticali",
    "lessico": "Lessico",
    "produzione_scritta": "Produzione scritta",
    "produzione_orale": "Produzione orale",
}

BLUEPRINT: dict[Livello, dict] = {
    Livello.A2: {
        "durata_sec": 3600,  # 60 minuti
        "conteggi": {
            "comprensione_orale": 2,
            "comprensione_scritta": 2,
            "grammatica": 5,
            "lessico": 2,
            "produzione_scritta": 1,
            "produzione_orale": 1,
        },
    },
    Livello.B1: {
        "durata_sec": 4200,  # 70 minuti
        "conteggi": {
            "comprensione_orale": 2,
            "comprensione_scritta": 2,
            "grammatica": 5,
            "lessico": 2,
            "produzione_scritta": 1,
            "produzione_orale": 1,
        },
    },
}


async def _pool_per_abilita(db: AsyncSession, livello: Livello) -> dict[str, list[Esercizio]]:
    res = await db.execute(
        select(Esercizio)
        .join(Unita, Unita.id == Esercizio.unita_id)
        .where(Unita.livello == livello, Unita.is_published.is_(True))
    )
    pool: dict[str, list[Esercizio]] = {}
    for e in res.scalars().all():
        pool.setdefault(e.abilita, []).append(e)
    return pool


async def componi_prova(db: AsyncSession, livello: Livello) -> tuple[list[uuid.UUID], int]:
    """Seleziona gli esercizi della prova secondo il blueprint del livello.

    Restituisce (lista_ordinata_di_id, durata_sec).
    """
    bp = BLUEPRINT[livello]
    pool = await _pool_per_abilita(db, livello)
    scelti: list[uuid.UUID] = []
    for abilita in _SEZIONI_ORDINE:
        n = bp["conteggi"].get(abilita, 0)
        disponibili = list(pool.get(abilita, []))
        random.shuffle(disponibili)
        for e in disponibili[:n]:
            scelti.append(e.id)
    return scelti, bp["durata_sec"]


def _stato_corrente(sessione: SessioneEsame, adesso: datetime) -> str:
    if sessione.consegnata_at is not None:
        return "consegnata"
    scadenza = ensure_utc(sessione.iniziata_at).timestamp() + sessione.durata_totale_sec
    if adesso.timestamp() > scadenza:
        return "scaduta"
    return "in_corso"


def tempo_rimanente_sec(sessione: SessioneEsame, adesso: datetime | None = None) -> int:
    adesso = adesso or datetime.now(timezone.utc)
    trascorso = adesso.timestamp() - ensure_utc(sessione.iniziata_at).timestamp()
    return max(0, int(sessione.durata_totale_sec - trascorso))


async def sessione_attiva(db: AsyncSession, candidato_id: uuid.UUID) -> SessioneEsame | None:
    """Eventuale sessione ancora in corso (non consegnata e non scaduta)."""
    res = await db.execute(
        select(SessioneEsame)
        .where(
            SessioneEsame.candidato_id == candidato_id,
            SessioneEsame.consegnata_at.is_(None),
        )
        .order_by(SessioneEsame.iniziata_at.desc())
    )
    for s in res.scalars().all():
        if _stato_corrente(s, datetime.now(timezone.utc)) == "in_corso":
            return s
    return None


async def crea_sessione(db: AsyncSession, candidato: Candidato) -> SessioneEsame:
    esistente = await sessione_attiva(db, candidato.id)
    if esistente is not None:
        return esistente
    ids, durata = await componi_prova(db, candidato.livello)
    sessione = SessioneEsame(
        candidato_id=candidato.id,
        livello=candidato.livello,
        ente=candidato.ente_certificatore,
        esercizio_ids=[str(i) for i in ids],
        durata_totale_sec=durata,
        stato="in_corso",
    )
    db.add(sessione)
    await db.commit()
    await db.refresh(sessione)
    return sessione


async def _carica_esercizi(db: AsyncSession, sessione: SessioneEsame) -> list[Esercizio]:
    out = []
    for sid in sessione.esercizio_ids:
        e = await db.get(Esercizio, uuid.UUID(sid))
        if e is not None:
            out.append(e)
    return out


async def consegna(
    db: AsyncSession, sessione: SessioneEsame, risposte: dict[str, dict]
) -> SessioneEsame:
    """Corregge la prova, normalizza su 100 e registra l'esito.

    `risposte` mappa esercizio_id (stringa) -> payload risposta.
    Idempotente: se già consegnata, restituisce la sessione invariata.
    """
    if sessione.consegnata_at is not None:
        return sessione

    esercizi = await _carica_esercizi(db, sessione)
    risposte = risposte or {}

    sezioni: dict[str, dict] = {}
    voci = []
    ottenuto_val = 0      # punti ottenuti sulle voci valutate
    massimo_val = 0       # punti massimi sulle voci valutate
    produzioni_in_attesa = 0

    for e in esercizi:
        risposta = risposte.get(str(e.id)) or {}
        ab = e.abilita
        sez = sezioni.setdefault(ab, {"abilita": ab, "etichetta": SEZIONE_LABEL.get(ab, ab), "ottenuto": 0, "massimo": 0, "valutata": True})
        if e.tipo in AI_TIPI:
            testo = (risposta or {}).get("testo", "")
            fb = None
            if testo:
                fb = await valuta_produzione(
                    testo=testo,
                    livello=sessione.livello.value,
                    ente=sessione.ente.value if sessione.ente else "",
                    consegna=(e.contenuto or {}).get("prompt", ""),
                )
            if fb and fb.get("disponibile"):
                punti = round(int(fb.get("punteggio", 0)) / 10 * e.punteggio_max)
                ottenuto_val += punti
                massimo_val += e.punteggio_max
                sez["ottenuto"] += punti
                sez["massimo"] += e.punteggio_max
                voci.append({"esercizio_id": str(e.id), "abilita": ab, "tipo": e.tipo.value, "punteggio": punti, "punteggio_max": e.punteggio_max, "in_attesa": False})
            else:
                # AI non disponibile: la produzione richiede valutazione manuale
                produzioni_in_attesa += 1
                sez["valutata"] = False
                voci.append({"esercizio_id": str(e.id), "abilita": ab, "tipo": e.tipo.value, "punteggio": None, "punteggio_max": e.punteggio_max, "in_attesa": True})
        else:
            r = correggi(e.tipo, e.contenuto, e.soluzione, risposta, e.punteggio_max)
            ottenuto_val += r.punteggio
            massimo_val += e.punteggio_max
            sez["ottenuto"] += r.punteggio
            sez["massimo"] += e.punteggio_max
            voci.append({"esercizio_id": str(e.id), "abilita": ab, "tipo": e.tipo.value, "punteggio": r.punteggio, "punteggio_max": e.punteggio_max, "in_attesa": False})

    punteggio_100 = round(ottenuto_val / massimo_val * 100) if massimo_val else 0
    if produzioni_in_attesa:
        esito = "in_attesa_valutazione"
    else:
        esito = "superato" if punteggio_100 >= SOGLIA_SUPERAMENTO else "non_superato"

    adesso = datetime.now(timezone.utc)
    sessione.consegnata_at = adesso
    sessione.stato = "consegnata"
    sessione.punteggio = punteggio_100
    sessione.esito = esito
    sessione.risposte = risposte
    sessione.dettaglio = {
        "punteggio": punteggio_100,
        "soglia": SOGLIA_SUPERAMENTO,
        "ottenuto": ottenuto_val,
        "massimo": massimo_val,
        "produzioni_in_attesa": produzioni_in_attesa,
        "sezioni": [
            sezioni[a] for a in _SEZIONI_ORDINE if a in sezioni
        ],
        "voci": voci,
    }
    await db.commit()
    await db.refresh(sessione)
    return sessione
