"""FEAT-74 lot 2 — the users of a project follow Pilot's directory: the
changes Pilot broadcasts, the directory read again, and what stays the
module's own (the accounts)."""
import json
import os
import sys
import uuid

import pytest
from fastapi import HTTPException
from starlette.requests import Request

sys.path.insert(0, os.path.dirname(__file__))
from monitoring_helpers import A, B, _req  # noqa: E402
from src import si_users_sync as sync  # noqa: E402
from src.models import Project  # noqa: E402
from src.routes import si_users as ru  # noqa: E402
from src.schemas import SiUserCreate, SiUsersImport, SiUsersSource, SiUserUpdate  # noqa: E402
from src.si_users import UserError, pilot_identity  # noqa: E402

GH = {"perimetre": "GitHub", "role": ""}
ALICE = {"email": "A.Durand@medsecure.example", "nom": "Durand", "prenom": "Alice", "statut": "actif",
         "date_depart": None, "fonction": "Dev", "sync_source": ""}
PAUL = {"email": "p.leroy@medsecure.example", "nom": "Leroy", "prenom": "Paul", "statut": "inactif",
        "date_depart": "2026-10-31"}


async def _follow(db, project=A):
    (await db.get(Project, project)).users_pilot_sync = True
    await db.commit()


async def _users(db, project=A):
    db.expunge_all()
    return {u["email"]: u for u in await ru.list_si_users(project, user=None, db=db)}


async def _change(db, **body):
    counts = await sync.apply_change(db, body)
    await db.commit()
    return counts


# ── A person of Pilot as a user ─────────────────────────────────────────

def test_a_person_of_pilot_maps_one_to_one():
    assert pilot_identity(ALICE) == {"email": "a.durand@medsecure.example", "nom": "Durand", "prenom": "Alice",
                                     "statut": "actif", "date_depart": None}
    assert pilot_identity(PAUL)["date_depart"] == "2026-10-31"
    assert pilot_identity({**PAUL, "statut": "actif"})["date_depart"] is None       # back: no departure
    with pytest.raises(UserError):
        pilot_identity({**ALICE, "statut": "recrutement"})


# ── The changes Pilot broadcasts ────────────────────────────────────────

@pytest.mark.asyncio
async def test_a_change_reaches_only_the_projects_that_follow_pilot(monitored_db):
    await _follow(monitored_db)
    assert (await _change(monitored_db, action="upsert", personnel=ALICE))["created"] == 1
    alice = (await _users(monitored_db))["a.durand@medsecure.example"]
    assert alice["sync_source"] == "pilot" and alice["comptes"] == []
    assert await _users(monitored_db, B) == {}


@pytest.mark.asyncio
async def test_pilot_takes_over_a_user_entered_here_and_keeps_its_accounts(monitored_db):
    await ru.create_si_user(A, SiUserCreate(email="a.durand@medsecure.example", nom="D.",
                                            comptes=[dict(GH, compte="a-durand")]), _req(), user=None, db=monitored_db)
    await _follow(monitored_db)
    await _change(monitored_db, action="upsert", personnel=ALICE)
    alice = (await _users(monitored_db))["a.durand@medsecure.example"]
    assert (alice["nom"], alice["sync_source"], alice["comptes"]) == ("Durand", "pilot", [dict(GH, compte="a-durand")])


@pytest.mark.asyncio
async def test_a_departure_a_rename_and_a_deletion_follow_pilot(monitored_db):
    await _follow(monitored_db)
    await _change(monitored_db, action="upsert", personnel=ALICE)
    await _change(monitored_db, action="upsert", personnel={**ALICE, "statut": "inactif", "date_depart": "2026-11-20"})
    alice = (await _users(monitored_db))["a.durand@medsecure.example"]
    assert (alice["statut"], alice["date_depart"]) == ("inactif", "2026-11-20")
    await _change(monitored_db, action="upsert", personnel={**ALICE, "email": "alice.durand@medsecure.example"},
                  old_email="a.durand@medsecure.example")
    assert list(await _users(monitored_db)) == ["alice.durand@medsecure.example"]
    await _change(monitored_db, action="delete", personnel={"email": "alice.durand@medsecure.example"})
    assert await _users(monitored_db) == {}


