"""FEAT-74 lot 1 — the users of a project: entered, imported, and their
accounts (perimeter, account name, optional role); identity fields as in
Pilot's directory (nom, prenom, email, statut)."""
import os
import sys
import uuid

import pytest
from fastapi import HTTPException

sys.path.insert(0, os.path.dirname(__file__))
from monitoring_helpers import A, B, _req  # noqa: E402
from src.routes import si_users as ru  # noqa: E402
from src.schemas import SiUserCreate, SiUsersImport, SiUserUpdate  # noqa: E402
from src.si_users import UserError, checked_user, merge_accounts, parse_users_csv  # noqa: E402

GH = {"perimetre": "GitHub", "role": ""}


# ── What an entry may hold ──────────────────────────────────────────────

def test_an_entry_is_normalised():
    assert checked_user({"email": " A.Durand@MedSecure.example ", "nom": "Durand", "prenom": " Alice ",
                         "comptes": [{"perimetre": " GitHub ", "compte": "a-durand", "role": "admin"}]}) == {
        "email": "a.durand@medsecure.example", "nom": "Durand", "prenom": "Alice", "statut": "actif", "date_depart": None,
        "comptes": [{"perimetre": "GitHub", "compte": "a-durand", "role": "admin"}]}


@pytest.mark.parametrize("given, message", [
    ({"email": "not-an-email"}, "invalid email"),
    ({"email": "a@b.example", "statut": "gone"}, "one of actif, inactif, externe, not gone"),
    ({"email": "a@b.example", "date_depart": "2026-10-01"}, "only an inactif user has a date of departure"),
    ({"email": "a@b.example", "statut": "externe", "date_depart": "2026-10-01"}, "only an inactif user"),
    ({"email": "a@b.example", "statut": "inactif", "date_depart": "01/10/2026"}, "YYYY-MM-DD"),
    ({"email": "a@b.example", "nom": "two\nlines"}, "one line"),
    ({"email": "a@b.example", "statut": "inactif", "date_depart": "20261031"}, "YYYY-MM-DD"),
    ({"email": "a@b.example", "statut": "inactif", "date_depart": "2026-W44-1"}, "YYYY-MM-DD"),
    ({"email": "a@b.example", "comptes": [{"perimetre": "ERP - Finance", "compte": "x"}]}, "neither a comma"),
    ({"email": "a@b.example", "comptes": [{"perimetre": "R&D, Lab", "compte": "x"}]}, "neither a comma"),
    ({"email": "a@b.example", "comptes": [{"perimetre": "GitHub"}]}, "a perimeter and an account name"),
    ({"email": "a@b.example", "comptes": [{"perimetre": "ERP", "compte": "ad"}, {"perimetre": "erp", "compte": "AD"}]},
     "listed twice"),
])
def test_a_faulty_entry_is_refused(given, message):
    with pytest.raises(UserError, match=message):
        checked_user(given)


def test_a_user_back_loses_the_date_of_departure():
    left = checked_user({"email": "a@b.example", "statut": "inactif", "date_depart": "2026-10-01"})
    assert checked_user({"statut": "actif"}, left)["date_depart"] is None


def test_added_accounts_keep_the_others_and_update_the_role_only_when_given():
    current = [{"perimetre": "ERP", "compte": "adurand", "role": "reader"},
               {"perimetre": "GitHub", "compte": "a-durand", "role": "owner"}]
    assert merge_accounts(current, [{"perimetre": "erp", "compte": "ADURAND", "role": "admin"},
                                    {"perimetre": "github", "compte": "a-durand", "role": ""},
                                    {"perimetre": "VPN", "compte": "adurand", "role": ""}]) == [
        {"perimetre": "ERP", "compte": "adurand", "role": "admin"},
        {"perimetre": "GitHub", "compte": "a-durand", "role": "owner"},          # no role in the file: kept
        {"perimetre": "VPN", "compte": "adurand", "role": ""}]


def test_a_csv_file_takes_one_line_per_account_in_any_order_with_either_separator():
    users = parse_users_csv("﻿Email;Statut;Perimetre;Compte;Role\n"
                            "j.martin@medsecure.example;inactif;GitHub;j-martin;\n"
                            "j.martin@medsecure.example;Inactif;ERP;jmartin;admin\n\n"
                            "p.leroy@medsecure.example;externe;;;\n")
    assert users == [
        {"email": "j.martin@medsecure.example", "line": 2, "given": {"statut": "inactif"},
         "comptes": [{"perimetre": "GitHub", "compte": "j-martin", "role": ""},
                      {"perimetre": "ERP", "compte": "jmartin", "role": "admin"}]},
        {"email": "p.leroy@medsecure.example", "line": 5, "given": {"statut": "externe"}, "comptes": []}]


