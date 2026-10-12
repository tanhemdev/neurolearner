# Metrics

There is no pilot data yet. This file says what's measured today and what a pilot should measure, so no number gets quoted before it exists. (An earlier version of this file reported results from a 15-student pilot of a different concept. Those numbers don't apply to this project and were removed.)

## Measured today (engineering)

| What | Where it comes from | Current state |
|---|---|---|
| Automated tests | `npm test`, `pytest python/tests`, `npm run test:e2e` | 23 JS unit tests, 11 Python tests, end-to-end checks in two input modes and two screen widths; all run in CI |
| Jumpable gaps | `game.test.mjs` | Every gap in 200 seeds × 3 difficulties is within 90% of the analytic jump reach |
| Tracking speed | On-screen preview (fps and detection time in ms) | Shown live on each device; depends on hardware and lighting |

## Collected per session, on the device

The pause screen shows these, and **Copy session summary** exports them as JSON:

| Metric | Definition |
|---|---|
| Stars | Correct bubbles collected |
| Wrong bubbles touched | Touches on a bubble that wasn't the target |
| Jumps | Jumps performed (any input) |
| Pop-backs after falling | Respawns |
| Median time to find | Median seconds from a target being announced to it being collected |
| Minutes played | Wall-clock play time |

## Pilot metrics (not yet collected)

To be measured in supervised sessions run by a child's own therapist, with consent:

| Metric | Why it matters | Target to call v1 "working" |
|---|---|---|
| Intended-jump hit rate per gesture | Does the gesture register when the child means it? | ≥ 80% |
| Unintended jumps per minute | False triggers are frustrating | ≤ 1 per minute |
| Setup time (profile + calibration) | Adults need it to be quick | ≤ 60 seconds |
| Session length the child chooses | Engagement without pressure | Tracked, no target |
| Median time to find, across sessions | Learning signal | Trending down across sessions |

The targets are proposals to be agreed with clinicians before a pilot, not results.
