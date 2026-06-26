"""Modelli candidato e token di attivazione."""
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Uuid, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .enums import Ente, Livello, Ruolo, StatoAccount


def _enum(py_enum, **kw):
    # native_enum=False -> memorizzato come VARCHAR: cross-dialect (PG + SQLite)
    return mapped_column(SAEnum(py_enum, native_enum=False, length=20), **kw)


class Candidato(Base):
    __tablename__ = "candidati"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    cognome: Mapped[str] = mapped_column(String(100), nullable=False)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)

    ruolo: Mapped[Ruolo] = _enum(Ruolo, nullable=False, default=Ruolo.candidato)
    # livello obbligatorio per i candidati; nullo per tutor/admin
    livello: Mapped[Livello | None] = _enum(Livello, nullable=True)
    ente_certificatore: Mapped[Ente | None] = _enum(Ente, nullable=True)
    data_esame: Mapped[date | None] = mapped_column(Date, nullable=True)

    codice_iscrizione: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, default=uuid.uuid4, nullable=False
    )
    stato_account: Mapped[StatoAccount] = _enum(
        StatoAccount, nullable=False, default=StatoAccount.in_attesa
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    activation_tokens: Mapped[list["ActivationToken"]] = relationship(
        back_populates="candidato", cascade="all, delete-orphan"
    )
    tentativi: Mapped[list["TentativoEsercizio"]] = relationship(  # noqa: F821
        back_populates="candidato", cascade="all, delete-orphan"
    )
    progressi: Mapped[list["ProgressoCandidato"]] = relationship(  # noqa: F821
        back_populates="candidato", cascade="all, delete-orphan"
    )


class ActivationToken(Base):
    __tablename__ = "activation_tokens"

    token: Mapped[str] = mapped_column(String(64), primary_key=True)
    candidato_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("candidati.id", ondelete="CASCADE"), nullable=False, index=True
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    candidato: Mapped["Candidato"] = relationship(back_populates="activation_tokens")
