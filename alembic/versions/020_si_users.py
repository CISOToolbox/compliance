"""the users of a project (FEAT-74)

Revision ID: 020_si_users
Revises: 019_monitor_system_stops
Create Date: 2026-11-24

Who works on the project, whether they are still present, and their accounts
(perimeter, account name, optional role): what GH-04 matches the members of
a GitHub organization to.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "020_si_users"
down_revision = "019_monitor_system_stops"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "si_users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=False, server_default=sa.text("''")),
        sa.Column("status", sa.String(10), nullable=False, server_default=sa.text("'present'")),
        sa.Column("left_on", sa.String(10), nullable=True),
        sa.Column("accounts", JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )
    op.create_index("ix_si_users_project_id", "si_users", ["project_id"])
    op.create_index("uq_si_users_email", "si_users", ["project_id", "email"], unique=True)


def downgrade() -> None:
    op.drop_table("si_users")
