// Draws the game world onto a canvas. Text that matters (the target, stars,
// messages) lives in the DOM instead, so screen readers and zoom work.
import { WORLD } from './game.js';

export const VIEW = { w: 960, h: 540 };

const PALETTES = {
  soft: {
    skyTop: '#bfe3ff',
    skyBottom: '#f4fbff',
    hills: '#cfeccc',
    platform: '#6b4f3a',
    platformTop: '#7cc36b',
    player: '#ff8a3d',
    playerOutline: '#7a3500',
    eye: '#1d1d1d',
    bubble: 'rgba(255,255,255,0.92)',
    bubbleRing: '#2b6cb0',
    bubbleText: '#14213d',
    hint: '#ffd23f',
  },
  contrast: {
    skyTop: '#000000',
    skyBottom: '#000000',
    hills: '#000000',
    platform: '#ffffff',
    platformTop: '#ffffff',
    player: '#ffd400',
    playerOutline: '#ffffff',
    eye: '#000000',
    bubble: '#000000',
    bubbleRing: '#ffffff',
    bubbleText: '#ffffff',
    hint: '#00e5ff',
  },
};

export const COLOR_VALUES = {
  red: '#e63946',
  blue: '#1d70d6',
  yellow: '#ffd23f',
  green: '#2a9d4b',
  purple: '#8e44ad',
  orange: '#f77f00',
};

