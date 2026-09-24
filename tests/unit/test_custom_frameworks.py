"""FEAT-51 — a framework the organisation creates is a row, not a key of a blob.

`frameworks` used to be seeded and never written: a CSV import and the
internal-controls framework had nowhere to declare themselves, so their label
and colour went to `D._custom_frameworks` — a key this module drops on save,
since the project PUT decomposes `D` into rows and never reads that one.

What is asserted here is the OUTCOME of a call, never the shape of a request:
the label survives a round trip, the catalogue is protected, and an assessment
in progress cannot be emptied by a deletion.
"""
from __future__ import annotations

import json
import os
import sys
import uuid
from datetime import date

import pytest
import pytest_asyncio

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://u:p@localhost/db")
os.environ.setdefault("MODULE_NAME", "compliance")
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-long-enough-32ch")
os.environ.setdefault("SERVICE_TOKEN", "svc-token-for-tests-0123456789abcdef")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import HTTPException  # noqa: E402
from sqlalchemy import JSON  # noqa: E402
from sqlalchemy.dialects.postgresql import JSONB as _JSONB  # noqa: E402
from sqlalchemy import func, select  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from src.models import (Base, Derogation, Framework, FrameworkRequirement,  # noqa: E402
                        Nonconformity, Project, ProjectControl, ProjectMeta, ProjectSettings)
from sqlalchemy import text as sa_text  # noqa: E402
from src.routes.frameworks import (FrameworkIn, RequirementIn, create_framework,  # noqa: E402
                                   delete_framework, get_framework, list_frameworks,
                                   replace_requirements)
from src.routes.projects import _custom_frameworks  # noqa: E402

for _t in Base.metadata.tables.values():
    for _c in _t.columns:
        if _c.server_default is not None:
            _sd = str(getattr(_c.server_default, "arg", "")).lower()
            if any(k in _sd for k in ("gen_random_uuid", "now(", "::jsonb", "'catalogue'")):
                _c.server_default = None
        if isinstance(_c.type, _JSONB):
            _c.type = JSON()
ProjectControl.__table__.c.id.autoincrement = False

PID = uuid.UUID("00000000-0000-0000-0000-000000000001")


@pytest_asyncio.fixture
async def db():
    engine = create_async_engine("sqlite+aiosqlite://", connect_args={"check_same_thread": False},
                                 poolclass=StaticPool)
    async with engine.begin() as c:
        await c.run_sync(Base.metadata.create_all)
    async with async_sessionmaker(engine, expire_on_commit=False)() as session:
        session.add(Project(id=PID, name="MedSecure"))
        session.add(ProjectMeta(project_id=PID, societe="MedSecure"))
        session.add(ProjectSettings(project_id=PID, referentiels_actifs=["iso"]))
        # The shipped catalogue, as the migrations seed it.
        session.add(Framework(id="iso", version="2022", label="ISO 27001:2022",
                              color="#123456", is_active=True, sort_order=1, origin="catalogue"))
        session.add(FrameworkRequirement(framework_id="iso", ref="A.8.28", sort_order=0,
                                         mesure="Secure coding"))
        await session.commit()
        yield session
    await engine.dispose()


def _payload(**over):
    body = {"id": "custom_politique_rh", "label": "Politique RH", "color": "#78716c",
            "description": "Référentiel personnalisé (2 contrôles)",
            "requirements": [{"ref": "RH-01", "theme": "Recrutement", "mesure": "Vérifier les antécédents"},
                             {"ref": "RH-02", "theme": "Départ", "mesure": "Révoquer les accès"}]}
    body.update(over)
    return FrameworkIn(**body)


@pytest.mark.asyncio
async def test_an_imported_framework_survives_the_round_trip(db):
    """The point of the whole feature: the label and the colour come back.
    They used to be sent in the blob and dropped on the floor."""
    await create_framework(_payload(), user=None, db=db)

    fw = await get_framework("custom_politique_rh", _user=None, db=db)
    assert fw["label"] == "Politique RH"
    assert fw["color"] == "#78716c"
    assert fw["origin"] == "custom"
    assert [m["ref"] for m in fw["measures"]] == ["RH-01", "RH-02"]


