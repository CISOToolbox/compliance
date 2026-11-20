"""a monitoring the server stopped says so (BUG-160)

Revision ID: 019_monitor_system_stops
Revises: 018_derogation_revoked_by
Create Date: 2026-11-20

An activation now resumes the monitoring a person stopped on the measure. One
the server stopped because its measure was deleted or dropped by a save or a
restore left `deactivated_by` empty: it is marked `system`, so that a measure
created again under the same id does not inherit its history.
"""
from alembic import op

revision = "019_monitor_system_stops"
down_revision = "018_derogation_revoked_by"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE collection_monitors SET deactivated_by = 'system' "
               "WHERE active = false AND deactivated_by = '' AND deactivation_reason IN "
               "('measure deleted', 'measure removed by a whole-project save', 'measure removed by a restore')")


def downgrade() -> None:
    pass                    # data only: the marks are kept
