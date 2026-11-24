"""FEAT-74 lot 1 — the users of a project: entered, imported, and their
accounts (perimeter, account name, optional role)."""
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

GH = {"perimeter": "medsecure", "role": ""}


# ── What an entry may hold ──────────────────────────────────────────────

def test_an_entry_is_normalised():
    assert checked_user({"email": " A.Durand@MedSecure.example ", "name": "Alice Durand",
                         "accounts": [{"perimeter": " medsecure ", "account": "a-durand", "role": "admin"}]}) == {
        "email": "a.durand@medsecure.example", "name": "Alice Durand", "status": "present", "left_on": None,
        "accounts": [{"perimeter": "medsecure", "account": "a-durand", "role": "admin"}]}


@pytest.mark.parametrize("given, message", [
    ({"email": "not-an-email"}, "invalid email"),
    ({"email": "a@b.example", "status": "gone"}, "present or left"),
    ({"email": "a@b.example", "left_on": "2026-10-01"}, "present has no date of departure"),
    ({"email": "a@b.example", "status": "left", "left_on": "01/10/2026"}, "YYYY-MM-DD"),
    ({"email": "a@b.example", "name": "two\nlines"}, "one line"),
    ({"email": "a@b.example", "accounts": [{"perimeter": "medsecure"}]}, "a perimeter and an account name"),
    ({"email": "a@b.example", "accounts": [{"perimeter": "ERP", "account": "ad"}, {"perimeter": "erp", "account": "AD"}]},
     "listed twice"),
])
def test_a_faulty_entry_is_refused(given, message):
    with pytest.raises(UserError, match=message):
        checked_user(given)


def test_a_user_back_loses_the_date_of_departure():
    left = checked_user({"email": "a@b.example", "status": "left", "left_on": "2026-10-01"})
    assert checked_user({"status": "present"}, left)["left_on"] is None


def test_added_accounts_keep_the_others_and_update_the_role_only_when_given():
    current = [{"perimeter": "ERP", "account": "adurand", "role": "reader"},
               {"perimeter": "medsecure", "account": "a-durand", "role": "owner"}]
    assert merge_accounts(current, [{"perimeter": "erp", "account": "ADURAND", "role": "admin"},
                                    {"perimeter": "MedSecure", "account": "a-durand", "role": ""},
                                    {"perimeter": "VPN", "account": "adurand", "role": ""}]) == [
        {"perimeter": "ERP", "account": "adurand", "role": "admin"},
        {"perimeter": "medsecure", "account": "a-durand", "role": "owner"},          # no role in the file: kept
        {"perimeter": "VPN", "account": "adurand", "role": ""}]


def test_a_csv_file_takes_one_line_per_account_in_any_order_with_either_separator():
    users = parse_users_csv("﻿Email;Status;Perimeter;Account;Role\n"
                            "j.martin@medsecure.example;left;medsecure;j-martin;\n"
                            "j.martin@medsecure.example;Left;ERP;jmartin;admin\n\n"
                            "p.leroy@medsecure.example;present;;;\n")
    assert users == [
        {"email": "j.martin@medsecure.example", "line": 2, "given": {"status": "left"},
         "accounts": [{"perimeter": "medsecure", "account": "j-martin", "role": ""},
                      {"perimeter": "ERP", "account": "jmartin", "role": "admin"}]},
        {"email": "p.leroy@medsecure.example", "line": 5, "given": {"status": "present"}, "accounts": []}]


@pytest.mark.parametrize("text, message", [
    ("name,account\nAlice,a-durand\n", "at least email"),
    ("email,team\na@b.example,IT\n", "unknown columns: team"),
    ("email,status\na@b.example,gone\nb@b.example,present\nnope,present\n", "line 2: .*line 4: invalid email"),
    ("email,status\na@b.example,present\nA@b.example,left\n", "line 3: status differs from line 2"),
    ("email,left_on\na@b.example,31/10/2026\n", "line 2: left_on must be a date"),
    ("email,perimeter,account\na@b.example,ERP,\n", "line 2: an account needs a perimeter and an account name"),
    ("email,perimeter,account\na@b.example,ERP,ad\na@b.example,erp,AD\n", "line 3: .*listed twice"),
])
def test_a_faulty_csv_file_is_refused_as_a_whole(text, message):
    with pytest.raises(UserError, match=message):
        parse_users_csv(text)


# ── The routes ──────────────────────────────────────────────────────────

async def _add(db, project=A, **kw):
    return await ru.create_si_user(project, SiUserCreate(**kw), _req(), user=None, db=db)


@pytest.mark.asyncio
async def test_users_are_listed_changed_and_deleted_within_their_project(monitored_db):
    alice = await _add(monitored_db, email="a.durand@medsecure.example", name="Alice Durand",
                       accounts=[dict(GH, account="a-durand")])
    await _add(monitored_db, project=B, email="other@b.example")
    assert [u["email"] for u in await ru.list_si_users(A, user=None, db=monitored_db)] == ["a.durand@medsecure.example"]
    uid = uuid.UUID(alice["id"])
    changed = await ru.update_si_user(A, uid, SiUserUpdate(status="left", left_on="2026-11-01"), _req(),
                                      user=None, db=monitored_db)
    assert changed["status"] == "left" and changed["accounts"] == [dict(GH, account="a-durand")]
    with pytest.raises(HTTPException) as e:
        await ru.update_si_user(B, uid, SiUserUpdate(name="x"), _req(), user=None, db=monitored_db)
    assert e.value.status_code == 404
    await ru.delete_si_user(A, uid, _req(), user=None, db=monitored_db)
    assert await ru.list_si_users(A, user=None, db=monitored_db) == []


