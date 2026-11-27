"""a user's contract type is distinct from their status (FEAT-74)

Revision ID: 022_si_users_contract_type
Revises: 021_users_pilot_sync
Create Date: 2026-11-26

`si_users.statut` is the activity (recrutement, actif, inactif) and the new
`si_users.type_contrat` the contract (interne, externe, alternant,
stagiaire), as in Pilot's directory. A user stored `externe` becomes `actif`
with the contract `externe`.
"""
from alembic import op
import sqlalchemy as sa

revision = "022_si_users_contract_type"
down_revision = "021_users_pilot_sync"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("si_users", sa.Column("type_contrat", sa.String(20), nullable=False,
                                        server_default=sa.text("'interne'")))
    op.execute("UPDATE si_users SET statut = 'actif', type_contrat = 'externe' WHERE statut = 'externe'")


def downgrade() -> None:
    op.execute("UPDATE si_users SET statut = 'externe' WHERE type_contrat = 'externe' AND statut = 'actif'")
    op.execute("UPDATE si_users SET statut = 'actif' WHERE statut = 'recrutement'")     # unknown before
    op.drop_column("si_users", "type_contrat")
