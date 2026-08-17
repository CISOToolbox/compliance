import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from routes.internal import _normalize_status, _denormalize_status


class TestNormalizeStatus:
    def test_termine_lowercase(self):
        assert _normalize_status("termine") == "completed"

    def test_termine_capitalized(self):
        assert _normalize_status("Termine") == "completed"

    def test_termine_accented(self):
        assert _normalize_status("Terminé") == "completed"

    def test_completed_passthrough(self):
        assert _normalize_status("completed") == "completed"

    def test_en_cours_snake(self):
        assert _normalize_status("en_cours") == "in_progress"

    def test_en_cours_spaced(self):
        assert _normalize_status("En cours") == "in_progress"

    def test_en_cours_lower_spaced(self):
        assert _normalize_status("en cours") == "in_progress"

    def test_planifie_lowercase(self):
        assert _normalize_status("planifie") == "planned"

    def test_planifie_capitalized(self):
        assert _normalize_status("Planifie") == "planned"

    def test_planifie_accented(self):
        assert _normalize_status("Planifié") == "planned"

    def test_non_demarre_snake(self):
        assert _normalize_status("non_demarre") == "not_started"

    def test_non_demarre_spaced(self):
        assert _normalize_status("Non demarre") == "not_started"

    def test_non_demarre_accented(self):
        assert _normalize_status("Non démarré") == "not_started"

    def test_unknown_passthrough(self):
        assert _normalize_status("something_else") == "something_else"

    def test_empty_string(self):
        assert _normalize_status("") == ""


class TestDenormalizeStatus:
    def test_completed(self):
        assert _denormalize_status("completed") == "Terminé"

    def test_in_progress(self):
        assert _denormalize_status("in_progress") == "En cours"

    def test_planned(self):
        assert _denormalize_status("planned") == "Planifié"

    def test_not_started(self):
        assert _denormalize_status("not_started") == "Non démarré"

    def test_unknown_passthrough(self):
        assert _denormalize_status("custom") == "custom"

    def test_empty_string(self):
        assert _denormalize_status("") == ""

    def test_roundtrip_completed(self):
        assert _normalize_status(_denormalize_status("completed")) == "completed"

    def test_roundtrip_in_progress(self):
        assert _normalize_status(_denormalize_status("in_progress")) == "in_progress"

    def test_roundtrip_planned(self):
        assert _normalize_status(_denormalize_status("planned")) == "planned"

    def test_roundtrip_not_started(self):
        assert _normalize_status(_denormalize_status("not_started")) == "not_started"
