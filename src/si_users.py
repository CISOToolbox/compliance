"""FEAT-74 — the users of a project: what a user entry may hold.

Pure functions, no database: the routes (src/routes/si_users.py) check every
entry here, typed in the form or read from a CSV file, before writing it.
The identity fields are those of Pilot's directory (nom, prenom, email,
statut recrutement | actif | inactif, type de contrat interne | externe |
alternant | stagiaire), so that a sync from Pilot maps them one to one. The accounts are those of Access: a perimeter (GitHub, an
application…), an account name on it, and an optional role.
"""
from __future__ import annotations

import csv
import io
import re
from datetime import date

STATUTS = ("recrutement", "actif", "inactif")
CONTRATS = ("interne", "externe", "alternant", "stagiaire")
USER_FIELDS = ("email", "nom", "prenom", "statut", "type_contrat", "date_depart")
ACCOUNT_FIELDS = ("perimetre", "compte", "role")
CSV_COLUMNS = USER_FIELDS + ACCOUNT_FIELDS
MAX_CSV_BYTES = 1_000_000
MAX_CSV_ROWS = 5000
MAX_ACCOUNTS = 100

_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
# A perimeter name is shown and picked as a whole: the socle picker splits a
# value on these.
_PERIMETER_FORBIDDEN = (",", " - ")


class UserError(ValueError):
    pass


def _checked_date(value: str, field: str) -> str:
    """A date written YYYY-MM-DD, nothing else: fromisoformat also reads
    20261031 or 2026-W44-1, which a date field could not show back."""
    try:
        if not _DATE.match(value):
            raise ValueError
        return date.fromisoformat(value).isoformat()
    except ValueError:
        raise UserError(f"{field} must be a date (YYYY-MM-DD), not {value}") from None


def _line(value: object, field: str, limit: int) -> str:
    text = str(value or "").strip()
    if "\r" in text or "\n" in text:
        raise UserError(f"{field} must be on one line")
    if len(text) > limit:
        raise UserError(f"{field} is longer than {limit} characters")
    return text


def checked_account(given: dict) -> dict:
    perimetre = _line(given.get("perimetre"), "perimetre", 100)
    compte = _line(given.get("compte"), "compte", 255)
    if not perimetre or not compte:
        raise UserError("an account needs a perimeter and an account name")
    if any(c in perimetre for c in _PERIMETER_FORBIDDEN):
        raise UserError(f"a perimeter name holds neither a comma nor \" - \": {perimetre}")
    return {"perimetre": perimetre, "compte": compte, "role": _line(given.get("role"), "role", 255)}


def _key(account: dict) -> tuple:
    return account["perimetre"].lower(), account["compte"].lower()


def checked_accounts(given: object) -> list[dict]:
    if not isinstance(given, list):
        raise UserError("comptes must be a list")
    if len(given) > MAX_ACCOUNTS:
        raise UserError(f"a user has at most {MAX_ACCOUNTS} accounts")
    out, seen = [], set()
    for a in given:
        if not isinstance(a, dict):
            raise UserError("an account is {perimetre, compte, role}")
        acc = checked_account(a)
        if _key(acc) in seen:
            raise UserError(f"the account {acc['compte']} on {acc['perimetre']} is listed twice")
        seen.add(_key(acc))
        out.append(acc)
    return out