export function setupCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = VIEW.w * dpr;
  canvas.height = VIEW.h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function render(ctx, game, opts = {}) {
  const pal = opts.highContrast ? PALETTES.contrast : PALETTES.soft;
  const p = game.player;
  const camX = Math.max(0, Math.min(game.level.width - VIEW.w, p.x - VIEW.w * 0.35));

  // Sky
  const g = ctx.createLinearGradient(0, 0, 0, VIEW.h);
  g.addColorStop(0, pal.skyTop);
  g.addColorStop(1, pal.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);

  // Distant hills (parallax), skipped in high-contrast mode to reduce clutter
  if (!opts.highContrast) {
    ctx.fillStyle = pal.hills;
    for (let i = -1; i < 6; i++) {
      const hx = i * 320 - ((camX * 0.3) % 320);
      ctx.beginPath();
      ctx.ellipse(hx + 160, VIEW.h - 40, 220, 120, 0, Math.PI, 0);
      ctx.fill();
    }
  }

  ctx.save();
  ctx.translate(-camX, 0);

  // Platforms
  for (const pl of game.level.platforms) {
    if (pl.x + pl.w < camX - 20 || pl.x > camX + VIEW.w + 20) continue;
    ctx.fillStyle = pal.platform;
    roundRect(ctx, pl.x, pl.y, pl.w, VIEW.h - pl.y + 20, 14);
    ctx.fill();
    ctx.fillStyle = pal.platformTop;
    roundRect(ctx, pl.x, pl.y, pl.w, 16, 8);
    ctx.fill();
  }

  // Bubbles
  const hintOn = opts.hints !== false && game.stats.wrongSinceTarget >= 2;
  for (const b of game.level.bubbles) {
    if (b.collected) continue;
    if (b.x < camX - 60 || b.x > camX + VIEW.w + 60) continue;
    const wobble = opts.reducedMotion ? 0 : Math.sin((game.timeMs / 600) + b.id) * 4;
    const by = b.y + wobble - (b.bounceMs > 0 ? Math.sin((b.bounceMs / 900) * Math.PI) * 30 : 0);
    const isColor = game.level.content === 'colors';
    if (hintOn && b.label === game.target) {
      ctx.beginPath();
      ctx.arc(b.x, by, WORLD.bubbleR + 10, 0, Math.PI * 2);
      ctx.fillStyle = pal.hint;
      ctx.globalAlpha = 0.55;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.beginPath();
    ctx.arc(b.x, by, WORLD.bubbleR, 0, Math.PI * 2);
    ctx.fillStyle = isColor ? COLOR_VALUES[b.label] || pal.bubble : pal.bubble;
    ctx.fill();
    ctx.lineWidth = opts.highContrast ? 5 : 4;
    ctx.strokeStyle = pal.bubbleRing;
    ctx.stroke();
    ctx.fillStyle = isColor ? '#ffffff' : pal.bubbleText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (isColor) {
      // Color names are always written out, so the game works for color-blind players.
      ctx.font = '700 15px system-ui, sans-serif';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.65)';
      ctx.strokeText(b.label, b.x, by);
      ctx.fillText(b.label, b.x, by);
    } else {
      ctx.font = `800 ${b.label.length > 1 ? 30 : 36}px system-ui, sans-serif`;
      ctx.fillText(b.label, b.x, by + 1);
    }
  }

  // Player: a round friendly blob that squashes a little on landing
  const squash = opts.reducedMotion ? 0 : Math.max(-0.12, Math.min(0.12, p.vy / 8000));
  const pw = WORLD.playerW * (1 - squash);
  const ph = WORLD.playerH * (1 + squash);
  const px = p.x + (WORLD.playerW - pw) / 2;
  const py = p.y + (WORLD.playerH - ph);
  ctx.fillStyle = pal.player;
  ctx.strokeStyle = pal.playerOutline;
  ctx.lineWidth = 3;
  roundRect(ctx, px, py, pw, ph, 18);
  ctx.fill();
  ctx.stroke();
  const eyeX = px + pw / 2 + p.facing * 7;
  ctx.fillStyle = pal.eye;
  ctx.beginPath();
  ctx.arc(eyeX - 7, py + ph * 0.38, 4, 0, Math.PI * 2);
  ctx.arc(eyeX + 7, py + ph * 0.38, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.strokeStyle = pal.eye;
  ctx.lineWidth = 2.5;
  ctx.arc(eyeX, py + ph * 0.55, 7, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // Finish flag on the last platform
  const last = game.level.platforms[game.level.platforms.length - 1];
  ctx.fillStyle = pal.platformTop;
  ctx.fillRect(last.x + last.w - 80, last.y - 110, 6, 110);
  ctx.fillStyle = pal.hint;
  ctx.beginPath();
  ctx.moveTo(last.x + last.w - 74, last.y - 110);
  ctx.lineTo(last.x + last.w - 30, last.y - 95);
  ctx.lineTo(last.x + last.w - 74, last.y - 80);
  ctx.fill();

  ctx.restore();
}

// Small camera preview with the tracked hand, a steering bar and a jump meter.
// Clinicians use it to see why a gesture did or did not register.
export function renderPreview(ctx, video, view) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  if (video && video.readyState >= 2) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1); // mirror, like looking in a mirror
    ctx.drawImage(video, 0, 0, w, h);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  } else {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, w, h);
  }
  if (view.landmarks) {
    ctx.fillStyle = '#00e5ff';
    for (const pt of view.landmarks) {
      ctx.beginPath();
      ctx.arc((1 - pt.x) * w, pt.y * h, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Calibrated range and current steering
  if (view.cal) {
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(view.cal.minX * w, h - 14, (view.cal.maxX - view.cal.minX) * w, 8);
  }
  ctx.fillStyle = '#ffd23f';
  const sx = ((view.steer ?? 0) + 1) / 2;
  ctx.fillRect(sx * (w - 10), h - 16, 10, 12);
  // Jump meter: 0 = resting, 1 = will jump
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(w - 14, 6, 8, h - 30);
  ctx.fillStyle = view.jumpFired ? '#2ecc71' : '#ffffff';
  const m = Math.max(0, Math.min(1, view.jumpLevel ?? 0));
  ctx.fillRect(w - 14, 6 + (h - 30) * (1 - m), 8, (h - 30) * m);
  ctx.restore();
}
