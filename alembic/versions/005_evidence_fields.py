"""evidence first-class fields on proofs (FEAT-08)

Revision ID: 005_evidence_fields
Revises: 004_measure_progress_log
Create Date: 2026-06-29

Enriches project_proofs into the shared first-class *evidence* shape so the
proofs can be consolidated in Pilot's evidence registry: kind (file|link|
observation), file_ref, owner, tags[]. Additive + nullable/defaulted — no
data migration needed.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision = "005_evidence_fields"
down_revision = "004_measure_progress_log"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("project_proofs", sa.Column("kind", sa.String(length=20),
                  nullable=False, server_default=sa.text("'link'")))
    op.add_column("project_proofs", sa.Column("file_ref", sa.String(length=500),
                  nullable=True, server_default=sa.text("''")))
    op.add_column("project_proofs", sa.Column("owner", sa.String(length=255),
                  nullable=True, server_default=sa.text("''")))
    op.add_column("project_proofs", sa.Column("tags", JSONB,
                  nullable=False, server_default=sa.text("'[]'::jsonb")))


def downgrade() -> None:
    op.drop_column("project_proofs", "tags")
    op.drop_column("project_proofs", "owner")
    op.drop_column("project_proofs", "file_ref")
    op.drop_column("project_proofs", "kind")
