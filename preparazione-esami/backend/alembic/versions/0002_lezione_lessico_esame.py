"""contenuti arricchiti (tema/lezione/lessico/abilità) e simulazione d'esame

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-26

Nota: lo schema di sviluppo/locale è creato da `create_all` (scripts.init_db);
questa migrazione tiene allineato il percorso Alembic per la produzione.
"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- contenuti arricchiti ---
    op.add_column("unita", sa.Column("tema", sa.String(length=255), nullable=False, server_default=""))
    op.add_column("unita", sa.Column("lezione", sa.JSON(), nullable=False, server_default=sa.text("'{}'")))
    op.add_column("unita", sa.Column("lessico", sa.JSON(), nullable=False, server_default=sa.text("'[]'")))
    op.add_column(
        "esercizi",
        sa.Column("abilita", sa.String(length=30), nullable=False, server_default="grammatica"),
    )

    # --- simulazione d'esame ---
    op.create_table(
        "sessioni_esame",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("candidato_id", sa.Uuid(), nullable=False),
        sa.Column("livello", sa.String(length=20), nullable=False),
        sa.Column("ente", sa.String(length=20), nullable=True),
        sa.Column("esercizio_ids", sa.JSON(), nullable=False),
        sa.Column("durata_totale_sec", sa.Integer(), nullable=False),
        sa.Column("iniziata_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("consegnata_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("stato", sa.String(length=20), nullable=False),
        sa.Column("punteggio", sa.Integer(), nullable=True),
        sa.Column("esito", sa.String(length=30), nullable=True),
        sa.Column("risposte", sa.JSON(), nullable=True),
        sa.Column("dettaglio", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["candidato_id"], ["candidati.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sessioni_esame_candidato_id", "sessioni_esame", ["candidato_id"])


def downgrade() -> None:
    op.drop_index("ix_sessioni_esame_candidato_id", table_name="sessioni_esame")
    op.drop_table("sessioni_esame")
    op.drop_column("esercizi", "abilita")
    op.drop_column("unita", "lessico")
    op.drop_column("unita", "lezione")
    op.drop_column("unita", "tema")