@pytest.mark.asyncio
async def test_the_frontend_reads_the_same_shape_as_before(db):
    """`_reconstruct_data` re-emits `_custom_frameworks` from the rows, so the
    screen, the export and a blob written by the browser-local build all keep
    working against a storage that changed underneath them."""
    await create_framework(_payload(), user=None, db=db)

    # `_custom_frameworks` is what `_reconstruct_data` embeds under that key.
    # It takes no project: a framework belongs to the organisation, not to an
    # assessment — re-importing the same CSV per project is what this replaces.
    customs = await _custom_frameworks(db)
    assert list(customs) == ["custom_politique_rh"]
    assert customs["custom_politique_rh"]["label"] == "Politique RH"
    assert [m["ref"] for m in customs["custom_politique_rh"]["measures"]] == ["RH-01", "RH-02"]
    # A catalogue framework is NOT a custom one: it would come back as an
    # import the user made, and be deletable.
    assert "iso" not in customs


@pytest.mark.asyncio
async def test_a_catalogue_framework_is_neither_deletable_nor_editable(db):
    """What the migrations ship is the reference: an assessment that no longer
    matches its own standard is worse than no standard."""
    with pytest.raises(HTTPException) as e:
        await delete_framework("iso", user=None, db=db)
    assert e.value.status_code == 409
    with pytest.raises(HTTPException) as e:
        await replace_requirements("iso", [RequirementIn(ref="X", mesure="y")], user=None, db=db)
    assert e.value.status_code == 409
    assert await db.get(Framework, "iso") is not None


@pytest.mark.asyncio
async def test_deleting_a_framework_with_an_assessment_is_refused(db):
    """The working-set rows ARE the assessment: the conformity, the gap, the
    planned measures. Deleting the framework must not take them."""
    await create_framework(_payload(), user=None, db=db)
    db.add(ProjectControl(project_id=PID, id=1, framework_id="custom_politique_rh",
                          ref="RH-01", mesure="Vérifier les antécédents", conformite="80"))
    await db.commit()

    with pytest.raises(HTTPException) as e:
        await delete_framework("custom_politique_rh", user=None, db=db)
    assert e.value.status_code == 409
    assert await db.get(Framework, "custom_politique_rh") is not None


@pytest.mark.asyncio
async def test_an_untouched_working_set_goes_with_the_framework(db):
    """Activating a framework hydrates its requirements at once. Refusing to
    delete on their mere existence would forbid removing any framework anyone
    ever opened — a rule that protects nothing. What is protected is the WORK:
    a conformity, a gap, a planned or linked measure."""
    await create_framework(_payload(), user=None, db=db)
    db.add(ProjectControl(project_id=PID, id=2, framework_id="custom_politique_rh",
                          ref="RH-01", mesure="Vérifier les antécédents",
                          applicable="", conformite="", ecart="", mesures_prevues=""))
    await db.commit()

    await delete_framework("custom_politique_rh", user=None, db=db)
    assert await db.get(Framework, "custom_politique_rh") is None
    reste = (await db.execute(select(func.count()).select_from(ProjectControl)
                              .where(ProjectControl.framework_id == "custom_politique_rh"))).scalar_one()
    assert reste == 0, "le jeu d'exigences vierge doit partir avec son référentiel"


@pytest.mark.asyncio
async def test_a_single_assessed_requirement_is_enough_to_refuse(db):
    """One filled field is work: the gap alone, with no conformity, counts."""
    await create_framework(_payload(), user=None, db=db)
    db.add(ProjectControl(project_id=PID, id=3, framework_id="custom_politique_rh",
                          ref="RH-02", mesure="Révoquer les accès",
                          conformite="", ecart="Aucune procédure de départ"))
    await db.commit()

    with pytest.raises(HTTPException) as e:
        await delete_framework("custom_politique_rh", user=None, db=db)
    assert e.value.status_code == 409


@pytest.mark.asyncio
async def test_an_unused_framework_goes_away_with_its_definition(db):
    await create_framework(_payload(), user=None, db=db)
    await delete_framework("custom_politique_rh", user=None, db=db)

    assert await db.get(Framework, "custom_politique_rh") is None
    assert await db.get(FrameworkRequirement, ("custom_politique_rh", "RH-01")) is None


