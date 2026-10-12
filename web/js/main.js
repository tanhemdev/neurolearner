import { createGame, stepGame, summarize } from './game.js';
import { render, renderPreview, setupCanvas, COLOR_VALUES } from './render.js';
import {
  mirror, palmCenter, ema, calibrate, steer as steerFromX, createJumpDetector, jumpProgress,
} from './gestures.js';
import { sounds, speak, promptFor } from './audio.js';
import { loadProfiles, saveProfiles, activeProfile, DEFAULTS } from './settings.js';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const ctx = setupCanvas(canvas);
const preview = $('preview');
const pctx = preview.getContext('2d');
const video = $('video');

let store = loadProfiles();
let settings = activeProfile(store);
let game = null;
let mode = null; // 'camera' | 'keys'
let tracker = null;
let detector = null;
let paused = true;
let smoothX = null;
let lastHandMs = 0;
let view = { landmarks: null, steer: 0, jumpLevel: 0, jumpFired: false, cal: null };
const keys = { left: false, right: false, jumpEdge: false };
let touchDir = 0;
let fps = 0;
let frames = 0;
let fpsT = performance.now();

// ---------- UI helpers ----------
let toastTimer = null;
function toast(text, ms = 1600) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

function applyVisualSettings() {
  document.body.classList.toggle('contrast', settings.highContrast);
}

function updateHud() {
  const label = $('target-label');
  const t = game?.target ?? '?';
  label.textContent = t;
  if (settings.content === 'colors' && COLOR_VALUES[t]) {
    label.style.background = COLOR_VALUES[t];
  } else {
    label.style.background = '';
  }
  $('stars').textContent = String(game?.stars ?? 0);
  $('stars').setAttribute('aria-label', `${game?.stars ?? 0} stars collected`);
}

function announceTarget() {
  if (!game?.target) return;
  updateHud();
  speak(promptFor(game.target, settings.content), { enabled: settings.speech });
}

// ---------- Game lifecycle ----------
function newGame() {
  game = createGame({
    seed: Math.floor(Math.random() * 1e9),
    difficulty: settings.difficulty,
    content: settings.content,
    speed: Number(settings.speed),
  });
  updateHud();
}

function startPlaying() {
  ['start', 'calibrate', 'pause'].forEach((id) => { $(id).hidden = true; });
  paused = false;
  if (!game) newGame();
  announceTarget();
  canvas.focus?.();
}

function pause() {
  if (!game) return;
  paused = true;
  const s = summarize(game);
  const rows = [
    ['Level', s.level],
    ['Stars', s.stars],
    ['Wrong bubbles touched', s.wrongTouches],
    ['Jumps', s.jumps],
    ['Pop-backs after falling', s.respawns],
    ['Median time to find (s)', s.medianSecondsToFind ?? '-'],
    ['Minutes played', (s.playedSeconds / 60).toFixed(1)],
  ];
  if (mode === 'camera') rows.push(['Hand tracking', `${fps} fps`]);
  $('summary').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  $('pause').hidden = false;
  $('resume').focus();
}

// ---------- Camera mode ----------
async function startCamera() {
  const status = $('start-status');
  try {
    const { createTracker } = await import('./tracker.js');
    tracker = await createTracker(video, { onStatus: (m) => { status.textContent = m; } });
  } catch (err) {
    console.error(err);
    status.textContent = err?.name === 'NotAllowedError'
      ? 'Camera permission was blocked. You can still play with keys or a switch.'
      : 'Could not start hand tracking on this device. You can still play with keys or a switch.';
    return;
  }
  mode = 'camera';
  settings.input = 'camera';
  detector = createJumpDetector(settings.jumpGesture);
  $('preview-wrap').hidden = false;
  $('start').hidden = true;
  showCalibration();
}

function showCalibration() {
  paused = true;
  $('calibrate').hidden = false;
  $('cal-skip').hidden = !settings.calibration;
  $('cal-count').textContent = '';
  $('cal-start').disabled = false;
  $('cal-start').focus();
}

