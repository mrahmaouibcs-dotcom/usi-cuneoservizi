"""Modelli di tracciamento: tentativi e progresso del candidato."""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class TentativoEsercizio(Base):
    __tablename__ = "tentativi_esercizio"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    candidato_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("candidati.id", ondelete="CASCADE"), nullable=False, index=True
    )
    esercizio_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("esercizi.id", ondelete="CASCADE"), nullable=False, index=True
    )
    risposta: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    punteggio: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    feedback_ai: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    durata_sec: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completato_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    candidato: Mapped["Candidato"] = relationship(back_populates="tentativi")  # noqa: F821
    esercizio: Mapped["Esercizio"] = relationship(back_populates="tentativi")  # noqa: F821


class ProgressoCandidato(Base):
    __tablename__ = "progressi_candidato"

    # chiave primaria composita: candidato + sezione + unità
    candidato_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("candidati.id", ondelete="CASCADE"), primary_key=True
    )
    sezione: Mapped[str] = mapped_column(String(50), primary_key=True)
    unita_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("unita.id", ondelete="CASCADE"), primary_key=True
    )

    percentuale_completamento: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    punteggio_medio: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    ultimo_accesso: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    streak_giorni: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    candidato: Mapped["Candidato"] = relationship(back_populates="progressi")  # noqa: F821