@pytest.mark.asyncio
async def test_an_email_or_an_account_belongs_to_one_user_of_the_project(monitored_db):
    await _add(monitored_db, email="a.durand@medsecure.example", accounts=[dict(GH, account="a-durand")])
    for kw in ({"email": "A.Durand@medsecure.example"},
               {"email": "p.leroy@medsecure.example", "accounts": [{"perimeter": "MEDSECURE", "account": "A-DURAND"}]}):
        with pytest.raises(HTTPException) as e:
            await _add(monitored_db, **kw)
        assert e.value.status_code == 409
    # the same name on another perimeter is another account; another project is another directory
    await _add(monitored_db, email="p.leroy@medsecure.example", accounts=[{"perimeter": "ERP", "account": "a-durand"}])
    await _add(monitored_db, project=B, email="a.durand@medsecure.example", accounts=[dict(GH, account="a-durand")])


@pytest.mark.asyncio
async def test_an_import_adds_and_updates_with_the_columns_it_holds_and_removes_nobody(monitored_db):
    await _add(monitored_db, email="a.durand@medsecure.example", name="Alice Durand",
               accounts=[dict(GH, account="a-durand")])
    await _add(monitored_db, email="c.bernard@partner.example", name="Claire Bernard")
    res = await ru.import_si_users(A, SiUsersImport(csv="email,status,left_on,perimeter,account,role\n"
                                                        "a.durand@medsecure.example,left,2026-11-01,ERP,adurand,admin\n"
                                                        "p.leroy@medsecure.example,present,,,,\n"),
                                   _req(), user=None, db=monitored_db)
    assert res == {"created": 1, "updated": 1, "unchanged": 0}
    users = {u["email"]: u for u in await ru.list_si_users(A, user=None, db=monitored_db)}
    assert sorted(users) == ["a.durand@medsecure.example", "c.bernard@partner.example", "p.leroy@medsecure.example"]
    alice = users["a.durand@medsecure.example"]
    assert alice["status"] == "left" and alice["name"] == "Alice Durand"            # no name column: kept
    assert alice["accounts"] == [dict(GH, account="a-durand"), {"perimeter": "ERP", "account": "adurand", "role": "admin"}]


@pytest.mark.asyncio
async def test_an_import_leaves_what_its_empty_cells_do_not_say(monitored_db):
    await _add(monitored_db, email="p.leroy@medsecure.example", name="Paul Leroy", status="left", left_on="2026-10-31",
               accounts=[{"perimeter": "ERP", "account": "pl", "role": "admin"}])
    res = await ru.import_si_users(A, SiUsersImport(csv="email,name,status,left_on,perimeter,account,role\n"
                                                        "p.leroy@medsecure.example,,,,ERP,pl,\n"
                                                        "p.leroy@medsecure.example,,,,medsecure,p-leroy,\n"),
                                   _req(), user=None, db=monitored_db)
    assert res == {"created": 0, "updated": 1, "unchanged": 0}
    paul = (await ru.list_si_users(A, user=None, db=monitored_db))[0]
    assert (paul["name"], paul["status"], paul["left_on"]) == ("Paul Leroy", "left", "2026-10-31")
    assert paul["accounts"] == [{"perimeter": "ERP", "account": "pl", "role": "admin"},
                                {"perimeter": "medsecure", "account": "p-leroy", "role": ""}]


@pytest.mark.asyncio
async def test_an_import_checks_the_status_and_the_date_against_the_project(monitored_db):
    await _add(monitored_db, email="a.durand@medsecure.example")
    with pytest.raises(HTTPException) as e:
        await ru.import_si_users(A, SiUsersImport(csv="email,left_on\na.durand@medsecure.example,2026-11-01\n"),
                                 _req(), user=None, db=monitored_db)
    assert e.value.status_code == 422 and "line 2 (a.durand@medsecure.example): a user who is present" in e.value.detail


@pytest.mark.asyncio
async def test_a_change_ignores_what_it_sends_as_null_but_the_date(monitored_db):
    paul = await _add(monitored_db, email="p.leroy@medsecure.example", status="left", left_on="2026-10-31",
                      accounts=[dict(GH, account="p-leroy")])
    uid = uuid.UUID(paul["id"])
    same = await ru.update_si_user(A, uid, SiUserUpdate(status=None, accounts=None, name="Paul"), _req(),
                                   user=None, db=monitored_db)
    assert (same["status"], same["left_on"], same["accounts"]) == ("left", "2026-10-31", [dict(GH, account="p-leroy")])
    cleared = await ru.update_si_user(A, uid, SiUserUpdate(left_on=None), _req(), user=None, db=monitored_db)
    assert cleared["status"] == "left" and cleared["left_on"] is None


@pytest.mark.asyncio
async def test_an_email_written_meanwhile_is_a_conflict_not_an_error(monitored_db):
    from src.models import SiUser
    await _add(monitored_db, email="a.durand@medsecure.example")
    monitored_db.add(SiUser(id=uuid.uuid4(), project_id=A, email="p.leroy@medsecure.example", accounts=[]))
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
    await _add(monitored_db, email="a.durand@medsecure.example", accounts=[dict(GH, account="a-durand")])
    with pytest.raises(HTTPException) as e:
        await ru.import_si_users(A, SiUsersImport(csv="email,perimeter,account\np.leroy@medsecure.example,medsecure,a-durand\n"),
                                 _req(), user=None, db=monitored_db)
    assert e.value.status_code == 409
    monitored_db.expunge_all()
    assert [u["email"] for u in await ru.list_si_users(A, user=None, db=monitored_db)] == ["a.durand@medsecure.example"]