async function runCalibration() {
  $('cal-start').disabled = true;
  const xs = [];
  const ys = [];
  const t0 = performance.now();
  const duration = 5000;
  const range = $('cal-range');
  const dot = $('cal-dot');
  await new Promise((resolve) => {
    function tick(now) {
      const r = tracker.detect(now);
      if (r?.landmarks) {
        const pc = palmCenter(mirror(r.landmarks));
        xs.push(pc.x);
        ys.push(pc.y);
        dot.style.left = `calc(${(pc.x * 100).toFixed(1)}% - 11px)`;
        const lo = Math.min(...xs);
        const hi = Math.max(...xs);
        range.style.left = `${lo * 100}%`;
        range.style.width = `${(hi - lo) * 100}%`;
      }
      view.landmarks = r?.landmarks ?? null;
      renderPreview(pctx, video, view);
      const left = Math.ceil((duration - (now - t0)) / 1000);
      $('cal-count').textContent = left > 0 ? `${left}` : '';
      if (now - t0 < duration) requestAnimationFrame(tick);
      else resolve();
    }
    requestAnimationFrame(tick);
  });
  if (xs.length < 10) {
    $('cal-count').textContent = "I couldn't see your hand. Try more light, or move a little further from the camera.";
    $('cal-start').disabled = false;
    return;
  }
  const cal = calibrate(xs, ys);
  settings.calibration = cal;
  persist();
  $('cal-count').textContent = cal.ok ? 'Got it!' : 'Got it! Small movements will be enough.';
  setTimeout(startPlaying, 700);
}

// ---------- Settings ----------
function persist() {
  store.profiles[store.active] = { ...settings };
  saveProfiles(store);
}

function fillSettingsForm() {
  const f = $('settings-form');
  const sel = $('s-profile');
  sel.innerHTML = Object.keys(store.profiles)
    .map((n) => `<option ${n === store.active ? 'selected' : ''}>${n.replace(/</g, '&lt;')}</option>`)
    .join('');
  for (const el of f.elements) {
    if (!el.name || !(el.name in settings)) continue;
    if (el.type === 'radio') el.checked = settings[el.name] === el.value;
    else if (el.type === 'checkbox') el.checked = Boolean(settings[el.name]);
    else el.value = String(settings[el.name]);
  }
}

function readSettingsForm() {
  const f = $('settings-form');
  const next = { ...settings };
  for (const el of f.elements) {
    if (!el.name || !(el.name in DEFAULTS)) continue;
    if (el.type === 'radio') { if (el.checked) next[el.name] = el.value; }
    else if (el.type === 'checkbox') next[el.name] = el.checked;
    else if (el.type === 'range') next[el.name] = Number(el.value);
    else next[el.name] = el.value;
  }
  return next;
}

function openSettings() {
  if (game && !paused) pause();
  fillSettingsForm();
  $('settings').showModal();
}

$('settings').addEventListener('close', () => {
  if ($('settings').returnValue !== 'save') return;
  const before = settings;
  settings = readSettingsForm();
  persist();
  applyVisualSettings();
  if (detector && before.jumpGesture !== settings.jumpGesture) {
    detector = createJumpDetector(settings.jumpGesture);
  }
  const levelChanged = before.content !== settings.content
    || before.difficulty !== settings.difficulty
    || before.speed !== settings.speed;
  if (game && levelChanged) {
    newGame();
    toast('Settings saved. Starting a fresh level.');
  } else {
    toast('Settings saved');
  }
  updateHud();
});

$('s-profile').addEventListener('change', (e) => {
  store.active = e.target.value;
  settings = activeProfile(store);
  saveProfiles(store);
  fillSettingsForm();
});

$('s-add').addEventListener('click', () => {
  const name = $('s-newname').value.trim();
  if (!name) return;
  store.profiles[name] = { ...DEFAULTS, name };
  store.active = name;
  settings = activeProfile(store);
  saveProfiles(store);
  $('s-newname').value = '';
  fillSettingsForm();
});

$('s-recal').addEventListener('click', () => {
  $('settings').close('cancel');
  if (mode === 'camera') showCalibration();
  else toast('Calibration is for hand play. Pick "Play with my hand" first.');
});

// ---------- Input: keys, switches, touch ----------
const LEFT = new Set(['ArrowLeft', 'a', 'A']);
const RIGHT = new Set(['ArrowRight', 'd', 'D']);
const JUMP = new Set([' ', 'Enter', 'ArrowUp', 'w', 'W']);

window.addEventListener('keydown', (e) => {
  if ($('settings').open) return;
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
    if (game && !paused) { pause(); e.preventDefault(); }
    return;
  }
  if (paused) return;
  if (LEFT.has(e.key)) keys.left = true;
  else if (RIGHT.has(e.key)) keys.right = true;
  else if (JUMP.has(e.key)) { if (!e.repeat) keys.jumpEdge = true; }
  else return;
  e.preventDefault();
});
window.addEventListener('keyup', (e) => {
  if (LEFT.has(e.key)) keys.left = false;
  if (RIGHT.has(e.key)) keys.right = false;
});

