"""Registrazione tentativi, aggiornamento progresso e statistiche."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.utils import ensure_utc
from ..models.candidato import Candidato
from ..models.contenuti import Esercizio, Unita
from ..models.enums import ExerciseType
from ..models.progresso import ProgressoCandidato, TentativoEsercizio
from ..schemas.tentativo import RisultatoOut
from .ai_feedback import valuta_produzione
from .scoring import correggi

# Tipi valutati dall'AI (testo libero)
AI_TIPI = {ExerciseType.WRITE_FREE, ExerciseType.SPEAK_SIM}


async def _miglior_punteggio_per_esercizio(
    db: AsyncSession, candidato_id: uuid.UUID, unita_id: uuid.UUID
) -> dict[uuid.UUID, int]:
    """Per ogni esercizio dell'unità tentato dal candidato, il punteggio migliore."""
    stmt = (
        select(TentativoEsercizio.esercizio_id, func.max(TentativoEsercizio.punteggio))
        .join(Esercizio, Esercizio.id == TentativoEsercizio.esercizio_id)
        .where(
            TentativoEsercizio.candidato_id == candidato_id,
            Esercizio.unita_id == unita_id,
        )
        .group_by(TentativoEsercizio.esercizio_id)
    )
    res = await db.execute(stmt)
    return {row[0]: row[1] for row in res.all()}


def _nuovo_streak(precedente: int, ultimo: datetime | None, adesso: datetime) -> int:
    if ultimo is None:
        return 1
    giorni = (adesso.date() - ensure_utc(ultimo).date()).days
    if giorni == 0:
        return max(precedente, 1)
    if giorni == 1:
        return precedente + 1
    return 1


async def _aggiorna_progresso(
    db: AsyncSession, candidato_id: uuid.UUID, unita: Unita
) -> None:
    tot_eser = (
        await db.execute(
            select(func.count()).select_from(Esercizio).where(Esercizio.unita_id == unita.id)
        )
    ).scalar() or 0
    migliori = await _miglior_punteggio_per_esercizio(db, candidato_id, unita.id)
    completati = len(migliori)
    perc = (completati / tot_eser * 100.0) if tot_eser else 0.0

    # punteggio medio normalizzato su 100 sui soli esercizi tentati
    media = 0.0
    if migliori:
        tot_max = (
            await db.execute(
                select(func.coalesce(func.sum(Esercizio.punteggio_max), 0)).where(
                    Esercizio.id.in_(list(migliori.keys()))
                )
            )
        ).scalar() or 0
        somma = sum(migliori.values())
        media = (somma / tot_max * 100.0) if tot_max else 0.0

    adesso = datetime.now(timezone.utc)
    prog = await db.get(ProgressoCandidato, (candidato_id, unita.sezione, unita.id))
    if prog is None:
        prog = ProgressoCandidato(
            candidato_id=candidato_id,
            sezione=unita.sezione,
            unita_id=unita.id,
            streak_giorni=1,
        )
        db.add(prog)
        prog.ultimo_accesso = adesso
    else:
        prog.streak_giorni = _nuovo_streak(prog.streak_giorni, prog.ultimo_accesso, adesso)
        prog.ultimo_accesso = adesso
    prog.percentuale_completamento = round(perc, 1)
    prog.punteggio_medio = round(media, 1)