@pytest.mark.asyncio
async def test_the_definition_is_replaced_not_appended(db):
    """The internal framework re-sends its whole definition every time a
    control is written: appending would multiply the requirements."""
    await create_framework(_payload(), user=None, db=db)
    await replace_requirements("custom_politique_rh",
                               [RequirementIn(ref="RH-01", mesure="Vérifier les antécédents"),
                                RequirementIn(ref="RH-03", mesure="Former les managers")],
                               user=None, db=db)

    fw = await get_framework("custom_politique_rh", _user=None, db=db)
    assert [m["ref"] for m in fw["measures"]] == ["RH-01", "RH-03"]


@pytest.mark.asyncio
async def test_an_id_that_would_break_a_subject_key_is_refused(db):
    """A framework id travels in a non-conformity subject key, "<fw>:<ref>":
    a colon in it would make the key ambiguous forever after."""
    for mauvais in ("with:colon", "with/slash", "With Upper", "accentué", "-leading"):
        with pytest.raises(HTTPException) as e:
            await create_framework(_payload(id=mauvais), user=None, db=db)
        assert e.value.status_code == 422, f"« {mauvais} » a été accepté comme identifiant"


@pytest.mark.asyncio
async def test_a_framework_is_declared_once(db):
    """The internal one declares itself at every control creation: the second
    call must say "already there", not duplicate or overwrite."""
    await create_framework(_payload(), user=None, db=db)
    with pytest.raises(HTTPException) as e:
        await create_framework(_payload(label="Autre nom"), user=None, db=db)
    assert e.value.status_code == 409
    fw = await get_framework("custom_politique_rh", _user=None, db=db)
    assert fw["label"] == "Politique RH", "un second appel a écrasé le libellé"


@pytest.mark.asyncio
async def test_a_duplicated_ref_does_not_collide(db):
    """Two rows with the same ref would break the primary key: the import
    keeps the first and carries on rather than failing the whole file."""
    await create_framework(_payload(requirements=[
        {"ref": "RH-01", "mesure": "Premier"},
        {"ref": "RH-01", "mesure": "Doublon"},
        {"ref": "RH-02", "mesure": "Second"},
    ]), user=None, db=db)
    fw = await get_framework("custom_politique_rh", _user=None, db=db)
    assert [m["ref"] for m in fw["measures"]] == ["RH-01", "RH-02"]
    assert fw["measures"][0]["mesure"] == "Premier"


@pytest.mark.asyncio
async def test_the_catalogue_listing_says_where_each_one_comes_from(db):
    """The screen needs it to know what it may offer to delete."""
    await create_framework(_payload(), user=None, db=db)
    rows = {r["id"]: r for r in await list_frameworks(_user=None, db=db)}
    assert rows["iso"]["origin"] == "catalogue"
    assert rows["custom_politique_rh"]["origin"] == "custom"
    assert rows["custom_politique_rh"]["requirement_count"] == 2


@pytest.mark.asyncio
async def test_a_framework_id_may_not_borrow_a_reserved_route_segment(db):
    """The edge hides the Pilot→module routes with `location ~ /internal(/|$)`
    on every module. A framework called `internal` lived behind a URL the proxy
    refuses — the application answered, the request never arrived — and it
    could be neither fetched NOR deleted. Nothing may take that name back.

    The previous version of this test compared two string literals and never
    called the route: it could not fail, and it hid the hole it claimed to
    guard."""
    from src.routes.frameworks import RESERVES
    assert "internal" in RESERVES
    for reserve in sorted(RESERVES):
        with pytest.raises(HTTPException) as e:
            await create_framework(_payload(id=reserve, label="X"), user=None, db=db)
        assert e.value.status_code == 422, f"« {reserve} » a été accepté"
        assert await db.get(Framework, reserve) is None


@pytest.mark.asyncio
async def test_a_requirement_named_by_the_register_is_work_too(db):
    """A requirement carries work that lives outside its own columns: a
    non-conformity declared against it. Deleting the row would leave that
    record naming a requirement nobody can resolve — which is exactly what
    happened on the dev stack before this guard existed."""
    await create_framework(_payload(), user=None, db=db)
    db.add(Nonconformity(reference="NC-2026-099", title="Départs non tracés",
                         observed_at=date.today(),
                         subject_type="control", subject_id="custom_politique_rh:RH-02",
                         subjects=[{"type": "control", "id": "custom_politique_rh:RH-02"}]))
    await db.commit()

    with pytest.raises(HTTPException) as e:
        await delete_framework("custom_politique_rh", user=None, db=db)
    assert e.value.status_code == 409
    assert "register" in str(e.value.detail)
    assert await db.get(Framework, "custom_politique_rh") is not None


