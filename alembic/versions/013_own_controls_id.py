"""The internal-controls framework loses an id the edge refuses (FEAT-51)

Revision ID: 013_own_controls_id
Revises: 012_custom_frameworks
Create Date: 2026-09-23

The proxy hides the Pilot→module routes with `location ~ /internal(/|$)
{ return 404; }`, on every module. A framework whose id is literally
`internal` therefore lives behind a URL the edge refuses: the application
answers, the request never reaches it.

The fix is not to weaken the rule — it guards ten modules — but to stop a
DATA identifier from borrowing the name of a reserved ROUTE segment. The
framework becomes `own_controls`, everywhere it is referenced: its definition,
the working-set rows that carry the assessment, the active-framework list, and
the subject keys of the records declared against one of its requirements.

No compatibility mapping for `internal` is kept on the import path: this
framework was created by FEAT-45 a few days ago and no deployment carries one.
Carrying dead code for a case that cannot exist would cost more than it saves.
"""
import json

from alembic import op
import sqlalchemy as sa

revision = "013_own_controls_id"
down_revision = "012_custom_frameworks"
branch_labels = None
depends_on = None

ANCIEN = "internal"
NOUVEAU = "own_controls"


def _renomme(conn, ancien: str, nouveau: str) -> None:
    existe = conn.execute(sa.text("SELECT 1 FROM frameworks WHERE id = :a"), {"a": ancien}).scalar()
    if not existe:
        return
    # `UPDATE frameworks SET id` is refused: the child foreign keys cascade on
    # DELETE, not on UPDATE. So the row is COPIED under the new id, the
    # children are repointed, and only then is the old row removed — at which
    # point nothing references it any more and the cascade has nothing to take.
    conn.execute(sa.text(
        "INSERT INTO frameworks (id, version, label, description, description_en,"
        " color, is_active, sort_order, origin)"
        " SELECT :n, version, label, description, description_en, color, is_active,"
        " sort_order, origin FROM frameworks WHERE id = :a"
    ), {"a": ancien, "n": nouveau})
    conn.execute(sa.text("UPDATE framework_requirements SET framework_id = :n WHERE framework_id = :a"),
                 {"a": ancien, "n": nouveau})
    # The mapping table points at frameworks from both ends, and its foreign
    # keys cascade on delete: left behind, the mappings would vanish with the
    # old row instead of following the framework.
    conn.execute(sa.text("UPDATE framework_mappings SET source_framework = :n WHERE source_framework = :a"),
                 {"a": ancien, "n": nouveau})
    conn.execute(sa.text("UPDATE framework_mappings SET target_framework = :n WHERE target_framework = :a"),
                 {"a": ancien, "n": nouveau})
    conn.execute(sa.text("UPDATE project_controls SET framework_id = :n WHERE framework_id = :a"),
                 {"a": ancien, "n": nouveau})
    # The active list is a JSON array of ids. Rewritten in Python rather than
    # in SQL: a `:a::text` cast inside a text() confuses the bind-parameter
    # parser, and a migration is the worst place to be clever.
    for pid, actifs in conn.execute(sa.text(
            "SELECT project_id, referentiels_actifs FROM project_settings")).fetchall():
        liste = actifs if isinstance(actifs, list) else json.loads(actifs or "[]")
        if ancien not in liste:
            continue
        conn.execute(sa.text("UPDATE project_settings SET referentiels_actifs = CAST(:v AS jsonb)"
                             " WHERE project_id = :p"),
                     {"v": json.dumps([nouveau if x == ancien else x for x in liste]), "p": pid})
    # "<framework>:<ref>" — the key a record names its requirement by.
    # The offset is an integer literal, not a bind: asyncpg cannot infer the
    # type of a parameter in `substring(... from $n)` and refuses the int.
    depart = len(ancien) + 1
    for table in ("nonconformities", "derogations"):
        conn.execute(sa.text(
            f"UPDATE {table} SET subject_id = :n || substring(subject_id from {depart})"
            " WHERE subject_type = 'control' AND subject_id LIKE :prefixe"
        ), {"n": nouveau, "prefixe": ancien + ":%"})
    # A record may name SEVERAL requirements: `subjects` is the list the API
    # actually serves, and the scalar column above is what preceded it. Both
    # carry the key, so both are rewritten — missing this one left the screen
    # pointing at a framework that no longer exists.
    for rid, sujets in conn.execute(sa.text(
            "SELECT id, subjects FROM nonconformities WHERE subjects IS NOT NULL")).fetchall():
        liste = sujets if isinstance(sujets, list) else json.loads(sujets or "[]")
        touche = False
        for item in liste:
            cle = str((item or {}).get("id") or "")
            if item.get("type") == "control" and cle.startswith(ancien + ":"):
                item["id"] = nouveau + cle[len(ancien):]
                touche = True
        if touche:
            conn.execute(sa.text("UPDATE nonconformities SET subjects = CAST(:v AS jsonb) WHERE id = :i"),
                         {"v": json.dumps(liste), "i": rid})
    conn.execute(sa.text("DELETE FROM frameworks WHERE id = :a"), {"a": ancien})


def upgrade() -> None:
    _renomme(op.get_bind(), ANCIEN, NOUVEAU)


def downgrade() -> None:
    _renomme(op.get_bind(), NOUVEAU, ANCIEN)
