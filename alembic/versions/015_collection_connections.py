"""connections of the automated monitoring, one project each (FEAT-73)

Revision ID: 015_collection_connections
Revises: 014_proof_source
Create Date: 2026-11-17

A connection holds the access to one provider account for one project.
Its secrets are stored encrypted (settings_crypto). Deleting the project
deletes its connections.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "015_collection_connections"
down_revision = "014_proof_source"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "collection_connections",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider", sa.String(20), nullable=False),
        sa.Column("label", sa.String(255), nullable=False),
        sa.Column("mode", sa.String(10), nullable=False, server_default=sa.text("'demo'")),
        sa.Column("settings", JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("secrets_enc", sa.Text(), nullable=False, server_default=sa.text("''")),
        sa.Column("last_test_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_test_ok", sa.Boolean(), nullable=True),
        sa.Column("last_test_message", sa.Text(), nullable=False, server_default=sa.text("''")),
        sa.Column("missing_permissions", JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("created_by", sa.String(255), nullable=False, server_default=sa.text("''")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )
    op.create_index("ix_collection_connections_project_id", "collection_connections", ["project_id"])
    op.create_index("uq_collection_connections_label", "collection_connections",
                    ["project_id", "provider", "label"], unique=True)


def downgrade() -> None:
    op.drop_table("collection_connections")
