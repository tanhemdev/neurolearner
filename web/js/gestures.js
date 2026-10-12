// Gesture logic for NeuroLearner.
// Pure functions only (no DOM, no camera) so every rule here is unit-tested in
// web/tests and mirrored line-for-line in python/neurolearner/gestures.py.
//
// Landmarks follow MediaPipe's 21-point hand model, normalized to [0, 1]:
//   0 wrist | 1-4 thumb | 5-8 index | 9-12 middle | 13-16 ring | 17-20 pinky
// Each landmark is {x, y, z?}. y grows downward (image coordinates).

export const WRIST = 0;
export const THUMB_TIP = 4;
export const INDEX_MCP = 5;
export const INDEX_TIP = 8;
export const MIDDLE_MCP = 9;
export const RING_MCP = 13;
export const PINKY_MCP = 17;

// [mcp, pip, tip] for the four non-thumb fingers
export const FINGERS = [
  [5, 6, 8],
  [9, 10, 12],
  [13, 14, 16],
  [17, 18, 20],
];

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// Center of the palm: mean of the wrist and the four finger knuckles.
// More stable than a fingertip, which shakes when fingers move.
export function palmCenter(lm) {
  const ids = [WRIST, INDEX_MCP, MIDDLE_MCP, RING_MCP, PINKY_MCP];
  let x = 0;
  let y = 0;
  for (const i of ids) {
    x += lm[i].x;
    y += lm[i].y;
  }
  return { x: x / ids.length, y: y / ids.length };
}

// Wrist-to-middle-knuckle length. Dividing by this makes every threshold
// independent of how far the child sits from the camera.
export function handScale(lm) {
  return Math.max(dist(lm[WRIST], lm[MIDDLE_MCP]), 1e-6);
}

// Thumb tip to index tip, in hand-lengths. ~0.1-0.3 pinched, ~0.8+ apart.
export function pinchRatio(lm) {
  return dist(lm[THUMB_TIP], lm[INDEX_TIP]) / handScale(lm);
}

// How open the hand is: mean of (wrist->tip) / (wrist->knuckle) across the
// four fingers. ~1.0-1.3 for a fist, ~1.8-2.2 for an open hand.
export function openness(lm) {
  let sum = 0;
  for (const [mcp, , tip] of FINGERS) {
    sum += dist(lm[WRIST], lm[tip]) / Math.max(dist(lm[WRIST], lm[mcp]), 1e-6);
  }
  return sum / FINGERS.length;
}

// Mirror landmarks horizontally so moving your hand right moves the player right
// when the camera image is shown like a mirror (selfie view).
export function mirror(lm) {
  return lm.map((p) => ({ ...p, x: 1 - p.x }));
}

export function ema(prev, next, alpha) {
  if (prev === null || prev === undefined || Number.isNaN(prev)) return next;
  return prev + alpha * (next - prev);
}

export function percentile(values, p) {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = clamp((p / 100) * (sorted.length - 1), 0, sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

// Calibration: the child moves their hand to whatever is comfortable on the
// left and right. We keep the 5th-95th percentile so one stray frame does not
// stretch the range. A small comfortable range still gives full control.
export const MIN_RANGE = 0.04;

export function calibrate(samplesX, samplesY = []) {
  const lo = percentile(samplesX, 5);
  const hi = percentile(samplesX, 95);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    return { minX: 0.3, maxX: 0.7, neutralY: 0.5, ok: false };
  }
  let minX = lo;
  let maxX = hi;
  if (maxX - minX < MIN_RANGE) {
    const mid = (minX + maxX) / 2;
    minX = mid - MIN_RANGE / 2;
    maxX = mid + MIN_RANGE / 2;
  }
  const neutralY = samplesY.length ? percentile(samplesY, 50) : 0.5;
  return { minX, maxX, neutralY, ok: hi - lo >= MIN_RANGE };
}

// Map a palm x-position to a steering value in [-1, 1] using the calibrated
// range. Inside the dead zone the player stands still, which matters for
// children with tremor who cannot hold a hand perfectly steady.
export function steer(x, cal, deadZone = 0.15) {
  const span = Math.max(cal.maxX - cal.minX, 1e-6);
  const t = clamp((x - cal.minX) / span, 0, 1);
  const s = 2 * t - 1;
  const dz = clamp(deadZone, 0, 0.9);
  if (Math.abs(s) <= dz) return 0;
  return (Math.sign(s) * (Math.abs(s) - dz)) / (1 - dz);
}

// Jump detection. Each detector is a small state machine with hysteresis
// (separate "on" and "re-arm" thresholds) plus a refractory period, so a
// shaky hand hovering near a threshold does not fire ten jumps in a row.
export const JUMP_DEFAULTS = {
  pinch: { on: 0.35, rearm: 0.55 },
  open: { on: 1.65, rearm: 1.35 },
  raise: { on: 0.6, rearm: 0.3 },
  refractoryMs: 600,
};

export function createJumpDetector(mode = 'pinch', opts = {}) {
  const cfg = { ...JUMP_DEFAULTS, ...opts };
  const th = { ...JUMP_DEFAULTS[mode], ...(opts[mode] || {}) };
  if (!['pinch', 'open', 'raise'].includes(mode)) {
    throw new Error(`unknown jump mode: ${mode}`);
  }
  let armed = false;
  let lastFire = -Infinity;

  // Returns the gesture's raw signal: higher means "closer to jumping".
  function signal(lm, cal) {
    if (mode === 'pinch') return -pinchRatio(lm); // smaller gap -> jump
    if (mode === 'open') return openness(lm);
    // raise: how far the palm is above the calibrated resting height, in hand-lengths
    return ((cal?.neutralY ?? 0.5) - palmCenter(lm).y) / handScale(lm);
  }

  function update(lm, nowMs, cal) {
    const v = signal(lm, cal);
    const on = mode === 'pinch' ? -th.on : th.on;
    const rearm = mode === 'pinch' ? -th.rearm : th.rearm;
    if (!armed) {
      if (v <= rearm) armed = true;
      return false;
    }
    if (v >= on && nowMs - lastFire >= cfg.refractoryMs) {
      armed = false;
      lastFire = nowMs;
      return true;
    }
    return false;
  }

  function reset() {
    armed = false;
    lastFire = -Infinity;
  }

  return { mode, update, reset, signal };
}

// 0 = hand is resting, 1 = the jump is about to fire. Drives the on-screen
// jump meter so a clinician can see how close a child's gesture gets.
export function jumpProgress(mode, signalValue, opts = {}) {
  const th = { ...JUMP_DEFAULTS[mode], ...(opts[mode] || {}) };
  const on = mode === 'pinch' ? -th.on : th.on;
  const rearm = mode === 'pinch' ? -th.rearm : th.rearm;
  return clamp((signalValue - rearm) / (on - rearm), 0, 1);
}
