"""a project's decisions on suggested collector links (FEAT-73)

Revision ID: 017_collection_suggestions
Revises: 016_collection_monitors
Create Date: 2026-11-17

A collector's link to a requirement deduced from the mappings to ISO is a
suggestion: the project confirms it (it then counts as the collector's own)
or rejects it (it is no longer proposed).
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "017_collection_suggestions"
down_revision = "016_collection_monitors"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "collection_suggestion_decisions",
        sa.Column("project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("collector_code", sa.String(20), primary_key=True),
        sa.Column("requirement_key", sa.String(120), primary_key=True),
        sa.Column("decision", sa.String(20), nullable=False),
        sa.Column("decided_by", sa.String(255), nullable=False, server_default=sa.text("''")),
        sa.Column("decided_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )


def downgrade() -> None:
    op.drop_table("collection_suggestion_decisions")