@pytest.mark.asyncio
async def test_the_subject_list_is_searched_too_not_only_the_scalar(db):
    """The register moved to a list of subjects; the scalar column preceded
    it. A record that names the requirement only in the list must weigh just
    as much — that half was the one the rename forgot."""
    await create_framework(_payload(), user=None, db=db)
    db.add(Nonconformity(reference="NC-2026-098", title="Antécédents non vérifiés",
                         observed_at=date.today(),
                         subject_type="", subject_id="",
                         subjects=[{"type": "control", "id": "custom_politique_rh:RH-01"}]))
    await db.commit()

    with pytest.raises(HTTPException) as e:
        await delete_framework("custom_politique_rh", user=None, db=db)
    assert e.value.status_code == 409


@pytest.mark.asyncio
async def test_the_internal_controls_framework_is_not_the_users_to_delete(db):
    """It is created by the register, not imported by anyone: the module
    leans on it. `custom` says its CONTENT belongs to the organisation, not
    that the framework itself is disposable."""
    from src.routes.frameworks import FRAMEWORK_INTERNE
    await create_framework(_payload(id=FRAMEWORK_INTERNE, label="Contrôles internes"),
                           user=None, db=db)

    with pytest.raises(HTTPException) as e:
        await delete_framework(FRAMEWORK_INTERNE, user=None, db=db)
    assert e.value.status_code == 409
    assert await db.get(Framework, FRAMEWORK_INTERNE) is not None


@pytest.mark.asyncio
async def test_a_deleted_framework_stops_being_listed_as_active(db):
    """Left in the active list, a framework that no longer has a row is asked
    of the API at every page load — the 404 this whole feature closes. The
    cleanup belongs to the server: migration 013 rewrites the same column."""
    await create_framework(_payload(), user=None, db=db)
    await db.execute(sa_text("UPDATE project_settings SET referentiels_actifs = :v"),
                     {"v": json.dumps(["iso", "custom_politique_rh"])})
    await db.commit()

    await delete_framework("custom_politique_rh", user=None, db=db)

    ligne = (await db.execute(sa_text(
        "SELECT referentiels_actifs FROM project_settings"))).scalar_one()
    actifs = ligne if isinstance(ligne, list) else json.loads(ligne or "[]")
    assert actifs == ["iso"], "le référentiel supprimé est resté actif"


@pytest.mark.asyncio
async def test_the_definition_may_not_be_emptied_through_the_back_door(db):
    """`POST` refuses a framework with no requirement. Emptying one through
    the requirements route would fabricate exactly that state."""
    await create_framework(_payload(), user=None, db=db)
    with pytest.raises(HTTPException) as e:
        await replace_requirements("custom_politique_rh", [], user=None, db=db)
    assert e.value.status_code == 422
    # A real request gets a fresh session; reusing this one would hand back the
    # instance already in the identity map, without its requirements loaded.
    db.expunge_all()
    fw = await get_framework("custom_politique_rh", _user=None, db=db)
    assert len(fw["measures"]) == 2


@pytest.mark.asyncio
async def test_an_underscore_in_the_id_is_not_a_wildcard(db):
    """Every imported id carries one — `custom_<slug>_<stamp>` — and `_` is a
    LIKE wildcard: without an escape the guard would count records belonging
    to a NEIGHBOURING framework and refuse a deletion that is legitimate."""
    # The neighbour must differ AT the underscore's position, not after it:
    # `custom_xb` still matches the literal `_` and fails on `ab:` — a couple
    # chosen that way passes on the buggy code too, which is how the first
    # version of this test guarded nothing.
    await create_framework(_payload(id="custom_ab"), user=None, db=db)
    await create_framework(_payload(id="customzab"), user=None, db=db)
    db.add(Nonconformity(reference="NC-2026-097", title="Sur le voisin",
                         observed_at=date.today(),
                         subject_type="control", subject_id="customzab:RH-01",
                         subjects=[{"type": "control", "id": "customzab:RH-01"}]))
    await db.commit()

    # Unescaped, `custom_ab:%` matches `customzab:RH-01` and the deletion is
    # refused for a record that belongs to the neighbour.
    await delete_framework("custom_ab", user=None, db=db)
    assert await db.get(Framework, "custom_ab") is None
    with pytest.raises(HTTPException):
        await delete_framework("customzab", user=None, db=db)


