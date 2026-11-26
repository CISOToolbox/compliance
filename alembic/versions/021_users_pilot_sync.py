"""a project's users can follow Pilot's directory (FEAT-74)

Revision ID: 021_users_pilot_sync
Revises: 020_si_users
Create Date: 2026-11-26

`projects.users_pilot_sync`: when set, the changes Pilot broadcasts to its
directory are applied to the project's users. Off for every project.
"""
from alembic import op
import sqlalchemy as sa

revision = "021_users_pilot_sync"
down_revision = "020_si_users"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("users_pilot_sync", sa.Boolean(), nullable=False,
                                        server_default=sa.text("false")))


def downgrade() -> None:
    op.drop_column("projects", "users_pilot_sync")
