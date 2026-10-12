# Architecture

NeuroLearner is a static web app (no build step, no server) plus an optional Python desktop controller. Both share one set of gesture rules.

## Layout

```
web/
  index.html          page, overlays, settings dialog
  css/style.css       layout, high-contrast theme, phone layout
  js/
    main.js           wiring: input → game → render, calibration flow, settings, summary
    gestures.js       pure gesture rules (tested)
    game.js           pure game rules: levels, physics, scoring (tested)
    render.js         canvas drawing + camera preview
    tracker.js        MediaPipe Hand Landmarker wrapper (lazy-loaded)
    audio.js          synthesized sounds + speech prompts
    settings.js       per-child profiles in localStorage
  tests/              node:test unit tests + Playwright end-to-end test
python/
  neurolearner/gestures.py    mirror of gestures.js (tested against the same poses)
  neurolearner/controller.py  webcam → MediaPipe → keyboard presses
fixtures/
  make_fixtures.py    generates synthetic 21-point hand poses
  hands.json          poses shared by the JS and Python tests
```

## Data flow, one frame

1. `tracker.detect()` runs Hand Landmarker on the newest video frame (VIDEO mode, one hand, GPU delegate with CPU fallback).
2. `mirror()` flips x so the game behaves like a mirror.
3. `palmCenter()` averages the wrist and four knuckles. That point is steadier than a fingertip.
4. `ema()` smooths x. `steer()` maps it through the child's calibrated range and still zone to [-1, 1].
5. The active jump detector (`pinch`, `open` or `raise`) turns the hand shape into a single jump event using hysteresis and a refractory period.
6. Keys, touch and switch input are merged in, then `stepGame()` advances the simulation and emits events (`jump`, `correct`, `wrong`, `respawn`, `level`) that drive sound, speech and messages.

## Gesture rules

All measures are divided by hand size (wrist to middle knuckle), so they don't change as a child leans toward or away from the camera.

| Measure | Definition | Typical values |
|---|---|---|
| `pinchRatio` | thumb tip to index tip ÷ hand size | under 0.35 pinched, over 0.55 apart |
| `openness` | mean of (wrist→fingertip ÷ wrist→knuckle) over four fingers | about 0.8 fist, about 1.9 open |
| raise signal | (resting palm height − current height) ÷ hand size | over 0.6 raised |

Each detector must be **re-armed** (the signal goes back past a second, looser threshold) before it can fire again, and it can't fire twice within 600 ms.

## Game rules

- Levels are generated from a seed with a small deterministic PRNG, so a level can be reproduced exactly.
- Gap sizes depend on the difficulty setting. A test checks that every gap in 200 seeds at each difficulty is within 90% of the analytic jump reach.
- "Game speed" scales the simulation clock rather than the physics constants, so slow mode has exactly the same jumpable gaps, just more time to react.
- Coyote time (160 ms) and a jump buffer (180 ms) forgive late and early jumps.

## Privacy

- Camera frames go from `getUserMedia` straight into MediaPipe's WebAssembly runtime in the same tab. Nothing is sent over the network.
- The only network requests are the page itself and the MediaPipe library and model from jsDelivr and Google's model bucket, loaded once and only if camera mode is chosen.
- Profiles and calibration live in `localStorage`. The session summary is only copied when an adult clicks the button.

## Testing strategy

- **Unit (node:test):** gesture and game rules, both pure.
- **Cross-language parity:** the JS and Python suites assert the same expectations on the same fixture poses.
- **End-to-end (Playwright):** drives the real page. Camera mode uses Chromium's fake webcam and intercepts the MediaPipe module with a stand-in that replays fixture poses. That exercises calibration, steering, jump detection and the preview through `main.js`, without needing a real hand in CI.
- Real MediaPipe accuracy isn't tested in CI. It's checked by playing the live demo.