async def registra_tentativo(
    db: AsyncSession, candidato: Candidato, esercizio: Esercizio, risposta: dict, durata_sec: int
) -> RisultatoOut:
    ris = correggi(
        esercizio.tipo, esercizio.contenuto, esercizio.soluzione, risposta, esercizio.punteggio_max
    )

    punteggio = ris.punteggio
    feedback_ai = None
    # Produzione scritta: valutazione AI (payload anonimizzato)
    if esercizio.tipo in AI_TIPI and (risposta or {}).get("testo"):
        feedback_ai = await valuta_produzione(
            testo=risposta["testo"],
            livello=candidato.livello.value if candidato.livello else "",
            ente=candidato.ente_certificatore.value if candidato.ente_certificatore else "",
            consegna=(esercizio.contenuto or {}).get("prompt", ""),
        )
        if feedback_ai.get("disponibile"):
            # punteggio AI 0-10 → scala sul punteggio_max dell'esercizio
            punteggio = round(int(feedback_ai.get("punteggio", 0)) / 10 * esercizio.punteggio_max)

    tentativo = TentativoEsercizio(
        candidato_id=candidato.id,
        esercizio_id=esercizio.id,
        risposta=risposta,
        punteggio=punteggio,
        durata_sec=max(0, durata_sec),
        feedback_ai=feedback_ai,
    )
    db.add(tentativo)
    await db.flush()

    unita = await db.get(Unita, esercizio.unita_id)
    if unita is not None:
        await _aggiorna_progresso(db, candidato.id, unita)
    await db.commit()

    return RisultatoOut(
        punteggio=punteggio,
        punteggio_max=ris.punteggio_max,
        corretto=ris.corretto,
        dettaglio=ris.dettaglio,
        feedback_ai=feedback_ai,
    )


async def progresso_candidato(db: AsyncSession, candidato: Candidato) -> list[dict]:
    """Progresso per ogni unità del livello del candidato."""
    res = await db.execute(
        select(Unita).where(Unita.livello == candidato.livello).order_by(Unita.sezione, Unita.numero)
    )
    unita_list = res.scalars().all()
    out = []
    for u in unita_list:
        tot = (
            await db.execute(
                select(func.count()).select_from(Esercizio).where(Esercizio.unita_id == u.id)
            )
        ).scalar() or 0
        migliori = await _miglior_punteggio_per_esercizio(db, candidato.id, u.id)
        prog = await db.get(ProgressoCandidato, (candidato.id, u.sezione, u.id))
        out.append(
            {
                "unita_id": u.id,
                "sezione": u.sezione,
                "titolo": u.titolo,
                "numero": u.numero,
                "percentuale_completamento": prog.percentuale_completamento if prog else 0.0,
                "punteggio_medio": prog.punteggio_medio if prog else 0.0,
                "esercizi_totali": tot,
                "esercizi_completati": len(migliori),
            }
        )
    return out


async def statistiche_candidato(db: AsyncSession, candidato: Candidato) -> dict:
    tentativi_totali = (
        await db.execute(
            select(func.count()).select_from(TentativoEsercizio).where(
                TentativoEsercizio.candidato_id == candidato.id
            )
        )
    ).scalar() or 0
    tempo_totale = (
        await db.execute(
            select(func.coalesce(func.sum(TentativoEsercizio.durata_sec), 0)).where(
                TentativoEsercizio.candidato_id == candidato.id
            )
        )
    ).scalar() or 0

    progressi = (
        await db.execute(
            select(ProgressoCandidato).where(ProgressoCandidato.candidato_id == candidato.id)
        )
    ).scalars().all()
    streak = max((p.streak_giorni for p in progressi), default=0)
    unita_completate = sum(1 for p in progressi if p.percentuale_completamento >= 100.0)
    media = (
        round(sum(p.punteggio_medio for p in progressi) / len(progressi), 1) if progressi else 0.0
    )

    unita_totali = (
        await db.execute(
            select(func.count()).select_from(Unita).where(Unita.livello == candidato.livello)
        )
    ).scalar() or 0
    esercizi_completati = (
        await db.execute(
            select(func.count(func.distinct(TentativoEsercizio.esercizio_id))).where(
                TentativoEsercizio.candidato_id == candidato.id
            )
        )
    ).scalar() or 0

    return {
        "esercizi_completati": esercizi_completati,
        "tentativi_totali": tentativi_totali,
        "punteggio_medio": media,
        "tempo_totale_sec": int(tempo_totale),
        "streak_giorni": streak,
        "unita_completate": unita_completate,
        "unita_totali": unita_totali,
    }
