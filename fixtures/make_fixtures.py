"""Generate synthetic hand poses shared by the JavaScript and Python tests.

Both implementations of the gesture rules (web/js/gestures.js and
python/neurolearner/gestures.py) are tested against these same poses, so
the browser game and the desktop controller cannot quietly drift apart.

Poses are built from a simple 2D hand model in "hand units" (wrist to middle
knuckle = 1), then scaled and placed in normalized image coordinates the way
MediaPipe reports them. Run:  python fixtures/make_fixtures.py
"""

import json
import math
from pathlib import Path

# Knuckle (MCP) positions in hand units, y negative = up in the image.
MCP = {"index": (-0.35, -0.95), "middle": (-0.10, -1.00), "ring": (0.15, -0.95), "pinky": (0.38, -0.85)}
FINGER_ORDER = ["index", "middle", "ring", "pinky"]
FINGER_DIR = {"index": -0.12, "middle": -0.03, "ring": 0.06, "pinky": 0.16}  # slight fan
FINGER_LEN = {"index": 0.95, "middle": 1.0, "ring": 0.92, "pinky": 0.75}


def finger_points(name, curled):
    mx, my = MCP[name]
    length = FINGER_LEN[name]
    if not curled:
        dx = math.sin(FINGER_DIR[name])
        dy = -math.cos(FINGER_DIR[name])
        return [(mx, my), (mx + dx * length * 0.45, my + dy * length * 0.45),
                (mx + dx * length * 0.75, my + dy * length * 0.75), (mx + dx * length, my + dy * length)]
    # Curled: the finger folds forward and back toward the palm.
    return [(mx, my), (mx, my - 0.30), (mx + 0.02, my - 0.10), (mx + 0.03, my + 0.18)]


def thumb_points(mode):
    if mode == "open":
        return [(-0.30, -0.22), (-0.58, -0.42), (-0.78, -0.60), (-0.95, -0.76)]
    if mode == "tucked":
        return [(-0.30, -0.22), (-0.45, -0.45), (-0.38, -0.62), (-0.22, -0.70)]
    raise ValueError(mode)


def build(pose):
    pts = [(0.0, 0.0)]  # wrist
    if pose == "open":
        pts += thumb_points("open")
        for f in FINGER_ORDER:
            pts += finger_points(f, curled=False)
    elif pose == "fist":
        pts += thumb_points("tucked")
        for f in FINGER_ORDER:
            pts += finger_points(f, curled=True)
    elif pose == "pinch":
        # Index finger bends down so its tip meets the thumb tip; others stay open.
        thumb = thumb_points("open")
        thumb[3] = (-0.72, -1.05)
        pts += thumb
        mx, my = MCP["index"]
        pts += [(mx, my), (mx - 0.20, my - 0.32), (mx - 0.33, my - 0.25), (-0.70, -1.10)]
        for f in FINGER_ORDER[1:]:
            pts += finger_points(f, curled=False)
    else:
        raise ValueError(pose)
    assert len(pts) == 21
    return pts


def place(points, cx, cy, scale):
    return [{"x": round(cx + x * scale, 5), "y": round(cy + y * scale, 5), "z": 0.0} for x, y in points]


def main():
    out = {"description": __doc__.strip().splitlines()[0], "poses": []}
    for pose in ["open", "fist", "pinch"]:
        for cx, cy, scale in [(0.5, 0.65, 0.16), (0.3, 0.7, 0.10), (0.72, 0.6, 0.22)]:
            out["poses"].append({
                "name": f"{pose}@{cx},{cy}x{scale}",
                "pose": pose,
                "landmarks": place(build(pose), cx, cy, scale),
            })
    path = Path(__file__).with_name("hands.json")
    path.write_text(json.dumps(out, indent=1) + "\n")
    print(f"wrote {len(out['poses'])} poses to {path}")


if __name__ == "__main__":
    main()
