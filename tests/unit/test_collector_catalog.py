"""FEAT-73 lot 1a — the collector catalog shipped with the module.

One file per provider (`src/collection/catalog_files/<provider>.json`): the rule of
each collector, its version, what it reads, the permissions it needs, its
retention profile, and the requirements it brings evidence to. What is tested
here: the files load and hold together, every requirement they name exists in
the frameworks shipped with the module, and the AWS reads are reads."""
import json
import os
import re
import sys
from pathlib import Path

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.collection.catalog import CatalogError, load_catalog, parse_catalog, unavailable  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
REFS = {p.stem: {m["ref"] for m in json.loads(p.read_text())["measures"]}
        for p in (ROOT / "referentiels").glob("*.json") if "measures" in json.loads(p.read_text())}


def test_both_providers_load_with_their_collectors():
    cat = load_catalog()
    assert sorted(cat.providers) == ["aws", "github"]
    assert [c["code"] for c in cat.collectors("aws")] == [f"AWS-{i:02d}" for i in range(1, 15)]
    assert [c["code"] for c in cat.collectors("github")] == [f"GH-{i:02d}" for i in range(1, 8)]
    assert cat.collector("GH-03")["provider"] == "github"


def test_every_requirement_named_exists_in_its_framework():
    for c in load_catalog().collectors():
        keys = c["requirement_keys"]
        assert keys, c["code"]
        for key in keys:
            fw, ref = key.split(":", 1)
            assert ref in REFS[fw], (c["code"], key)


def test_a_soc2_criterion_stands_for_its_points_of_focus():
    keys = load_catalog().collector("AWS-02")["requirement_keys"]
    focus = {f"soc2:{r}" for r in REFS["soc2"] if r.startswith("CC6.1.")}
    assert focus and focus <= set(keys)
    assert "soc2:CC6.1" not in keys                  # not a requirement of the shipped framework
    assert {"iso:A.5.17", "iso:A.8.5", "anssi:13", "nis2:21.2.j"} <= set(keys)


def test_profiles_and_params_are_sound():
    cat = load_catalog()
    for c in cat.collectors():
        p = c["retention"]
        assert 0 < p["daily_days"] <= p["weekly_days"] <= p["monthly_days"] <= 3650, c["code"]
        for prm in c.get("params", []):
            assert prm["min"] <= prm["default"] <= prm["max"], (c["code"], prm["id"])
    assert cat.collector("AWS-10")["retention"] == {"daily_days": 35, "weekly_days": 92, "monthly_days": 1096}


def test_every_connection_has_a_secret_field_and_says_what_it_needs():
    for name, prov in load_catalog().providers.items():
        fields = prov["connection"]["fields"]
        assert any(f["secret"] for f in fields), name
        assert prov["connection"]["permissions"], name
        for f in fields:
            assert f["label"]["en"] and f["label"]["fr"], (name, f["id"])


def test_the_aws_reads_are_reads():
    """Get / List / Describe, or one of the two calls a read needs that the
    naming does not say: the credential report is generated before it is
    read, and the role is assumed before anything."""
    allowed = {"iam:GenerateCredentialReport"}
    for c in load_catalog().collectors("aws"):
        for op in c["reads"]:
            assert op in allowed or re.match(r"^[a-z0-9-]+:(Get|List|Describe)", op), (c["code"], op)


@pytest.mark.parametrize("breakage, message", [
    (lambda d: d["collectors"].append(dict(d["collectors"][0])), "duplicate"),
    (lambda d: d["collectors"][0].update(retention_profile="nowhere"), "profile"),
    (lambda d: d["collectors"][0]["requirements"].update(iso=["Z.9.9"]), "Z.9.9"),
    (lambda d: d["collectors"][0]["requirements"].update(soc2=["CC99.9"]), "CC99.9"),
    (lambda d: d["connection"].update(fields=[f for f in d["connection"]["fields"] if not f["secret"]]), "secret"),
    (lambda d: d["collectors"][0].update(needs=["badges"]), "badges"),
    (lambda d: d["collectors"][0].update(needs="users"), "needs"),
])
def test_a_broken_catalog_is_refused(breakage, message):
    data = json.loads((ROOT / "src" / "collection" / "catalog_files" / "aws.json").read_text())
    breakage(data)
    with pytest.raises(CatalogError, match=message):
        parse_catalog([data], REFS)


def test_only_the_collectors_whose_needs_the_project_meets_are_available():
    cat = load_catalog()
    assert unavailable(cat.collector("GH-04")) and unavailable(cat.collector("GH-03")) is None
    assert [c["code"] for c in cat.collectors() if c not in cat.available()] == ["GH-04"]
    assert unavailable(cat.collector("GH-04"), frozenset({"users"})) is None
    assert cat.available(frozenset({"users"})) == cat.collectors()
