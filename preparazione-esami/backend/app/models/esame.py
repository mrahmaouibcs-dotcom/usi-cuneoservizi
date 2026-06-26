"""Modello della sessione di simulazione d'esame (a tempo, formato CILS)."""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Uuid, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base
from .enums import Ente, Livello


class SessioneEsame(Base):
    """Una simulazione d'esame avviata da un candidato.

    Il timer è gestito dal server: `iniziata_at` + `durata_totale_sec` definisce
    la scadenza. Le risposte si inviano in blocco alla consegna; il punteggio è
    normalizzato su 100 con soglia di superamento a 60.
    """
    __tablename__ = "sessioni_esame"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    candidato_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("candidati.id", ondelete="CASCADE"), nullable=False, index=True
    )
    livello: Mapped[Livello] = mapped_column(
        SAEnum(Livello, native_enum=False, length=20), nullable=False
    )
    ente: Mapped[Ente | None] = mapped_column(SAEnum(Ente, native_enum=False, length=20), nullable=True)

    # elenco ordinato degli esercizi della prova (UUID come stringhe)
    esercizio_ids: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    durata_totale_sec: Mapped[int] = mapped_column(Integer, default=3600, nullable=False)

    iniziata_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    consegnata_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    stato: Mapped[str] = mapped_column(String(20), default="in_corso", nullable=False)

    # risultato (valorizzato alla consegna)
    punteggio: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 0-100
    esito: Mapped[str | None] = mapped_column(String(30), nullable=True)
    risposte: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    dettaglio: Mapped[dict | None] = mapped_column(JSON, nullable=True)