// Tapping or clicking the game also jumps: many adaptive switches act as a mouse click.
canvas.addEventListener('pointerdown', () => { if (!paused) keys.jumpEdge = true; });

for (const btn of document.querySelectorAll('.tc[data-dir]')) {
  const dir = Number(btn.dataset.dir);
  btn.addEventListener('pointerdown', (e) => { e.preventDefault(); touchDir = dir; });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) {
    btn.addEventListener(ev, () => { if (touchDir === dir) touchDir = 0; });
  }
}
$('tc-jump').addEventListener('pointerdown', (e) => { e.preventDefault(); if (!paused) keys.jumpEdge = true; });

// ---------- Buttons ----------
$('play-camera').addEventListener('click', () => { sounds.unlock(); startCamera(); });
$('play-keys').addEventListener('click', () => {
  sounds.unlock();
  mode = 'keys';
  settings.input = 'keys';
  $('touch-controls').hidden = false;
  startPlaying();
});
$('cal-start').addEventListener('click', runCalibration);
$('cal-skip').addEventListener('click', startPlaying);
$('resume').addEventListener('click', startPlaying);
$('restart').addEventListener('click', () => { newGame(); startPlaying(); });
for (const id of ['btn-settings', 'pause-settings', 'start-settings']) $(id).addEventListener('click', openSettings);
$('copy-summary').addEventListener('click', async () => {
  const s = { profile: store.active, date: new Date().toISOString().slice(0, 10), input: mode, ...summarize(game) };
  try {
    await navigator.clipboard.writeText(JSON.stringify(s, null, 2));
    toast('Summary copied');
  } catch {
    toast('Copy is blocked here. Select the numbers above instead.');
  }
});

// ---------- Main loop ----------
let last = performance.now();
function frame(now) {
  const dt = now - last;
  last = now;

  frames += 1;
  if (now - fpsT >= 1000) {
    fps = Math.round((frames * 1000) / (now - fpsT));
    frames = 0;
    fpsT = now;
  }

  let steer = 0;
  let jump = false;

  if (mode === 'camera' && tracker) {
    const r = tracker.detect(now);
    view.jumpFired = false;
    if (r?.landmarks) {
      lastHandMs = now;
      const lm = mirror(r.landmarks);
      smoothX = ema(smoothX, palmCenter(lm).x, settings.smoothing);
      const cal = settings.calibration || calibrate([]);
      steer = steerFromX(smoothX, cal, settings.deadZone);
      if (!paused && detector.update(lm, now, cal)) {
        jump = true;
        view.jumpFired = true;
      }
      view = {
        ...view,
        landmarks: r.landmarks,
        steer,
        cal,
        jumpLevel: jumpProgress(settings.jumpGesture, detector.signal(lm, cal)),
      };
    } else {
      view.landmarks = null;
      if (!paused && now - lastHandMs > 1500 && now - lastHandMs < 1600) toast('Show me your hand');
    }
    $('preview-stats').textContent = r ? `${fps} fps · ${r.detectMs.toFixed(0)} ms` : '';
    renderPreview(pctx, video, view);
  }

  steer += (keys.right ? 1 : 0) - (keys.left ? 1 : 0) + touchDir;
  if (settings.autoWalk && !keys.left && touchDir >= 0) steer = Math.max(steer, 1);
  if (keys.jumpEdge) { jump = true; keys.jumpEdge = false; }

  if (game && !paused) {
    stepGame(game, { steer, jump }, dt);
    for (const ev of game.events.splice(0)) {
      if (settings.sound && sounds[ev]) sounds[ev]();
      if (ev === 'correct') { toast('Yes!', 900); announceTarget(); }
      if (ev === 'wrong') toast('Not that one. Keep looking!', 1100);
      if (ev === 'level') { toast(`Level ${game.levelNumber}!`, 1600); announceTarget(); }
    }
  }
  if (!game) newGame();
  render(ctx, game, settings);
  requestAnimationFrame(frame);
}

// Expose state for the end-to-end test (read-only use).
window.__neurolearner = { get game() { return game; }, get paused() { return paused; } };

applyVisualSettings();
// Respect the operating system's reduced-motion setting by default.
if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) settings.reducedMotion = true;
requestAnimationFrame(frame);
