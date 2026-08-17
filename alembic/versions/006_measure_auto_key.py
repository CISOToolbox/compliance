"""project_measures.auto_key — dedup for proof-expiry auto-created measures

Revision ID: 006_measure_auto_key
Revises: 005_evidence_fields
Create Date: 2026-08-13

The proof-expiry notifier (src/proof_notifier.py) materialises one measure
per EXPIRED proof, idempotently: auto_key = "<proof_id>:<date_expiration>",
unique per project, NULL for manual measures — same pattern as Asset's
FEAT-22 renewal measures. The column is round-tripped through the blob
GET/PUT (routes/projects.py) so bulk saves don't strip it.
The column is also created by Base.metadata.create_all on fresh databases;
this migration tracks the change for existing deployments.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "006_measure_auto_key"
down_revision = "005_evidence_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("project_measures", sa.Column("auto_key", sa.String(length=160), nullable=True))
    op.create_index("uq_project_measures_auto_key", "project_measures",
                    ["project_id", "auto_key"], unique=True)


def downgrade() -> None:
    op.drop_index("uq_project_measures_auto_key", table_name="project_measures")
    op.drop_column("project_measures", "auto_key")
