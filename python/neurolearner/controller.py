"""Desktop hand controller: webcam -> MediaPipe -> keyboard presses.

Turns hand movement into the arrow keys and space bar, so a child can play
the NeuroLearner browser game (or any keyboard game) hands-free, using the
same gesture rules as the browser version.

    python -m neurolearner --jump pinch
    python -m neurolearner --jump open --dead-zone 0.25 --camera 1

Press C in the preview window to recalibrate, Q or Esc to quit.
"""

from __future__ import annotations

import argparse
import time
import urllib.request
from pathlib import Path

from . import gestures as g

MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
    "hand_landmarker/float16/1/hand_landmarker.task"
)
MODEL_PATH = Path.home() / ".cache" / "neurolearner" / "hand_landmarker.task"


def ensure_model(path: Path = MODEL_PATH) -> Path:
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        print(f"Downloading MediaPipe hand model to {path} ...")
        urllib.request.urlretrieve(MODEL_URL, path)
    return path


class KeyOutput:
    """Holds left/right keys down while steering and taps space to jump."""

    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.held: set[str] = set()
        if not dry_run:
            from pynput.keyboard import Controller, Key  # imported late: optional dependency

            self.kb = Controller()
            self.keys = {"left": Key.left, "right": Key.right, "jump": Key.space}

    def _press(self, name):
        if not self.dry_run:
            self.kb.press(self.keys[name])

    def _release(self, name):
        if not self.dry_run:
            self.kb.release(self.keys[name])

    def steer(self, value: float, threshold: float = 0.2):
        want = "right" if value > threshold else "left" if value < -threshold else None
        for name in ("left", "right"):
            if name != want and name in self.held:
                self._release(name)
                self.held.discard(name)
        if want and want not in self.held:
            self._press(want)
            self.held.add(want)

    def jump(self):
        self._press("jump")
        time.sleep(0.03)
        self._release("jump")

    def release_all(self):
        for name in list(self.held):
            self._release(name)
        self.held.clear()


def run(args) -> None:
    import cv2
    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions
    from mediapipe.tasks.python.vision import HandLandmarker, HandLandmarkerOptions, RunningMode

    options = HandLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(ensure_model())),
        running_mode=RunningMode.VIDEO,
        num_hands=1,
    )
    landmarker = HandLandmarker.create_from_options(options)
    cap = cv2.VideoCapture(args.camera)
    out = KeyOutput(dry_run=args.dry_run)
    detector = g.JumpDetector(args.jump)
    cal = None
    cal_x: list[float] = []
    cal_y: list[float] = []
    cal_until = time.monotonic() + 5  # calibrate for the first 5 seconds
    smooth_x = None
    t0 = time.monotonic()

    try:
        while cap.isOpened():
            ok, frame = cap.read()
            if not ok:
                break
            frame = cv2.flip(frame, 1)  # mirror view
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            now_ms = (time.monotonic() - t0) * 1000
            result = landmarker.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb), int(now_ms))
            h, w = frame.shape[:2]
            label = "no hand"

            if result.hand_landmarks:
                # The frame is already flipped, so landmarks are in mirror space.
                lm = g.to_points(result.hand_landmarks[0])
                pc = g.palm_center(lm)
                for p in lm:
                    cv2.circle(frame, (int(p.x * w), int(p.y * h)), 3, (255, 229, 0), -1)

                if time.monotonic() < cal_until:
                    cal_x.append(pc.x)
                    cal_y.append(pc.y)
                    label = f"calibrating {cal_until - time.monotonic():.0f}s: move left and right"
                else:
                    if cal is None:
                        cal = g.calibrate(cal_x, cal_y)
                    smooth_x = g.ema(smooth_x, pc.x, args.smoothing)
                    s = g.steer(smooth_x, cal, args.dead_zone)
                    out.steer(s)
                    if detector.update(lm, now_ms, cal):
                        out.jump()
                        label = "JUMP"
                    else:
                        label = f"steer {s:+.2f}  jump {detector.progress(lm, cal):.0%}"
            else:
                out.release_all()

            cv2.putText(frame, label, (12, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            cv2.imshow("NeuroLearner controller (C = recalibrate, Q = quit)", frame)
            key = cv2.waitKey(1) & 0xFF
            if key in (ord("q"), 27):
                break
            if key == ord("c"):
                cal, cal_x, cal_y = None, [], []
                cal_until = time.monotonic() + 5
    finally:
        out.release_all()
        cap.release()
        cv2.destroyAllWindows()
        landmarker.close()


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description="Play keyboard games with hand gestures.")
    ap.add_argument("--jump", choices=["pinch", "open", "raise"], default="pinch")
    ap.add_argument("--dead-zone", type=float, default=0.15)
    ap.add_argument("--smoothing", type=float, default=0.35)
    ap.add_argument("--camera", type=int, default=0)
    ap.add_argument("--dry-run", action="store_true", help="track and show gestures without pressing keys")
    run(ap.parse_args(argv))


if __name__ == "__main__":
    main()
