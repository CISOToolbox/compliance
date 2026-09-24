"""A user-created framework is a row, not a key of the blob (FEAT-51)

Revision ID: 012_custom_frameworks
Revises: 011_nonconformity_project
Create Date: 2026-09-23

`frameworks` was a read-only catalogue: seeded here, never written by the
application. A framework imported from a CSV, and the internal-controls one
the register creates, had nowhere to put their label and colour, so they went
into `D._custom_frameworks` — a key this module's storage does not keep, since
the project PUT decomposes `D` into rows and never reads that one.

This adds the `origin` column and lifts what survived: every `framework_id`
carried by `project_controls` without a `frameworks` row becomes a `custom`
row, its requirements copied into `framework_requirements`.

**The label was lost with the blob.** It is rebuilt from the identifier — the
internal framework gets its known name, an imported one gets a readable form
of its id — and the user can rename it. This migration does not pretend to
restore what was never stored.
"""
from alembic import op
import sqlalchemy as sa

revision = "012_custom_frameworks"
down_revision = "011_nonconformity_project"
branch_labels = None
depends_on = None

# Same palette the CSV import draws from, so a lifted framework does not stand
# out as grey among coloured ones.
_COULEUR = "#78716c"


def _libelle(fw_id: str) -> str:
    if fw_id in ("internal", "own_controls"):
        return "Contrôles internes"
    nom = fw_id
    if nom.startswith("custom_"):
        nom = nom[len("custom_"):]
    # "custom_politique_rh_m1k2j3" → "politique rh" : the import appends a
    # base-36 timestamp, which says nothing to a reader.
    morceaux = [m for m in nom.split("_") if m]
    if len(morceaux) > 1 and len(morceaux[-1]) <= 9 and any(c.isdigit() for c in morceaux[-1]):
        morceaux = morceaux[:-1]
    return " ".join(morceaux).strip() or fw_id


def upgrade() -> None:
    op.add_column("frameworks",
                  sa.Column("origin", sa.String(20), nullable=False, server_default="catalogue"))

    conn = op.get_bind()
    orphelins = conn.execute(sa.text(
        "SELECT DISTINCT pc.framework_id FROM project_controls pc "
        "LEFT JOIN frameworks f ON f.id = pc.framework_id "
        "WHERE f.id IS NULL AND pc.framework_id <> ''"
    )).scalars().all()

    for fw_id in orphelins:
        conn.execute(sa.text(
            "INSERT INTO frameworks (id, version, label, description, description_en,"
            " color, is_active, sort_order, origin)"
            " VALUES (:id, '', :label, '', '', :color, true, 900, 'custom')"
        ), {"id": fw_id, "label": _libelle(fw_id), "color": _COULEUR})
        # The reference definition, taken from the working set: it is the only
        # trace left of what the framework contains.
        conn.execute(sa.text(
            "INSERT INTO framework_requirements"
            " (framework_id, ref, sort_order, theme, theme_en, mesure, mesure_en,"
            "  description, description_en)"
            " SELECT DISTINCT ON (pc.ref) pc.framework_id, pc.ref, pc.sort_order,"
            "  COALESCE(pc.thematique, ''), COALESCE(pc.thematique_en, ''),"
            "  COALESCE(pc.mesure, ''), COALESCE(pc.mesure_en, ''), '', ''"
            " FROM project_controls pc"
            " WHERE pc.framework_id = :id AND COALESCE(pc.ref, '') <> ''"
            " ORDER BY pc.ref, pc.sort_order"
        ), {"id": fw_id})


def downgrade() -> None:
    # The lifted rows are deliberately kept: dropping them would take the only
    # surviving definition of a framework the blob no longer carries.
    op.drop_column("frameworks", "origin")
