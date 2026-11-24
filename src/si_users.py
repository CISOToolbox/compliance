"""FEAT-74 — the users of a project: what a user entry may hold.

Pure functions, no database: the routes (src/routes/si_users.py) check every
entry here, typed in the form or read from a CSV file, before writing it.
A user has accounts, as in Access: a perimeter (a GitHub organization, an
application…), an account name on it, and an optional role.
"""
from __future__ import annotations

import csv
import io
import re
from datetime import date

STATUSES = ("present", "left")
USER_FIELDS = ("email", "name", "status", "left_on")
ACCOUNT_FIELDS = ("perimeter", "account", "role")
CSV_COLUMNS = USER_FIELDS + ACCOUNT_FIELDS
MAX_CSV_BYTES = 1_000_000
MAX_CSV_ROWS = 5000
MAX_ACCOUNTS = 100

_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class UserError(ValueError):
    pass


def _line(value: object, field: str, limit: int) -> str:
    text = str(value or "").strip()
    if "\r" in text or "\n" in text:
        raise UserError(f"{field} must be on one line")
    if len(text) > limit:
        raise UserError(f"{field} is longer than {limit} characters")
    return text


def checked_account(given: dict) -> dict:
    perimeter = _line(given.get("perimeter"), "perimeter", 100)
    account = _line(given.get("account"), "account", 255)
    if not perimeter or not account:
        raise UserError("an account needs a perimeter and an account name")
    return {"perimeter": perimeter, "account": account, "role": _line(given.get("role"), "role", 255)}


def _key(account: dict) -> tuple:
    return account["perimeter"].lower(), account["account"].lower()


def checked_accounts(given: object) -> list[dict]:
    if not isinstance(given, list):
        raise UserError("accounts must be a list")
    if len(given) > MAX_ACCOUNTS:
        raise UserError(f"a user has at most {MAX_ACCOUNTS} accounts")
    out, seen = [], set()
    for a in given:
        if not isinstance(a, dict):
            raise UserError("an account is {perimeter, account, role}")
        acc = checked_account(a)
        if _key(acc) in seen:
            raise UserError(f"the account {acc['account']} on {acc['perimeter']} is listed twice")
        seen.add(_key(acc))
        out.append(acc)
    return out


def checked_user(given: dict, current: dict | None = None) -> dict:
    """The entry to write: `given` over `current` (a change sends only the
    fields it changes), normalised. A user who is present has no date of
    departure; a user who left may have one."""
    merged = {**(current or {}), **{k: v for k, v in given.items() if k in USER_FIELDS + ("accounts",)}}
    email = _line(merged.get("email"), "email", 255).lower()
    if not _EMAIL.match(email):
        raise UserError(f"invalid email: {email or '(empty)'}")
    status = _line(merged.get("status"), "status", 10).lower() or "present"
    if status not in STATUSES:
        raise UserError(f"status must be present or left, not {status}")
    left_on = _line(merged.get("left_on"), "left_on", 10) or None
    if status == "present" and "left_on" not in given:
        left_on = None                                  # back: the old date of departure goes
    if left_on is not None:
        if status != "left":
            raise UserError("a user who is present has no date of departure")
        try:
            date.fromisoformat(left_on)
        except ValueError:
            raise UserError(f"left_on must be a date (YYYY-MM-DD), not {left_on}") from None
    return {"email": email, "name": _line(merged.get("name"), "name", 255), "status": status,
            "left_on": left_on, "accounts": checked_accounts(merged.get("accounts") or [])}


def merge_accounts(current: list[dict], added: list[dict]) -> list[dict]:
    """`current` with `added`: an account already there (same perimeter and
    name, in any case) takes the new role when one is given, and keeps its
    own otherwise; none is removed."""
    out = [dict(a) for a in current]
    index = {_key(a): i for i, a in enumerate(out)}
    for a in added:
        if _key(a) in index:
            if a["role"]:
                out[index[_key(a)]]["role"] = a["role"]
        else:
            index[_key(a)] = len(out)
            out.append(dict(a))
    return out