@pytest.mark.asyncio
async def test_a_deletion_in_pilot_leaves_a_user_entered_here(monitored_db):
    await ru.create_si_user(A, SiUserCreate(email="p.leroy@medsecure.example"), _req(), user=None, db=monitored_db)
    await _follow(monitored_db)
    assert (await _change(monitored_db, action="delete", personnel={"email": "p.leroy@medsecure.example"}))["deleted"] == 0
    assert list(await _users(monitored_db)) == ["p.leroy@medsecure.example"]


@pytest.mark.asyncio
async def test_a_rename_onto_another_user_of_the_project_is_skipped(monitored_db):
    await ru.create_si_user(A, SiUserCreate(email="alice@medsecure.example"), _req(), user=None, db=monitored_db)
    await _follow(monitored_db)
    await _change(monitored_db, action="upsert", personnel=ALICE)
    counts = await _change(monitored_db, action="upsert", personnel={**ALICE, "email": "alice@medsecure.example"},
                           old_email="a.durand@medsecure.example")
    assert counts["skipped"] == 1
    assert sorted(await _users(monitored_db)) == ["a.durand@medsecure.example", "alice@medsecure.example"]


def _push(body, token=None):
    raw = json.dumps(body).encode()
    headers = [(b"x-service-token", (token or os.environ["SERVICE_TOKEN"]).encode()), (b"content-type", b"application/json")]

    async def receive():
        return {"type": "http.request", "body": raw, "more_body": False}
    return Request({"type": "http", "method": "POST", "path": "/api/internal/personnel-sync", "headers": headers,
                    "query_string": b"", "client": ("127.0.0.1", 1)}, receive)


@pytest.mark.asyncio
async def test_the_broadcast_route_takes_the_service_token_and_a_valid_body(monitored_db, monkeypatch):
    from src.routes import internal
    monkeypatch.setattr(internal, "SERVICE_TOKEN", os.environ["SERVICE_TOKEN"])
    await _follow(monitored_db)
    with pytest.raises(HTTPException) as e:
        await ru.personnel_sync(_push({"action": "upsert", "personnel": ALICE}, token="wrong"), db=monitored_db)
    assert e.value.status_code == 403
    with pytest.raises(HTTPException) as e:
        await ru.personnel_sync(_push({"action": "upsert", "personnel": {**ALICE, "email": "nope"}}), db=monitored_db)
    assert e.value.status_code == 422
    res = await ru.personnel_sync(_push({"action": "upsert", "personnel": ALICE}), db=monitored_db)
    assert res["ok"] is True and res["created"] == 1


# ── What a user from Pilot keeps of its own ─────────────────────────────

async def _from_pilot(db):
    await _follow(db)
    await _change(db, action="upsert", personnel=PAUL)
    return (await _users(db))["p.leroy@medsecure.example"]


@pytest.mark.asyncio
async def test_a_user_from_pilot_changes_only_its_accounts_here(monitored_db):
    paul = await _from_pilot(monitored_db)
    uid = uuid.UUID(paul["id"])
    for change in (SiUserUpdate(nom="Le Roy"), SiUserUpdate(statut="actif"), SiUserUpdate(date_depart=None)):
        with pytest.raises(HTTPException) as e:
            await ru.update_si_user(A, uid, change, _req(), user=None, db=monitored_db)
        assert e.value.status_code == 409 and "Pilot" in e.value.detail
    same = SiUserUpdate(nom="Leroy", prenom="Paul", statut="inactif", date_depart="2026-10-31",
                        comptes=[dict(GH, compte="p-leroy")])                 # what the window sends back
    done = await ru.update_si_user(A, uid, same, _req(), user=None, db=monitored_db)
    assert done["comptes"] == [dict(GH, compte="p-leroy")] and done["sync_source"] == "pilot"
    with pytest.raises(HTTPException) as e:
        await ru.delete_si_user(A, uid, _req(), user=None, db=monitored_db)
    assert e.value.status_code == 409


