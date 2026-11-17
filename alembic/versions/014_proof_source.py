"""every proof has a source: manual or collected (FEAT-73)

Revision ID: 014_proof_source
Revises: 013_own_controls_id
Create Date: 2026-11-16

A collected proof will be written by the server from a connector; every
existing proof was added by a person. Additive: the column is created with
`manual` as its default, which every existing row takes.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "014_proof_source"
down_revision = "013_own_controls_id"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("project_proofs", sa.Column("source", sa.String(length=20),
                  nullable=False, server_default=sa.text("'manual'")))


def downgrade() -> None:
    op.drop_column("project_proofs", "source")