@pytest.mark.parametrize("text, message", [
    ("nom,compte\nDurand,a-durand\n", "at least email"),
    ("email,team\na@b.example,IT\n", "unknown columns: team"),
    ("email,statut\na@b.example,gone\nb@b.example,actif\nnope,actif\n", "line 2: .*line 4: invalid email"),
    ("email,statut\na@b.example,actif\nA@b.example,inactif\n", "line 3: statut differs from line 2"),
    ("email,date_depart\na@b.example,31/10/2026\n", "line 2: date_depart must be a date"),
    ("email,perimetre,compte\na@b.example,ERP,\n", "line 2: an account needs a perimeter and an account name"),
    ("email,perimetre,compte\na@b.example,ERP,ad\na@b.example,erp,AD\n", "line 3: .*listed twice"),
])
def test_a_faulty_csv_file_is_refused_as_a_whole(text, message):
    with pytest.raises(UserError, match=message):
        parse_users_csv(text)


# ── The routes ──────────────────────────────────────────────────────────

async def _add(db, project=A, **kw):
    return await ru.create_si_user(project, SiUserCreate(**kw), _req(), user=None, db=db)


@pytest.mark.asyncio
async def test_users_are_listed_changed_and_deleted_within_their_project(monitored_db):
    alice = await _add(monitored_db, email="a.durand@medsecure.example", nom="Durand", prenom="Alice",
                       comptes=[dict(GH, compte="a-durand")])
    await _add(monitored_db, project=B, email="other@b.example")
    assert [u["email"] for u in await ru.list_si_users(A, user=None, db=monitored_db)] == ["a.durand@medsecure.example"]
    uid = uuid.UUID(alice["id"])
    changed = await ru.update_si_user(A, uid, SiUserUpdate(statut="inactif", date_depart="2026-11-01"), _req(),
                                      user=None, db=monitored_db)
    assert changed["statut"] == "inactif" and changed["comptes"] == [dict(GH, compte="a-durand")]
    with pytest.raises(HTTPException) as e:
        await ru.update_si_user(B, uid, SiUserUpdate(nom="x"), _req(), user=None, db=monitored_db)
    assert e.value.status_code == 404
    await ru.delete_si_user(A, uid, _req(), user=None, db=monitored_db)
    assert await ru.list_si_users(A, user=None, db=monitored_db) == []


@pytest.mark.asyncio
async def test_an_email_or_an_account_belongs_to_one_user_of_the_project(monitored_db):
    await _add(monitored_db, email="a.durand@medsecure.example", comptes=[dict(GH, compte="a-durand")])
    for kw in ({"email": "A.Durand@medsecure.example"},
               {"email": "p.leroy@medsecure.example", "comptes": [{"perimetre": "GITHUB", "compte": "A-DURAND"}]}):
        with pytest.raises(HTTPException) as e:
            await _add(monitored_db, **kw)
        assert e.value.status_code == 409
    # the same name on another perimeter is another account; another project is another directory
    await _add(monitored_db, email="p.leroy@medsecure.example", comptes=[{"perimetre": "ERP", "compte": "a-durand"}])
    await _add(monitored_db, project=B, email="a.durand@medsecure.example", comptes=[dict(GH, compte="a-durand")])


@pytest.mark.asyncio
async def test_an_import_adds_and_updates_with_the_columns_it_holds_and_removes_nobody(monitored_db):
    await _add(monitored_db, email="a.durand@medsecure.example", nom="Durand", prenom="Alice",
               comptes=[dict(GH, compte="a-durand")])
    await _add(monitored_db, email="c.bernard@partner.example", nom="Bernard", prenom="Claire")
    res = await ru.import_si_users(A, SiUsersImport(csv="email,statut,date_depart,perimetre,compte,role\n"
                                                        "a.durand@medsecure.example,inactif,2026-11-01,ERP,adurand,admin\n"
                                                        "p.leroy@medsecure.example,actif,,,,\n"),
                                   _req(), user=None, db=monitored_db)
    assert res == {"created": 1, "updated": 1, "unchanged": 0}
    users = {u["email"]: u for u in await ru.list_si_users(A, user=None, db=monitored_db)}
    assert sorted(users) == ["a.durand@medsecure.example", "c.bernard@partner.example", "p.leroy@medsecure.example"]
    alice = users["a.durand@medsecure.example"]
    assert (alice["statut"], alice["nom"], alice["prenom"]) == ("inactif", "Durand", "Alice")   # no name column: kept
    assert alice["comptes"] == [dict(GH, compte="a-durand"), {"perimetre": "ERP", "compte": "adurand", "role": "admin"}]


