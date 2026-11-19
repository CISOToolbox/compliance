"""monitors, collected versions and exclusions of the automated monitoring (FEAT-73)

Revision ID: 016_collection_monitors
Revises: 015_collection_connections
Create Date: 2026-11-17

A monitor is a collector activated on a measure, backed by a collected
proof; each collection writes a version; an exclusion sets a finding aside
with a justification. No foreign key to measures or proofs: a whole-project
save deletes and re-inserts those rows.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "016_collection_monitors"
down_revision = "015_collection_connections"
branch_labels = None
depends_on = None


def _uuid_pk():
    return sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))


def _project():
    return sa.Column("project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)


def upgrade() -> None:
    op.create_table(
        "collection_monitors", _uuid_pk(), _project(),
        sa.Column("connection_id", UUID(as_uuid=True), sa.ForeignKey("collection_connections.id"), nullable=False),
        sa.Column("measure_id", sa.String(30), nullable=False),
        sa.Column("proof_id", sa.String(30), nullable=False),
        sa.Column("collector_code", sa.String(20), nullable=False),
        sa.Column("params", JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("retention", JSONB, nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("activated_by", sa.String(255), nullable=False, server_default=sa.text("''")),
        sa.Column("activated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("deactivated_by", sa.String(255), nullable=False, server_default=sa.text("''")),
        sa.Column("deactivated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deactivation_reason", sa.Text(), nullable=False, server_default=sa.text("''")),
        sa.Column("last_attempt_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_version_id", UUID(as_uuid=True), nullable=True),
        sa.Column("last_result", sa.String(20), nullable=True),
        sa.Column("last_collected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("state_since", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_since", sa.DateTime(timezone=True), nullable=True),
        sa.Column("alerted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_collection_monitors_project_id", "collection_monitors", ["project_id"])
    op.create_index("ix_collection_monitors_connection_id", "collection_monitors", ["connection_id"])
    op.create_index("uq_collection_monitors_active", "collection_monitors",
                    ["project_id", "measure_id", "collector_code", "connection_id"],
                    unique=True, postgresql_where=sa.text("active"))
    op.create_table(
        "collection_versions", _uuid_pk(),
        sa.Column("monitor_id", UUID(as_uuid=True), sa.ForeignKey("collection_monitors.id", ondelete="CASCADE"), nullable=False),
        _project(),
        sa.Column("seq", sa.Integer(), nullable=False),
        sa.Column("collected_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("data_as_of", sa.DateTime(timezone=True), nullable=True),
        sa.Column("trigger", sa.String(20), nullable=False, server_default=sa.text("'schedule'")),
        sa.Column("collector_code", sa.String(20), nullable=False),
        sa.Column("collector_version", sa.Integer(), nullable=False),
        sa.Column("rule_text", sa.Text(), nullable=False, server_default=sa.text("''")),
        sa.Column("connection_label", sa.String(255), nullable=False, server_default=sa.text("''")),
        sa.Column("result", sa.String(20), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("missing_permission", sa.String(200), nullable=True),
        sa.Column("partial", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("evaluated", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("n_findings", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("n_excluded", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("n_unreadable", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("scope", JSONB, nullable=True),
        sa.Column("findings", JSONB, nullable=True),
        sa.Column("excluded", JSONB, nullable=True),
        sa.Column("unreadable", JSONB, nullable=True),
        sa.Column("raw", JSONB, nullable=True),
        sa.Column("raw_sha256", sa.String(64), nullable=False),
        sa.Column("result_changed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("purged_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_collection_versions_project_id", "collection_versions", ["project_id"])
    op.create_index("uq_collection_versions_seq", "collection_versions", ["monitor_id", "seq"], unique=True)
    op.create_index("ix_collection_versions_monitor_at", "collection_versions", ["monitor_id", "collected_at"])
    op.create_table(
        "collection_exclusions", _uuid_pk(), _project(),
        sa.Column("connection_id", UUID(as_uuid=True), sa.ForeignKey("collection_connections.id", ondelete="CASCADE"), nullable=False),
        sa.Column("collector_code", sa.String(20), nullable=False),
        sa.Column("resource", sa.Text(), nullable=False),
        sa.Column("resource_hash", sa.String(64), nullable=False),
        sa.Column("justification", sa.Text(), nullable=False),
        sa.Column("kind", sa.String(20), nullable=False, server_default=sa.text("'permanent'")),
        sa.Column("derogation_id", UUID(as_uuid=True), nullable=True),
        sa.Column("created_by", sa.String(255), nullable=False, server_default=sa.text("''")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("revoked_by", sa.String(255), nullable=False, server_default=sa.text("''")),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_reason", sa.Text(), nullable=False, server_default=sa.text("''")),
    )
    op.create_index("ix_collection_exclusions_project_id", "collection_exclusions", ["project_id"])
    op.create_index("uq_collection_exclusions_live", "collection_exclusions",
                    ["connection_id", "collector_code", "resource_hash"],
                    unique=True, postgresql_where=sa.text("revoked_at IS NULL"))


def downgrade() -> None:
    op.drop_table("collection_exclusions")
    op.drop_table("collection_versions")
    op.drop_table("collection_monitors")