def checked_user(given: dict, current: dict | None = None) -> dict:
    """The entry to write: `given` over `current` (a change sends only the
    fields it changes), normalised. Only an `inactif` user has a date of
    departure."""
    merged = {**(current or {}), **{k: v for k, v in given.items() if k in USER_FIELDS + ("comptes",)}}
    email = _line(merged.get("email"), "email", 255).lower()
    if not _EMAIL.match(email):
        raise UserError(f"invalid email: {email or '(empty)'}")
    if "statut" in given and not _line(given.get("statut"), "statut", 20):
        raise UserError("statut cannot be empty")
    statut = _line(merged.get("statut"), "statut", 20).lower() or "actif"
    if statut not in STATUTS:
        raise UserError(f"statut must be one of {', '.join(STATUTS)}, not {statut}")
    if "type_contrat" in given and not _line(given.get("type_contrat"), "type_contrat", 20):
        raise UserError("type_contrat cannot be empty")
    type_contrat = _line(merged.get("type_contrat"), "type_contrat", 20).lower() or "interne"
    if type_contrat not in CONTRATS:
        raise UserError(f"type_contrat must be one of {', '.join(CONTRATS)}, not {type_contrat}")
    date_depart = _line(merged.get("date_depart"), "date_depart", 10) or None
    if statut != "inactif" and "date_depart" not in given:
        date_depart = None                              # back: the old date of departure goes
    if date_depart is not None:
        if statut != "inactif":
            raise UserError("only an inactif user has a date of departure")
        date_depart = _checked_date(date_depart, "date_depart")
    return {"email": email, "nom": _line(merged.get("nom"), "nom", 255), "prenom": _line(merged.get("prenom"), "prenom", 255),
            "statut": statut, "type_contrat": type_contrat, "date_depart": date_depart,
            "comptes": checked_accounts(merged.get("comptes") or [])}


IDENTITY = ("email", "nom", "prenom", "statut", "type_contrat", "date_depart")


def pilot_identity(person: dict) -> dict:
    """A person of Pilot's directory as the identity of a user: Pilot's
    fields one to one, checked like an entry typed here."""
    if not isinstance(person, dict):
        raise UserError("personnel must be an object")
    statut = str(person.get("statut") or "actif").strip().lower()
    contrat = str(person.get("type_contrat") or "").strip().lower()
    if statut == "externe":                             # a Pilot not yet updated: an active external contract
        statut, contrat = "actif", contrat or "externe"
    entry = checked_user({"email": person.get("email"), "nom": person.get("nom"), "prenom": person.get("prenom"),
                          "statut": statut, "type_contrat": contrat or "interne",
                          "date_depart": person.get("date_depart") if statut == "inactif" else None})
    return {k: entry[k] for k in IDENTITY}


def identity_changes(given: dict, current: dict) -> list[str]:
    """The identity fields `given` would change on `current`: what a user
    who comes from Pilot cannot have changed here."""
    after = checked_user(given, current)
    return [k for k in IDENTITY if after[k] != current.get(k)]

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
    if field == "statut":
        value = value.lower()
        if value not in STATUTS:
            raise UserError(f"statut must be one of {', '.join(STATUTS)}, not {value}")
    elif field == "type_contrat":
        value = value.lower()
        if value not in CONTRATS:
            raise UserError(f"type_contrat must be one of {', '.join(CONTRATS)}, not {value}")
    elif field == "date_depart":
        value = _checked_date(value, "date_depart")
    return value


def parse_users_csv(text: str) -> list[dict]:
    """The users of a CSV file: for each, its email, its first line, the user
    cells the file fills (`given`, never an empty cell) and its accounts,
    each checked.

    The first line names the columns: `email` required; `nom`, `prenom`,
    `statut`, `type_contrat`, `date_depart`, and `perimetre`, `compte`, `role` for an
    account, in any order. A user with several accounts takes one line per account; the user
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
            account = checked_account(raw) if any(raw.get(k) for k in ACCOUNT_FIELDS) else None
            email = _line(raw.get("email"), "email", 255).lower()
            if not _EMAIL.match(email):
                raise UserError(f"invalid email: {email or '(empty)'}")
            cells = {k: _cell(k, raw[k]) for k in USER_FIELDS[1:] if raw.get(k)}
            if email in users:
                given = users[email]["given"]
                for k, v in cells.items():
                    if k in given and given[k] != v:
                        raise UserError(f"{k} differs from line {users[email]['line']} for {email}")
                    given[k] = v
            else:
                users[email] = {"email": email, "line": n, "given": cells, "comptes": []}
            if account:
                user = users[email]
                if any(_key(a) == _key(account) for a in user["comptes"]):
                    raise UserError(f"the account {account['compte']} on {account['perimetre']} is listed twice")
                user["comptes"].append(account)
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
        for a in u.get("comptes") or []:
            other = owners.setdefault(_key(a), u["email"])
            if other != u["email"]:
                return a, other, u["email"]
    return None