@pytest.mark.asyncio
async def test_an_import_leaves_what_its_empty_cells_do_not_say(monitored_db):
    await _add(monitored_db, email="p.leroy@medsecure.example", nom="Leroy", prenom="Paul", statut="inactif", date_depart="2026-10-31",
               comptes=[{"perimetre": "ERP", "compte": "pl", "role": "admin"}])
    res = await ru.import_si_users(A, SiUsersImport(csv="email,nom,prenom,statut,date_depart,perimetre,compte,role\n"
                                                        "p.leroy@medsecure.example,,,,,ERP,pl,\n"
                                                        "p.leroy@medsecure.example,,,,,GitHub,p-leroy,\n"),
                                   _req(), user=None, db=monitored_db)
    assert res == {"created": 0, "updated": 1, "unchanged": 0}
    paul = (await ru.list_si_users(A, user=None, db=monitored_db))[0]
    assert (paul["nom"], paul["prenom"], paul["statut"], paul["date_depart"]) == ("Leroy", "Paul", "inactif", "2026-10-31")
    assert paul["comptes"] == [{"perimetre": "ERP", "compte": "pl", "role": "admin"},
                                {"perimetre": "GitHub", "compte": "p-leroy", "role": ""}]


@pytest.mark.asyncio
async def test_an_import_checks_the_status_and_the_date_against_the_project(monitored_db):
    await _add(monitored_db, email="a.durand@medsecure.example")
    with pytest.raises(HTTPException) as e:
        await ru.import_si_users(A, SiUsersImport(csv="email,date_depart\na.durand@medsecure.example,2026-11-01\n"),
                                 _req(), user=None, db=monitored_db)
    assert e.value.status_code == 422 and "line 2 (a.durand@medsecure.example): only an inactif user" in e.value.detail


@pytest.mark.asyncio
async def test_a_change_ignores_what_it_sends_as_null_but_the_date(monitored_db):
    paul = await _add(monitored_db, email="p.leroy@medsecure.example", statut="inactif", date_depart="2026-10-31",
                      comptes=[dict(GH, compte="p-leroy")])
    uid = uuid.UUID(paul["id"])
    same = await ru.update_si_user(A, uid, SiUserUpdate(statut=None, comptes=None, prenom="Paul"), _req(),
                                   user=None, db=monitored_db)
    assert (same["statut"], same["date_depart"], same["comptes"]) == ("inactif", "2026-10-31", [dict(GH, compte="p-leroy")])
    cleared = await ru.update_si_user(A, uid, SiUserUpdate(date_depart=None), _req(), user=None, db=monitored_db)
    assert cleared["statut"] == "inactif" and cleared["date_depart"] is None


@pytest.mark.asyncio
async def test_an_email_written_meanwhile_is_a_conflict_not_an_error(monitored_db):
    from src.models import SiUser
    await _add(monitored_db, email="a.durand@medsecure.example")
    monitored_db.add(SiUser(id=uuid.uuid4(), project_id=A, email="p.leroy@medsecure.example", comptes=[]))
    original = ru._users

    async def stale(db, project_id):            # the list as read before the other write landed
        return [u for u in await original(db, project_id) if u.email != "p.leroy@medsecure.example"]
    ru._users = stale
    try:
        with pytest.raises(HTTPException) as e:
            await _add(monitored_db, email="p.leroy@medsecure.example")
    finally:
        ru._users = original
    assert e.value.status_code == 409


@pytest.mark.asyncio
async def test_an_import_giving_an_account_to_two_users_writes_nothing(monitored_db):
    await _add(monitored_db, email="a.durand@medsecure.example", comptes=[dict(GH, compte="a-durand")])
    with pytest.raises(HTTPException) as e:
        await ru.import_si_users(A, SiUsersImport(csv="email,perimetre,compte\np.leroy@medsecure.example,GitHub,a-durand\n"),
                                 _req(), user=None, db=monitored_db)
    assert e.value.status_code == 409
    monitored_db.expunge_all()
    assert [u["email"] for u in await ru.list_si_users(A, user=None, db=monitored_db)] == ["a.durand@medsecure.example"]


def test_a_change_cannot_empty_the_statut():
    with pytest.raises(UserError, match="statut cannot be empty"):
        checked_user({"statut": ""}, checked_user({"email": "a@b.example", "statut": "inactif"}))


@pytest.mark.asyncio
async def test_a_change_to_another_users_email_is_a_conflict(monitored_db):
    await _add(monitored_db, email="a.durand@medsecure.example")
    paul = await _add(monitored_db, email="p.leroy@medsecure.example")
    with pytest.raises(HTTPException) as e:
        await ru.update_si_user(A, uuid.UUID(paul["id"]), SiUserUpdate(email="A.Durand@medsecure.example"), _req(),
                                user=None, db=monitored_db)
    assert e.value.status_code == 409