def _cell(field: str, value: str) -> str:
    """One user cell of a CSV line, checked on its own; whether the user's
    status and date agree is checked against what the project holds."""
    value = _line(value, field, 255)
    if field == "status":
        value = value.lower()
        if value not in STATUSES:
            raise UserError(f"status must be present or left, not {value}")
    elif field == "left_on":
        try:
            date.fromisoformat(value)
        except ValueError:
            raise UserError(f"left_on must be a date (YYYY-MM-DD), not {value}") from None
    return value


def parse_users_csv(text: str) -> list[dict]:
    """The users of a CSV file: for each, its email, its first line, the user
    cells the file fills (`given`, never an empty cell) and its accounts,
    each checked.

    The first line names the columns: `email` required; `name`, `status`,
    `left_on`, and `perimeter`, `account`, `role` for an account, in any
    order. A user with several accounts takes one line per account; the user
    cells of those lines agree, or are left empty. Refused as a whole, with
    every faulty line, if one is wrong: an import is all or nothing."""
    if len(text.encode("utf-8")) > MAX_CSV_BYTES:
        raise UserError(f"the file is larger than {MAX_CSV_BYTES // 1000} kB")
    text = text.lstrip("﻿")
    try:
        dialect = csv.Sniffer().sniff(text.split("\n", 1)[0], delimiters=",;\t")
    except csv.Error:
        dialect = csv.excel
    reader = csv.DictReader(io.StringIO(text), dialect=dialect)
    header = [(h or "").strip().lower() for h in (reader.fieldnames or [])]
    if "email" not in header:
        raise UserError("the first line must name the columns, with at least email")
    unknown = [h for h in header if h and h not in CSV_COLUMNS]
    if unknown:
        raise UserError(f"unknown columns: {', '.join(unknown)} (expected {', '.join(CSV_COLUMNS)})")
    reader.fieldnames = header
    users: dict[str, dict] = {}
    first: dict[str, int] = {}
    errors = []
    lines = 0
    for raw in reader:
        n = reader.line_num                         # the file's own line: blank lines are skipped, not counted
        raw = {k: (v or "").strip() for k, v in raw.items() if k}
        if not any(raw.values()):
            continue
        lines += 1
        if lines > MAX_CSV_ROWS:
            raise UserError(f"the file has more than {MAX_CSV_ROWS} lines")
        try:
            account = checked_account(raw) if raw.get("perimeter") or raw.get("account") or raw.get("role") else None
            email = _line(raw.get("email"), "email", 255).lower()
            if not _EMAIL.match(email):
                raise UserError(f"invalid email: {email or '(empty)'}")
            cells = {k: _cell(k, raw[k]) for k in USER_FIELDS[1:] if raw.get(k)}
            if email in users:
                given = users[email]["given"]
                for k, v in cells.items():
                    if k in given and given[k] != v:
                        raise UserError(f"{k} differs from line {first[email]} for {email}")
                    given[k] = v
            else:
                users[email] = {"email": email, "line": n, "given": cells, "accounts": []}
                first[email] = n
            if account:
                user = users[email]
                if any(_key(a) == _key(account) for a in user["accounts"]):
                    raise UserError(f"the account {account['account']} on {account['perimeter']} is listed twice")
                user["accounts"].append(account)
        except UserError as exc:
            errors.append(f"line {n}: {exc}")
    if errors:
        raise UserError("; ".join(errors[:20]) + (f" (and {len(errors) - 20} more)" if len(errors) > 20 else ""))
    return list(users.values())


def account_conflict(users: list[dict]) -> tuple[dict, str, str] | None:
    """An account two users of the project both hold, with their emails:
    an account belongs to one user."""
    owners: dict[tuple, str] = {}
    for u in users:
        for a in u.get("accounts") or []:
            other = owners.setdefault(_key(a), u["email"])
            if other != u["email"]:
                return a, other, u["email"]
    return None

