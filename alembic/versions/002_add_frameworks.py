"""add framework reference tables

Creates frameworks, framework_requirements, framework_mappings,
and measure_catalog tables for storing compliance referential data
in the database instead of static JS files.
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "002_add_frameworks"
down_revision = "001_baseline"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "frameworks",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("version", sa.String(20), nullable=False, server_default=""),
        sa.Column("label", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True, server_default=""),
        sa.Column("description_en", sa.Text, nullable=True, server_default=""),
        sa.Column("color", sa.String(20), nullable=True, server_default=""),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "framework_requirements",
        sa.Column("framework_id", sa.String(50), sa.ForeignKey("frameworks.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("ref", sa.String(50), primary_key=True),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("theme", sa.String(500), nullable=True, server_default=""),
        sa.Column("theme_en", sa.String(500), nullable=True, server_default=""),
        sa.Column("mesure", sa.Text, nullable=True, server_default=""),
        sa.Column("mesure_en", sa.Text, nullable=True, server_default=""),
        sa.Column("description", sa.Text, nullable=True, server_default=""),
        sa.Column("description_en", sa.Text, nullable=True, server_default=""),
        sa.Column("type", sa.String(50), nullable=True, server_default=""),
        sa.Column("category", sa.String(50), nullable=True, server_default=""),
        sa.Column("linked_controls", JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("metadata_extra", JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
    )

    op.create_table(
        "framework_mappings",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("source_framework", sa.String(50), sa.ForeignKey("frameworks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_framework", sa.String(50), sa.ForeignKey("frameworks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_ref", sa.String(50), nullable=False),
        sa.Column("target_ref", sa.String(50), nullable=False),
        sa.Column("relationship_type", sa.String(30), nullable=True, server_default=""),
        sa.Column("rationale", sa.Text, nullable=True, server_default=""),
    )
    op.create_index("ix_fw_mapping_source", "framework_mappings", ["source_framework", "source_ref"])
    op.create_index("ix_fw_mapping_target", "framework_mappings", ["target_framework", "target_ref"])

    op.create_table(
        "measure_catalog",
        sa.Column("id", sa.String(20), primary_key=True),
        sa.Column("domain", sa.String(100), nullable=False, server_default=""),
        sa.Column("title", sa.Text, nullable=False, server_default=""),
        sa.Column("title_en", sa.Text, nullable=True, server_default=""),
        sa.Column("description", sa.Text, nullable=True, server_default=""),
        sa.Column("description_en", sa.Text, nullable=True, server_default=""),
        sa.Column("evidence_types", JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("measure_type", sa.String(30), nullable=True, server_default=""),
        sa.Column("framework_refs", JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
    )


def downgrade() -> None:
    op.drop_table("measure_catalog")
    op.drop_table("framework_mappings")
    op.drop_table("framework_requirements")
    op.drop_table("frameworks")
