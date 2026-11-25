"""FEAT-74 lot 1 — GH-04 matches the members of a GitHub organization to
the accounts of the project's users, on the perimeter its connection names."""
import os
import sys
import uuid

import pytest

sys.path.insert(0, os.path.dirname(__file__))
from monitoring_helpers import A, B, _activate, _connections, _req  # noqa: E402
from src.collection.service import perimeter_logins  # noqa: E402
from src.models import CollectionConnection, ProjectControl  # noqa: E402
from src.routes import collection as r  # noqa: E402
from src.routes import si_users as ru  # noqa: E402
from src.schemas import SiUserCreate, SiUsersImport  # noqa: E402


def test_gh04_reads_the_accounts_of_one_perimeter_in_any_case():
    users = [{"email": "a@m.example", "name": "Alice", "status": "present",
              "accounts": [{"perimeter": "MedSecure", "account": "a-durand", "role": ""},
                           {"perimeter": "ERP", "account": "adurand", "role": ""}]},
             {"email": "p@m.example", "name": "", "status": "left",
              "accounts": [{"perimeter": "medsecure", "account": "p-leroy", "role": ""}]}]
    assert perimeter_logins(users, "medsecure") == [{"login": "a-durand", "name": "Alice", "active": True},
                                                    {"login": "p-leroy", "name": "p@m.example", "active": False}]


async def _add(db, project=A, **kw):
    return await ru.create_si_user(project, SiUserCreate(**kw), _req(), user=None, db=db)


# ── GH-04, once the project lists its users ─────────────────────────────

CSV = ("email,name,status,left_on,perimeter,account,role\n"
       "a.durand@medsecure.example,Alice Durand,present,,medsecure,a-durand,\n"
       "p.leroy@medsecure.example,Paul Leroy,left,2026-10-31,medsecure,p-leroy,\n"
       "p.leroy@medsecure.example,,,,ERP,j-martin,\n")          # j-martin, but on another perimeter


async def _gh04_versions(db):
    _, gh = await _connections(db)
    db.add(ProjectControl(project_id=A, id=3, framework_id="iso", ref="A.5.18", applicable="", mesures_ids=["M-1"]))
    await db.commit()
    return gh


def _states(version):
    return {s["resource"]: (s["state"], s.get("detail")) for s in version["resources"]}


@pytest.mark.asyncio
async def test_gh04_is_proposed_once_the_project_lists_users_and_judges_each_member(monitored_db):
    gh = await _gh04_versions(monitored_db)
    await _add(monitored_db, project=B, email="someone@b.example")      # another project's users count for nothing
    m = await r.measure_monitoring(A, "M-1", user=None, db=monitored_db)
    assert "GH-04" not in [p["collector_code"] for p in m["proposals"]]
    await ru.import_si_users(A, SiUsersImport(csv=CSV), _req(), user=None, db=monitored_db)
    m = await r.measure_monitoring(A, "M-1", user=None, db=monitored_db)
    assert "GH-04" in [p["collector_code"] for p in m["proposals"]]
    view = await _activate(monitored_db, gh, "GH-04")
    assert view["last"]["result"] == "non_conforme"
    states = _states(await r.get_version(A, uuid.UUID(view["last"]["id"]), user=None, db=monitored_db))
    assert states["a-durand"] == ("conforme", None)
    assert states["p-leroy"][0] == "non_conforme" and "who left (Paul Leroy)" in states["p-leroy"][1]
    assert states["j-martin"] == ("non_conforme", "member linked to no user")
    assert states["c-bernard"][0] == "non_conforme"


@pytest.mark.asyncio
async def test_gh04_reads_the_perimeter_the_connection_names(monitored_db):
    gh = await _gh04_versions(monitored_db)
    await ru.import_si_users(A, SiUsersImport(csv=CSV), _req(), user=None, db=monitored_db)
    conn = await monitored_db.get(CollectionConnection, gh)
    conn.settings = dict(conn.settings, accounts_perimeter="ERP")
    await monitored_db.commit()
    view = await _activate(monitored_db, gh, "GH-04")
    states = _states(await r.get_version(A, uuid.UUID(view["last"]["id"]), user=None, db=monitored_db))
    assert states["j-martin"][0] == "non_conforme" and "who left (Paul Leroy)" in states["j-martin"][1]
    assert states["a-durand"] == ("non_conforme", "member linked to no user")
