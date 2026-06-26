"""schema iniziale

Revision ID: 0001
Revises:
Create Date: 2026-06-26
"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "candidati",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("nome", sa.String(length=100), nullable=False),
        sa.Column("cognome", sa.String(length=100), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=True),
        sa.Column("ruolo", sa.String(length=20), nullable=False),
        sa.Column("livello", sa.String(length=20), nullable=True),
        sa.Column("ente_certificatore", sa.String(length=20), nullable=True),
        sa.Column("data_esame", sa.Date(), nullable=True),
        sa.Column("codice_iscrizione", sa.Uuid(), nullable=False),
        sa.Column("stato_account", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("codice_iscrizione"),
    )
    op.create_index("ix_candidati_email", "candidati", ["email"], unique=True)

    op.create_table(
        "activation_tokens",
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("candidato_id", sa.Uuid(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["candidato_id"], ["candidati.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("token"),
    )
    op.create_index("ix_activation_tokens_candidato_id", "activation_tokens", ["candidato_id"])

    op.create_table(
        "unita",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("livello", sa.String(length=20), nullable=False),
        sa.Column("sezione", sa.String(length=50), nullable=False),
        sa.Column("numero", sa.Integer(), nullable=False),
        sa.Column("titolo", sa.String(length=255), nullable=False),
        sa.Column("descrizione", sa.Text(), nullable=False),
        sa.Column("obiettivi_cefr", sa.JSON(), nullable=False),
        sa.Column("ordine", sa.Integer(), nullable=False),
        sa.Column("is_published", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_unita_livello", "unita", ["livello"])
    op.create_index("ix_unita_sezione", "unita", ["sezione"])

    op.create_table(
        "esercizi",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("unita_id", sa.Uuid(), nullable=False),
        sa.Column("tipo", sa.String(length=20), nullable=False),
        sa.Column("titolo", sa.String(length=255), nullable=False),
        sa.Column("istruzioni", sa.Text(), nullable=False),
        sa.Column("contenuto", sa.JSON(), nullable=False),
        sa.Column("soluzione", sa.JSON(), nullable=False),
        sa.Column("audio_url", sa.String(length=512), nullable=True),
        sa.Column("punteggio_max", sa.Integer(), nullable=False),
        sa.Column("tempo_limite_sec", sa.Integer(), nullable=True),
        sa.Column("ordine", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["unita_id"], ["unita.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_esercizi_unita_id", "esercizi", ["unita_id"])

    op.create_table(
        "tentativi_esercizio",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("candidato_id", sa.Uuid(), nullable=False),
        sa.Column("esercizio_id", sa.Uuid(), nullable=False),
        sa.Column("risposta", sa.JSON(), nullable=False),
        sa.Column("punteggio", sa.Integer(), nullable=False),
        sa.Column("feedback_ai", sa.JSON(), nullable=True),
        sa.Column("durata_sec", sa.Integer(), nullable=False),
        sa.Column("completato_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["candidato_id"], ["candidati.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["esercizio_id"], ["esercizi.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tentativi_candidato_id", "tentativi_esercizio", ["candidato_id"])
    op.create_index("ix_tentativi_esercizio_id", "tentativi_esercizio", ["esercizio_id"])

    op.create_table(
        "progressi_candidato",
        sa.Column("candidato_id", sa.Uuid(), nullable=False),
        sa.Column("sezione", sa.String(length=50), nullable=False),
        sa.Column("unita_id", sa.Uuid(), nullable=False),
        sa.Column("percentuale_completamento", sa.Float(), nullable=False),
        sa.Column("punteggio_medio", sa.Float(), nullable=False),
        sa.Column("ultimo_accesso", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("streak_giorni", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["candidato_id"], ["candidati.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["unita_id"], ["unita.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("candidato_id", "sezione", "unita_id"),
    )

    op.create_table(
        "access_logs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("candidato_id", sa.Uuid(), nullable=True),
        sa.Column("ip", sa.String(length=64), nullable=False),
        sa.Column("user_agent", sa.String(length=512), nullable=False),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["candidato_id"], ["candidati.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_access_logs_candidato_id", "access_logs", ["candidato_id"])
    op.create_index("ix_access_logs_created_at", "access_logs", ["created_at"])


def downgrade() -> None:
    op.drop_table("access_logs")
    op.drop_table("progressi_candidato")
    op.drop_table("tentativi_esercizio")
    op.drop_table("esercizi")
    op.drop_table("unita")
    op.drop_table("activation_tokens")
    op.drop_index("ix_candidati_email", table_name="candidati")
    op.drop_table("candidati")
