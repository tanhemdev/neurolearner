// End-to-end browser test: plays the real page in headless Chromium.
//  1. keyboard mode: move, jump, pause, change settings
//  2. camera mode: Chromium's fake webcam + a stand-in MediaPipe module that
//     replays the poses in fixtures/hands.json, so calibration, steering and
//     pinch-to-jump run through main.js exactly as with a real hand.
// Run: npx playwright install chromium && node web/tests/e2e.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  const path = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/\/$/, '/index.html'));
  try {
    res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' });
    res.end(await readFile(path));
  } catch {
    res.writeHead(404).end();
  }
}).listen(0);
const url = `http://localhost:${server.address().port}/`;

const poses = JSON.parse(readFileSync(new URL('../../fixtures/hands.json', import.meta.url))).poses;
const OPEN = poses.find((p) => p.pose === 'open').landmarks;
const PINCH = poses.find((p) => p.pose === 'pinch').landmarks;
const fakeMediaPipe = `
const OPEN = ${JSON.stringify(OPEN)}, PINCH = ${JSON.stringify(PINCH)};
const t0 = performance.now();
export const FilesetResolver = { forVisionTasks: async () => ({}) };
export class HandLandmarker {
  static async createFromOptions() { return new HandLandmarker(); }
  detectForVideo(video, now) {
    const t = (now - t0) / 1000, mode = window.__fakeMode || 'sweep';
    const dx = mode === 'sweep' ? 0.18 * Math.sin(t * 2.2) : -0.2;
    const base = mode !== 'sweep' && t % 2 < 0.3 ? PINCH : OPEN;
    return { landmarks: [base.map((p) => ({ x: p.x + dx, y: p.y, z: 0 }))] };
  }
  close() {}
}`;

const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const errors = [];
const watch = (page) => {
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
};
const state = (page) => page.evaluate(() => ({
  x: window.__neurolearner.game.player.x,
  jumps: window.__neurolearner.game.stats.jumps,
  paused: window.__neurolearner.paused,
}));

try {
  // 1. Keyboard mode, desktop and phone widths
  for (const viewport of [{ width: 1280, height: 800 }, { width: 400, height: 800 }]) {
    const page = await browser.newPage({ viewport });
    watch(page);
    await page.goto(url);
    await page.click('#play-keys');
    const before = await state(page);
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(700);
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');
    const after = await state(page);
    assert.ok(after.x - before.x > 100, `player should move right (${viewport.width}px)`);
    assert.equal(after.jumps, 1);
    await page.keyboard.press('Escape');
    assert.equal((await state(page)).paused, true);
    await page.click('#pause-settings');
    await page.check('input[name=highContrast]');
    await page.click('#s-save');
    await page.waitForFunction(() => document.body.classList.contains('contrast'), null, { timeout: 3000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.equal(overflow, 0, 'no horizontal scroll');
    await page.close();
    console.log(`ok keyboard mode @${viewport.width}px`);
  }

  // 2. Camera mode with a stand-in hand tracker
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  watch(page);
  await page.route('https://cdn.jsdelivr.net/**/vision_bundle.mjs', (r) =>
    r.fulfill({ contentType: 'text/javascript', body: fakeMediaPipe, headers: { 'access-control-allow-origin': '*' } }));
  await page.goto(url);
  await page.click('#play-camera');
  await page.waitForSelector('#calibrate:not([hidden])');
  await page.click('#cal-start');
  await page.waitForFunction(() => window.__neurolearner.paused === false, null, { timeout: 12000 });
  const cal = await page.evaluate(() => JSON.parse(localStorage.getItem('neurolearner.profiles.v1')).profiles['Player 1'].calibration);
  assert.ok(cal.ok && cal.maxX - cal.minX > 0.2, 'calibration should capture the sweep');
  await page.evaluate(() => { window.__fakeMode = 'right'; });
  const before = await state(page);
  await page.waitForTimeout(4200);
  const after = await state(page);
  assert.ok(after.x - before.x > 200, 'holding the hand right should steer right');
  assert.ok(after.jumps >= 1, 'pinching should jump');
  console.log(`ok camera mode: calibrated ${cal.minX.toFixed(2)}-${cal.maxX.toFixed(2)}, moved ${Math.round(after.x - before.x)}px, ${after.jumps} pinch jumps`);
  await page.close();

  assert.deepEqual(errors, [], 'no console errors');
  console.log('all e2e checks passed');
} finally {
  await browser.close();
  server.close();
}
