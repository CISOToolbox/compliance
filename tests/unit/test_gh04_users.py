"""FEAT-74 lot 1 — GH-04 matches the members of a GitHub organization to
the accounts of the project's users on the GitHub perimeter; the
organization is the connection's."""
import os
import sys
import uuid

import pytest

sys.path.insert(0, os.path.dirname(__file__))
from monitoring_helpers import A, B, _activate, _connections, _req  # noqa: E402
from src.collection.service import perimeter_logins  # noqa: E402
from src.models import ProjectControl  # noqa: E402
from src.routes import collection as r  # noqa: E402
from src.routes import si_users as ru  # noqa: E402
from src.schemas import SiUserCreate, SiUsersImport  # noqa: E402


def test_gh04_reads_the_accounts_of_one_perimeter_in_any_case():
    users = [{"email": "a@m.example", "prenom": "Alice", "nom": "Durand", "statut": "actif",
              "comptes": [{"perimetre": "GitHub", "compte": "a-durand", "role": ""},
                          {"perimetre": "ERP", "compte": "adurand", "role": ""}]},
             {"email": "c@m.example", "prenom": "", "nom": "Bernard", "statut": "recrutement", "type_contrat": "externe",
              "comptes": [{"perimetre": "github", "compte": "c-bernard", "role": ""}]},
             {"email": "p@m.example", "prenom": "", "nom": "", "statut": "inactif",
              "comptes": [{"perimetre": "GITHUB", "compte": "p-leroy", "role": ""}]}]
    assert perimeter_logins(users, "GitHub") == [{"login": "a-durand", "name": "Alice Durand", "active": True},
                                                 {"login": "c-bernard", "name": "Bernard", "active": True},
                                                 {"login": "p-leroy", "name": "p@m.example", "active": False}]


async def _add(db, project=A, **kw):
    return await ru.create_si_user(project, SiUserCreate(**kw), _req(), user=None, db=db)


CSV = ("email,nom,prenom,statut,type_contrat,date_depart,perimetre,compte,role\n"
       "a.durand@medsecure.example,Durand,Alice,actif,interne,,GitHub,a-durand,\n"
       "p.leroy@medsecure.example,Leroy,Paul,inactif,interne,2026-10-31,GitHub,p-leroy,\n"
       "p.leroy@medsecure.example,,,,,,medsecure,j-martin,\n"     # j-martin, but on another perimeter
       "c.bernard@partner.example,Bernard,Claire,recrutement,externe,,GitHub,c-bernard,\n")   # not arrived yet: there



def _states(version):
    return {s["resource"]: (s["state"], s.get("detail")) for s in version["resources"]}


@pytest.mark.asyncio
async def test_gh04_is_proposed_once_the_project_lists_users_and_judges_each_member(monitored_db):
    _, gh = await _connections(monitored_db)
    monitored_db.add(ProjectControl(project_id=A, id=3, framework_id="iso", ref="A.5.18", applicable="", mesures_ids=["M-1"]))
    await monitored_db.commit()
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
    # an account named j-martin on another perimeter is not a GitHub account
    assert states["j-martin"] == ("non_conforme", "member linked to no user")
    assert states["c-bernard"] == ("conforme", None)                   # an external user is still there


@pytest.mark.asyncio
async def test_without_users_any_more_an_active_gh04_has_nothing_to_judge(monitored_db):
    _, gh = await _connections(monitored_db)
    monitored_db.add(ProjectControl(project_id=A, id=3, framework_id="iso", ref="A.5.18", applicable="", mesures_ids=["M-1"]))
    await monitored_db.commit()
    await ru.import_si_users(A, SiUsersImport(csv=CSV), _req(), user=None, db=monitored_db)
    view = await _activate(monitored_db, gh, "GH-04")
    for u in await ru.list_si_users(A, user=None, db=monitored_db):
        await ru.delete_si_user(A, uuid.UUID(u["id"]), _req(), user=None, db=monitored_db)
    again = await r.run_monitoring(A, uuid.UUID(view["id"]), user=None, db=monitored_db)
    assert again["last"]["result"] == "sans_objet"