@pytest.mark.asyncio
async def test_an_import_gives_accounts_to_a_user_from_pilot_but_not_another_identity(monitored_db):
    await _from_pilot(monitored_db)
    with pytest.raises(HTTPException) as e:
        await ru.import_si_users(A, SiUsersImport(csv="email,statut\np.leroy@medsecure.example,actif\n"),
                                 _req(), user=None, db=monitored_db)
    assert e.value.status_code == 422 and "line 2" in e.value.detail and "Pilot" in e.value.detail
    await ru.import_si_users(A, SiUsersImport(csv="email,statut,perimetre,compte\n"
                                                  "p.leroy@medsecure.example,inactif,GitHub,p-leroy\n"),
                             _req(), user=None, db=monitored_db)
    assert (await _users(monitored_db))["p.leroy@medsecure.example"]["comptes"] == [dict(GH, compte="p-leroy")]


# ── Following Pilot, and reading its directory again ────────────────────

@pytest.fixture
def pilot(monkeypatch):
    """Pilot configured, answering the directory the test sets."""
    state = {"directory": [], "calls": 0}
    monkeypatch.setattr(sync, "PILOT_URL", "http://pilot:8000")
    monkeypatch.setattr(sync, "SERVICE_TOKEN", "svc")

    async def fetch():
        state["calls"] += 1
        return state["directory"]
    monkeypatch.setattr(ru, "fetch_directory", fetch)
    return state


@pytest.mark.asyncio
async def test_following_pilot_reads_its_directory_at_once(monitored_db, pilot):
    pilot["directory"] = [ALICE, PAUL]
    res = await ru.set_si_users_source(A, SiUsersSource(pilot_sync=True), _req(), user=None, db=monitored_db)
    assert res["pilot_sync"] is True and res["counts"]["created"] == 2
    users = await _users(monitored_db)
    assert users["p.leroy@medsecure.example"]["statut"] == "inactif"
    assert all(u["sync_source"] == "pilot" for u in users.values())


@pytest.mark.asyncio
async def test_reading_again_deletes_who_left_the_directory_and_keeps_the_rest(monitored_db, pilot):
    pilot["directory"] = [ALICE, PAUL]
    await ru.set_si_users_source(A, SiUsersSource(pilot_sync=True), _req(), user=None, db=monitored_db)
    await ru.create_si_user(A, SiUserCreate(email="svc-ci@medsecure.example"), _req(), user=None, db=monitored_db)
    pilot["directory"] = [{**ALICE, "statut": "recrutement"}]                 # not valid here: left as it is
    res = await ru.sync_si_users(A, _req(), user=None, db=monitored_db)
    assert (res["deleted"], res["invalid"]) == (1, 1)
    assert sorted(await _users(monitored_db)) == ["a.durand@medsecure.example", "svc-ci@medsecure.example"]


@pytest.mark.asyncio
async def test_without_pilot_or_without_following_it_nothing_is_read(monitored_db, pilot, monkeypatch):
    with pytest.raises(HTTPException) as e:
        await ru.sync_si_users(A, _req(), user=None, db=monitored_db)
    assert e.value.status_code == 409
    monkeypatch.setattr(sync, "PILOT_URL", "")
    with pytest.raises(HTTPException) as e:
        await ru.set_si_users_source(A, SiUsersSource(pilot_sync=True), _req(), user=None, db=monitored_db)
    assert e.value.status_code == 409 and pilot["calls"] == 0
    assert (await ru.get_si_users_source(A, user=None, db=monitored_db)) == {"pilot_sync": False, "pilot_available": False}


@pytest.mark.asyncio
async def test_a_directory_that_cannot_be_read_writes_nothing(monitored_db, pilot, monkeypatch):
    async def down():
        raise ConnectionError("refused")
    monkeypatch.setattr(ru, "fetch_directory", down)
    with pytest.raises(HTTPException) as e:
        await ru.set_si_users_source(A, SiUsersSource(pilot_sync=True), _req(), user=None, db=monitored_db)
    assert e.value.status_code == 502
    monitored_db.expunge_all()
    assert (await monitored_db.get(Project, A)).users_pilot_sync is False


