"""Gesture rules, checked against the poses shared with the JS tests."""

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "python"))

from neurolearner import gestures as g  # noqa: E402

POSES = json.loads((ROOT / "fixtures" / "hands.json").read_text())["poses"]


def pose(kind, i=0):
    return g.to_points([p for p in POSES if p["pose"] == kind][i]["landmarks"])


def test_fixture_has_all_poses():
    assert {p["pose"] for p in POSES} == {"open", "fist", "pinch"}
    assert all(len(p["landmarks"]) == 21 for p in POSES)


def test_openness_separates_open_hand_from_fist_at_every_size_and_position():
    for i in range(3):
        assert g.openness(pose("open", i)) > g.JUMP_DEFAULTS["open"]["on"]
        assert g.openness(pose("fist", i)) < g.JUMP_DEFAULTS["open"]["rearm"]


def test_pinch_ratio_separates_pinch_from_open_hand():
    for i in range(3):
        assert g.pinch_ratio(pose("pinch", i)) < g.JUMP_DEFAULTS["pinch"]["on"]
        assert g.pinch_ratio(pose("open", i)) > g.JUMP_DEFAULTS["pinch"]["rearm"]


def test_measures_do_not_depend_on_distance_from_camera():
    small, big = pose("open", 1), pose("open", 2)
    assert math.isclose(g.openness(small), g.openness(big), rel_tol=1e-3)
    assert math.isclose(g.pinch_ratio(small), g.pinch_ratio(big), rel_tol=1e-3)


def test_mirror_flips_x_only():
    lm = pose("open")
    m = g.mirror(lm)
    assert all(math.isclose(a.x, 1 - b.x) and a.y == b.y for a, b in zip(m, lm))


def test_calibrate_uses_robust_range_and_enforces_minimum():
    xs = [0.40 + 0.002 * i for i in range(100)] + [0.99]  # one stray frame
    cal = g.calibrate(xs, [0.6] * 101)
    assert cal["maxX"] < 0.7, "a single outlier must not stretch the range"
    assert cal["ok"]
    tiny = g.calibrate([0.5, 0.505, 0.51])
    assert math.isclose(tiny["maxX"] - tiny["minX"], g.MIN_RANGE)
    assert not tiny["ok"]
    assert g.calibrate([])["ok"] is False


def test_steer_maps_range_to_minus_one_plus_one_with_dead_zone():
    cal = {"minX": 0.4, "maxX": 0.6}
    assert g.steer(0.4, cal) == -1
    assert g.steer(0.6, cal) == 1
    assert g.steer(0.5, cal) == 0
    assert g.steer(0.51, cal, dead_zone=0.15) == 0  # tremor stays inside the still zone
    assert g.steer(0.9, cal) == 1  # clamped past the calibrated edge
    assert 0 < g.steer(0.55, cal) < 1


def test_pinch_detector_fires_once_per_pinch():
    d = g.JumpDetector("pinch")
    open_hand, pinch = pose("open"), pose("pinch")
    assert d.update(pinch, 0) is False  # not armed until the hand has been open
    assert d.update(open_hand, 100) is False
    assert d.update(pinch, 200) is True
    assert d.update(pinch, 900) is False  # holding the pinch does not repeat
    assert d.update(open_hand, 1000) is False
    assert d.update(pinch, 1100) is True


def test_refractory_period_blocks_rapid_repeats():
    d = g.JumpDetector("open")
    fist, open_hand = pose("fist"), pose("open")
    d.update(fist, 0)
    assert d.update(open_hand, 10) is True
    d.update(fist, 20)
    assert d.update(open_hand, 30) is False  # within 600 ms
    assert d.update(open_hand, 700) is True


def test_raise_detector_uses_calibrated_resting_height():
    d = g.JumpDetector("raise")
    rest = pose("open")
    cal = {"neutralY": g.palm_center(rest).y}
    lifted = [g.Point(p.x, p.y - 0.15) for p in rest]  # ~1 hand-length up
    assert d.update(rest, 0, cal) is False
    assert d.update(lifted, 50, cal) is True
    assert d.progress(rest, cal) == 0
    assert d.progress(lifted, cal) == 1


def test_fist_also_counts_as_pinch():
    # Deliberate: closing the whole hand brings thumb and index together, and
    # many children find a fist easier than a precise pinch.
    assert g.pinch_ratio(pose("fist")) < g.JUMP_DEFAULTS["pinch"]["on"]
