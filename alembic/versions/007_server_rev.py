"""projects.server_rev — stale-tab guard (FEAT-33)

Revision ID: 007_server_rev
Revises: 006_measure_auto_key
Create Date: 2026-08-15

Bumped only by server-initiated writers (Pilot write-back, restore,
schedulers); the blob PUT is refused (409) when a stale tab tries to
overwrite them. Also created by create_all on fresh databases.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "007_server_rev"
down_revision = "006_measure_auto_key"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("server_rev", sa.Integer(), nullable=False, server_default=sa.text("0")))


def downgrade() -> None:
    op.drop_column("projects", "server_rev")
