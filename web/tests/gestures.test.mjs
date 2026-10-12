// Same poses and the same expectations as python/tests/test_gestures.py.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as g from '../js/gestures.js';

const POSES = JSON.parse(readFileSync(new URL('../../fixtures/hands.json', import.meta.url))).poses;
const pose = (kind, i = 0) => POSES.filter((p) => p.pose === kind)[i].landmarks;
const close = (a, b, rel = 1e-3) => Math.abs(a - b) <= rel * Math.max(Math.abs(a), Math.abs(b));

test('openness separates an open hand from a fist at every size and position', () => {
  for (let i = 0; i < 3; i++) {
    assert.ok(g.openness(pose('open', i)) > g.JUMP_DEFAULTS.open.on);
    assert.ok(g.openness(pose('fist', i)) < g.JUMP_DEFAULTS.open.rearm);
  }
});

test('pinch ratio separates a pinch from an open hand', () => {
  for (let i = 0; i < 3; i++) {
    assert.ok(g.pinchRatio(pose('pinch', i)) < g.JUMP_DEFAULTS.pinch.on);
    assert.ok(g.pinchRatio(pose('open', i)) > g.JUMP_DEFAULTS.pinch.rearm);
  }
});

test('measures do not depend on distance from the camera', () => {
  assert.ok(close(g.openness(pose('open', 1)), g.openness(pose('open', 2))));
  assert.ok(close(g.pinchRatio(pose('open', 1)), g.pinchRatio(pose('open', 2))));
});

test('mirror flips x only', () => {
  const lm = pose('open');
  g.mirror(lm).forEach((p, i) => {
    assert.ok(Math.abs(p.x - (1 - lm[i].x)) < 1e-12);
    assert.equal(p.y, lm[i].y);
  });
});

test('calibration ignores a stray frame and enforces a minimum range', () => {
  const xs = Array.from({ length: 100 }, (_, i) => 0.4 + 0.002 * i).concat([0.99]);
  const cal = g.calibrate(xs, Array(101).fill(0.6));
  assert.ok(cal.maxX < 0.7);
  assert.equal(cal.ok, true);
  const tiny = g.calibrate([0.5, 0.505, 0.51]);
  assert.ok(Math.abs(tiny.maxX - tiny.minX - g.MIN_RANGE) < 1e-12);
  assert.equal(tiny.ok, false);
  assert.equal(g.calibrate([]).ok, false);
});

test('steer maps the calibrated range to [-1, 1] with a still zone', () => {
  const cal = { minX: 0.4, maxX: 0.6 };
  assert.equal(g.steer(0.4, cal), -1);
  assert.equal(g.steer(0.6, cal), 1);
  assert.equal(g.steer(0.5, cal), 0);
  assert.equal(g.steer(0.51, cal, 0.15), 0);
  assert.equal(g.steer(0.9, cal), 1);
  const mid = g.steer(0.55, cal);
  assert.ok(mid > 0 && mid < 1);
});

test('pinch detector fires once per pinch', () => {
  const d = g.createJumpDetector('pinch');
  assert.equal(d.update(pose('pinch'), 0), false);
  assert.equal(d.update(pose('open'), 100), false);
  assert.equal(d.update(pose('pinch'), 200), true);
  assert.equal(d.update(pose('pinch'), 900), false);
  assert.equal(d.update(pose('open'), 1000), false);
  assert.equal(d.update(pose('pinch'), 1100), true);
});

test('refractory period blocks rapid repeats', () => {
  const d = g.createJumpDetector('open');
  d.update(pose('fist'), 0);
  assert.equal(d.update(pose('open'), 10), true);
  d.update(pose('fist'), 20);
  assert.equal(d.update(pose('open'), 30), false);
  assert.equal(d.update(pose('open'), 700), true);
});

test('raise detector uses the calibrated resting height', () => {
  const d = g.createJumpDetector('raise');
  const rest = pose('open');
  const cal = { neutralY: g.palmCenter(rest).y };
  const lifted = rest.map((p) => ({ ...p, y: p.y - 0.15 }));
  assert.equal(d.update(rest, 0, cal), false);
  assert.equal(d.update(lifted, 50, cal), true);
  assert.equal(g.jumpProgress('raise', d.signal(rest, cal)), 0);
  assert.equal(g.jumpProgress('raise', d.signal(lifted, cal)), 1);
});

test('a fist also counts as a pinch (deliberate)', () => {
  assert.ok(g.pinchRatio(pose('fist')) < g.JUMP_DEFAULTS.pinch.on);
});

test('unknown jump modes are rejected', () => {
  assert.throws(() => g.createJumpDetector('wave'));
});
