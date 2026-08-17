import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from routes.internal import _posture_label


class TestPostureLabel:
    def test_none_returns_empty(self):
        assert _posture_label(None) == ""

    def test_zero_is_faible(self):
        assert _posture_label(0) == "Faible"

    def test_below_40_is_faible(self):
        assert _posture_label(39) == "Faible"

    def test_at_40_is_modere(self):
        assert _posture_label(40) == "Modéré"

    def test_below_60_is_modere(self):
        assert _posture_label(59) == "Modéré"

    def test_at_60_is_bon(self):
        assert _posture_label(60) == "Bon"

    def test_below_80_is_bon(self):
        assert _posture_label(79) == "Bon"

    def test_at_80_is_excellent(self):
        assert _posture_label(80) == "Excellent"

    def test_100_is_excellent(self):
        assert _posture_label(100) == "Excellent"
