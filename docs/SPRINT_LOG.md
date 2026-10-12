# Build Log

What actually happened, in order. (An earlier version of this file described sprints for a different concept. It was replaced in October 2026.)

## 2024: origin

- Interned at TherapyTales, Mumbai. Saw the gap between adaptive therapy and non-adaptive learning tools. This became the problem statement in the [PRD](PRD.md).

## August 2026: documentation

- Wrote the first README and planning docs for the repo. That version described an adaptive-learning concept for ADHD and dyslexia, not the gesture game, and had no code.

## October 2026: v1.0, the working game

**Goal:** a playable, tested gesture platformer that anyone can open from a link.

Built:
- Gesture engine (`gestures.js`): palm tracking, calibration, still zone, three jump detectors with hysteresis
- Game engine (`game.js`): seeded levels, physics with coyote time and a jump buffer, respawn instead of failure, learning targets
- Browser app: MediaPipe Hand Landmarker on-device, camera preview with a jump meter, settings and per-child profiles, keyboard/touch/switch input, auto-walk, high contrast, reduced motion, speech prompts
- Python desktop controller that mirrors the gesture rules and presses keys
- Tests: JS unit tests, Python unit tests on shared fixture poses, Playwright end-to-end tests including camera mode
- CI on every push; the demo deploys to GitHub Pages

Decisions:
- **No build step.** Plain ES modules keep the demo hostable anywhere and easy to read.
- **Game speed scales time, not physics.** The first version scaled jump strength, which made the biggest gaps impossible to clear in slow mode. Found while checking jump reach; now guarded by a test.
- **A fist counts as a pinch.** Closing the hand brings thumb and index together. Kept on purpose, because many kids find a fist easier than a precise pinch.

## Next

- Clinician walkthroughs and a supervised pilot ([plan](USER_RESEARCH.md#research-plan))
- Per-gesture threshold tuning in Settings
- Head-movement steering
