"""Modelli dei contenuti didattici: unità ed esercizi."""
import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, JSON, String, Text, Uuid
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .enums import ExerciseType, Livello


class Unita(Base):
    __tablename__ = "unita"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    livello: Mapped[Livello] = mapped_column(
        SAEnum(Livello, native_enum=False, length=20), nullable=False, index=True
    )
    sezione: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    numero: Mapped[int] = mapped_column(Integer, nullable=False)
    titolo: Mapped[str] = mapped_column(String(255), nullable=False)
    descrizione: Mapped[str] = mapped_column(Text, default="", nullable=False)
    obiettivi_cefr: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    ordine: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    esercizi: Mapped[list["Esercizio"]] = relationship(
        back_populates="unita", cascade="all, delete-orphan", order_by="Esercizio.ordine"
    )


class Esercizio(Base):
    __tablename__ = "esercizi"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    unita_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("unita.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tipo: Mapped[ExerciseType] = mapped_column(
        SAEnum(ExerciseType, native_enum=False, length=20), nullable=False
    )
    titolo: Mapped[str] = mapped_column(String(255), nullable=False)
    istruzioni: Mapped[str] = mapped_column(Text, default="", nullable=False)
    # struttura specifica per tipo (domande, opzioni, testo cloze, ...), SENZA soluzione
    contenuto: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    # soluzione separata: NON inviata al client tramite GET /esercizi/{id}
    soluzione: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    audio_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    punteggio_max: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    tempo_limite_sec: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ordine: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    unita: Mapped["Unita"] = relationship(back_populates="esercizi")
    tentativi: Mapped[list["TentativoEsercizio"]] = relationship(  # noqa: F821
        back_populates="esercizio", cascade="all, delete-orphan"
    )
