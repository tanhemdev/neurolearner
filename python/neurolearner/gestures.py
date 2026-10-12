"""Gesture rules for the NeuroLearner desktop controller.

A line-for-line mirror of web/js/gestures.js. Both are tested against the
same poses in fixtures/hands.json, so the browser game and this controller
behave identically. Pure Python (only `math`), so the tests need no camera,
no OpenCV and no MediaPipe.

Landmarks are MediaPipe's 21-point hand model, normalized to [0, 1], given
as objects with .x and .y attributes or as dicts with "x" and "y" keys.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

WRIST, THUMB_TIP, INDEX_MCP, INDEX_TIP, MIDDLE_MCP, RING_MCP, PINKY_MCP = 0, 4, 5, 8, 9, 13, 17
FINGERS = [(5, 6, 8), (9, 10, 12), (13, 14, 16), (17, 18, 20)]  # (mcp, pip, tip)

JUMP_DEFAULTS = {
    "pinch": {"on": 0.35, "rearm": 0.55},
    "open": {"on": 1.65, "rearm": 1.35},
    "raise": {"on": 0.6, "rearm": 0.3},
}
REFRACTORY_MS = 600
MIN_RANGE = 0.04


@dataclass
class Point:
    x: float
    y: float


def _p(pt) -> Point:
    if isinstance(pt, Point):
        return pt
    if isinstance(pt, dict):
        return Point(pt["x"], pt["y"])
    return Point(pt.x, pt.y)


def to_points(landmarks) -> list[Point]:
    return [_p(p) for p in landmarks]


def dist(a: Point, b: Point) -> float:
    return math.hypot(a.x - b.x, a.y - b.y)


def clamp(v: float, lo: float, hi: float) -> float:
    return min(hi, max(lo, v))


def palm_center(lm: list[Point]) -> Point:
    ids = [WRIST, INDEX_MCP, MIDDLE_MCP, RING_MCP, PINKY_MCP]
    return Point(sum(lm[i].x for i in ids) / len(ids), sum(lm[i].y for i in ids) / len(ids))


def hand_scale(lm: list[Point]) -> float:
    return max(dist(lm[WRIST], lm[MIDDLE_MCP]), 1e-6)


def pinch_ratio(lm: list[Point]) -> float:
    return dist(lm[THUMB_TIP], lm[INDEX_TIP]) / hand_scale(lm)


def openness(lm: list[Point]) -> float:
    total = 0.0
    for mcp, _pip, tip in FINGERS:
        total += dist(lm[WRIST], lm[tip]) / max(dist(lm[WRIST], lm[mcp]), 1e-6)
    return total / len(FINGERS)


def mirror(lm: list[Point]) -> list[Point]:
    return [Point(1 - p.x, p.y) for p in lm]


def ema(prev: float | None, nxt: float, alpha: float) -> float:
    if prev is None or math.isnan(prev):
        return nxt
    return prev + alpha * (nxt - prev)


def percentile(values: list[float], p: float) -> float:
    if not values:
        return math.nan
    s = sorted(values)
    idx = clamp(p / 100 * (len(s) - 1), 0, len(s) - 1)
    lo, hi = math.floor(idx), math.ceil(idx)
    return s[lo] + (s[hi] - s[lo]) * (idx - lo)


def calibrate(samples_x: list[float], samples_y: list[float] | None = None) -> dict:
    lo = percentile(samples_x, 5)
    hi = percentile(samples_x, 95)
    if math.isnan(lo) or math.isnan(hi):
        return {"minX": 0.3, "maxX": 0.7, "neutralY": 0.5, "ok": False}
    min_x, max_x = lo, hi
    if max_x - min_x < MIN_RANGE:
        mid = (min_x + max_x) / 2
        min_x, max_x = mid - MIN_RANGE / 2, mid + MIN_RANGE / 2
    neutral_y = percentile(samples_y, 50) if samples_y else 0.5
    return {"minX": min_x, "maxX": max_x, "neutralY": neutral_y, "ok": hi - lo >= MIN_RANGE}


def steer(x: float, cal: dict, dead_zone: float = 0.15) -> float:
    span = max(cal["maxX"] - cal["minX"], 1e-6)
    t = clamp((x - cal["minX"]) / span, 0, 1)
    s = 2 * t - 1
    dz = clamp(dead_zone, 0, 0.9)
    if abs(s) <= dz:
        return 0.0
    return math.copysign(abs(s) - dz, s) / (1 - dz)


@dataclass
class JumpDetector:
    """Hysteresis + refractory period, identical to createJumpDetector() in JS."""

    mode: str = "pinch"
    thresholds: dict = field(default_factory=dict)
    refractory_ms: float = REFRACTORY_MS
    armed: bool = False
    last_fire: float = -math.inf

    def __post_init__(self):
        if self.mode not in JUMP_DEFAULTS:
            raise ValueError(f"unknown jump mode: {self.mode}")
        self.thresholds = {**JUMP_DEFAULTS[self.mode], **self.thresholds}

    def signal(self, lm: list[Point], cal: dict | None = None) -> float:
        if self.mode == "pinch":
            return -pinch_ratio(lm)
        if self.mode == "open":
            return openness(lm)
        neutral = (cal or {}).get("neutralY", 0.5)
        return (neutral - palm_center(lm).y) / hand_scale(lm)

    def _bounds(self) -> tuple[float, float]:
        on, rearm = self.thresholds["on"], self.thresholds["rearm"]
        return (-on, -rearm) if self.mode == "pinch" else (on, rearm)

    def update(self, lm: list[Point], now_ms: float, cal: dict | None = None) -> bool:
        v = self.signal(lm, cal)
        on, rearm = self._bounds()
        if not self.armed:
            if v <= rearm:
                self.armed = True
            return False
        if v >= on and now_ms - self.last_fire >= self.refractory_ms:
            self.armed = False
            self.last_fire = now_ms
            return True
        return False

    def progress(self, lm: list[Point], cal: dict | None = None) -> float:
        on, rearm = self._bounds()
        return clamp((self.signal(lm, cal) - rearm) / (on - rearm), 0, 1)

    def reset(self) -> None:
        self.armed = False
        self.last_fire = -math.inf