@pytest.mark.asyncio
async def test_no_longer_following_pilot_makes_its_users_the_project_s_own(monitored_db, pilot):
    pilot["directory"] = [PAUL]
    await ru.set_si_users_source(A, SiUsersSource(pilot_sync=True), _req(), user=None, db=monitored_db)
    await ru.set_si_users_source(A, SiUsersSource(pilot_sync=False), _req(), user=None, db=monitored_db)
    paul = (await _users(monitored_db))["p.leroy@medsecure.example"]
    assert paul["sync_source"] == ""
    done = await ru.update_si_user(A, uuid.UUID(paul["id"]), SiUserUpdate(nom="Le Roy"), _req(), user=None, db=monitored_db)
    assert done["nom"] == "Le Roy"


@pytest.mark.asyncio
async def test_an_empty_directory_removes_nobody(monitored_db, pilot):
    pilot["directory"] = [PAUL]
    await ru.set_si_users_source(A, SiUsersSource(pilot_sync=True), _req(), user=None, db=monitored_db)
    pilot["directory"] = []
    with pytest.raises(HTTPException) as e:
        await ru.sync_si_users(A, _req(), user=None, db=monitored_db)
    assert e.value.status_code == 409
    assert list(await _users(monitored_db)) == ["p.leroy@medsecure.example"]


@pytest.mark.asyncio
async def test_a_broadcast_is_journaled_only_when_it_changes_something(monitored_db, monkeypatch):
    from sqlalchemy import select
    from src.models import AuditLog
    from src.routes import internal
    monkeypatch.setattr(internal, "SERVICE_TOKEN", os.environ["SERVICE_TOKEN"])

    async def lines():
        return (await monitored_db.execute(select(AuditLog).where(AuditLog.action == "personnel.sync"))).scalars().all()
    await ru.personnel_sync(_push({"action": "upsert", "personnel": ALICE}), db=monitored_db)     # nobody follows
    assert await lines() == []
    await _follow(monitored_db)
    await ru.personnel_sync(_push({"action": "upsert", "personnel": ALICE}), db=monitored_db)
    await ru.personnel_sync(_push({"action": "upsert", "personnel": ALICE}), db=monitored_db)     # nothing new
    logged = await lines()
    assert len(logged) == 1 and logged[0].target == "A.Durand@medsecure.example" and str(A) in str(logged[0].details)


@pytest.mark.asyncio
async def test_reading_again_journals_who_it_deleted(monitored_db, pilot):
    from sqlalchemy import select
    from src.models import AuditLog
    pilot["directory"] = [ALICE, PAUL]
    await ru.set_si_users_source(A, SiUsersSource(pilot_sync=True), _req(), user=None, db=monitored_db)
    pilot["directory"] = [ALICE]
    await ru.sync_si_users(A, _req(), user=None, db=monitored_db)
    line = (await monitored_db.execute(select(AuditLog).where(AuditLog.action == "si_users.sync"))).scalars().one()
    assert "p.leroy@medsecure.example" in str(line.details)


@pytest.mark.asyncio
async def test_an_empty_directory_does_not_stop_a_first_follow(monitored_db, pilot):
    pilot["directory"] = []
    res = await ru.set_si_users_source(A, SiUsersSource(pilot_sync=True), _req(), user=None, db=monitored_db)
    assert res["pilot_sync"] is True and res["counts"]["created"] == 0


class _Stream:
    def __init__(self, chunks):
        self.chunks = chunks

    async def __aenter__(self):
        return self

    async def __aexit__(self, *a):
        return False

    def raise_for_status(self):
        pass

    async def aiter_bytes(self):
        for c in self.chunks:
            yield c


@pytest.mark.asyncio
async def test_the_directory_is_read_up_to_its_cap(monkeypatch):
    import httpx

    class _Client:
        def __init__(self, *a, **k):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *a):
            return False

        def stream(self, *a, **k):
            return _Stream(chunks)
    monkeypatch.setattr(httpx, "AsyncClient", _Client)
    monkeypatch.setattr(sync, "MAX_DIRECTORY_BYTES", 10)
    chunks = [b'[{"email"', b': "a@b.example"}]']
    with pytest.raises(ValueError, match="larger than expected"):
        await sync.fetch_directory()
    monkeypatch.setattr(sync, "MAX_DIRECTORY_BYTES", 1000)
    assert await sync.fetch_directory() == [{"email": "a@b.example"}]
