# NeuroLearner: Product Requirements

**Owner:** Tanya Hemdev · **Status:** v1.0 shipped (prototype, not yet piloted) · **Last updated:** October 2026

## Problem

Most learning games assume a child can hold a controller, press small buttons quickly, or tap precisely. Kids with motor differences (cerebral palsy, muscular weakness, tremor, limited range of motion) are locked out. Adaptive controllers exist, but they cost money, need setup, and still ask for a specific physical action.

During my 2024 internship at TherapyTales, a speech and swallow therapy clinic in Mumbai, I saw the gap between how carefully therapy adapts to each child and how little everyday learning tools do.

## Users

| User | Needs |
|---|---|
| **Child player** (roughly 4 to 10) | Play with the movement they have; never feel they "failed"; clear, spoken prompts |
| **Therapist or special-ed teacher** | Tune difficulty and gestures per child quickly; see why a gesture didn't register; a simple record of each session |
| **Parent** | Works on the laptop they already own; nothing to install; no data leaving the house |

## Goals

1. A child can play with only a webcam and a small, comfortable hand movement.
2. An adult can adapt the game to a specific child in under a minute.
3. No part of the experience punishes a child for a missed jump or a wrong answer.
4. Nothing leaves the device: no accounts, no uploads, no analytics.

## Non-goals (for v1)

- Clinical claims. This is a learning game, not a therapy or diagnostic tool.
- Multiplayer, accounts, or cloud sync.
- Curriculum beyond letter, number and color recognition.

## Requirements

### P0, all shipped in v1.0

| # | Requirement | How v1.0 meets it |
|---|---|---|
| 1 | Steer with hand position | Palm center → calibrated range → steering in [-1, 1] |
| 2 | Calibrate to the child's comfortable range | 5-second sweep, 5th to 95th percentile, minimum range enforced |
| 3 | At least three jump gestures | Pinch, open hand, raise hand |
| 4 | Robust to tremor and hovering | Still zone, EMA smoothing, hysteresis, 600 ms refractory period |
| 5 | Play without a camera | Keys, touch buttons, click or tap, single switch with Auto-walk |
| 6 | No fail states | Respawn on the last safe platform; wrong bubbles bounce; hint glow |
| 7 | Accessible presentation | High contrast, reduced motion, spoken prompts, labeled color bubbles, DOM HUD for screen readers |
| 8 | On-device only | MediaPipe runs in WebAssembly in the browser; settings in localStorage |

### P1, shipped in v1.0

- Per-child profiles
- Session summary (stars, wrong touches, median time to find, minutes played) with copy-to-clipboard
- Live camera preview with the tracked hand, steering position and a jump meter
- Desktop Python controller that maps gestures to keyboard presses for other games

### P2, next

- Clinician-adjustable thresholds per gesture (today they're fixed defaults)
- Head-movement steering for children with limited hand use
- More content packs (shapes, sight words, Hindi letters)
- Progress over time across sessions (still on-device)

## Success metrics

There's no pilot data yet. [METRICS.md](METRICS.md) defines what a pilot should measure and what "good" would look like before anyone treats the numbers as evidence.

## Risks

| Risk | Mitigation |
|---|---|
| Poor lighting breaks tracking | Live preview with fps and detection time; keyboard and switch fallback always available |
| Gesture thresholds don't fit a specific child | Three gestures to choose from, still zone, and calibration; per-child tuning is next on the list |
| Frustration from missed jumps | Coyote time (160 ms) and a jump buffer (180 ms) forgive late and early timing; small gaps by default |
| Privacy concerns about a camera | All processing on-device, said plainly on the start screen; no network calls after the model loads |