@pytest.mark.asyncio
async def test_a_payload_from_the_browser_build_brings_its_frameworks(db):
    """The browser-local build has no server: its frameworks travel in the
    payload, which is the only place it has. Ignored on import, the
    requirements would land in the project while the framework stayed
    anonymous — the state this feature exists to end."""
    from src.routes.projects import _adopter_referentiels
    await _adopter_referentiels(db, {"_custom_frameworks": {"custom_venu_du_web": {
        "label": "Politique groupe", "color": "#123456",
        "measures": [{"ref": "PG-01", "theme": "Gouvernance", "mesure": "Publier la politique"},
                     {"ref": "PG-02", "mesure": "La revoir chaque année"}]}}}, None)
    await db.commit()
    db.expunge_all()

    fw = await get_framework("custom_venu_du_web", _user=None, db=db)
    assert fw["label"] == "Politique groupe" and fw["origin"] == "custom"
    assert [m["ref"] for m in fw["measures"]] == ["PG-01", "PG-02"]


@pytest.mark.asyncio
async def test_an_import_never_overwrites_a_framework_we_already_hold(db):
    """Adoption fills a gap; it does not let a payload rewrite the
    organisation's own definitions."""
    from src.routes.projects import _adopter_referentiels
    await create_framework(_payload(), user=None, db=db)
    await _adopter_referentiels(db, {"_custom_frameworks": {
        "custom_politique_rh": {"label": "Renommé par un import", "measures": []}}}, None)
    await db.commit()
    db.expunge_all()

    fw = await get_framework("custom_politique_rh", _user=None, db=db)
    assert fw["label"] == "Politique RH"
    assert len(fw["measures"]) == 2


@pytest.mark.asyncio
async def test_an_import_may_not_smuggle_in_a_reserved_id(db):
    """The guard on creation would be worth nothing if the import path let
    the same name through."""
    from src.routes.projects import _adopter_referentiels
    await _adopter_referentiels(db, {"_custom_frameworks": {
        "internal": {"label": "X", "measures": [{"ref": "A", "mesure": "B"}]}}}, None)
    await db.commit()
    assert await db.get(Framework, "internal") is None


@pytest.mark.asyncio
async def test_an_ordinary_save_never_adopts_a_framework(db):
    """Adoption belongs to the IMPORT path alone. On an ordinary save it would
    let a tab that still holds a framework deleted elsewhere bring it back —
    and that tab is the normal state of any window left open."""
    from src.routes.projects import _decompose_data, _delete_children
    # The real save path clears the children first; doing less would collide
    # on the rows the fixture already holds, not on the rule under test.
    await _delete_children(db, PID)
    await _decompose_data(db, PID, {"meta": {}, "referentiels_actifs": ["custom_venu_du_web"],
                                    "referentiels": {},
                                    "_custom_frameworks": {"custom_venu_du_web": {
                                        "label": "Ressuscité", "measures": [{"ref": "PG-01"}]}}})
    await db.commit()
    assert await db.get(Framework, "custom_venu_du_web") is None, \
        "une sauvegarde ordinaire a déclaré un référentiel"


@pytest.mark.asyncio
async def test_adoption_is_an_editor_gesture(db):
    """`POST /api/frameworks` requires `editor`. Importing a project does not:
    without this gate the import is a back door onto the organisation's
    frameworks, which every project then sees."""
    from src.routes.projects import _adopter_referentiels

    class _Lecteur:
        """A reader — `_module_role` is what `get_module_role` actually reads.

        Carrying any other attribute would make the 403 come from "no role at
        all", and the test would pass against a guard set to any threshold.
        """
        _module_role = "reader"

    blob = {"_custom_frameworks": {"custom_par_la_bande": {
        "label": "Par la bande", "measures": [{"ref": "X-01", "mesure": "y"}]}}}
    with pytest.raises(HTTPException) as e:
        await _adopter_referentiels(db, blob, _Lecteur())
    assert e.value.status_code == 403
    assert "editor" in str(e.value.detail), \
        "le refus doit venir du seuil, pas d'une absence totale de rôle"
    assert await db.get(Framework, "custom_par_la_bande") is None
