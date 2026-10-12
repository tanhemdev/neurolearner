import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLevel, createGame, stepGame, WORLD, CONTENT, summarize } from '../js/game.js';

const run = (game, input, ms) => {
  for (let t = 0; t < ms; t += 16) stepGame(game, input, 16);
  return game;
};

test('levels are deterministic for a seed', () => {
  assert.deepEqual(createLevel(42), createLevel(42));
  assert.notDeepEqual(createLevel(42), createLevel(43));
});

test('bubbles sit above platforms, never over gaps', () => {
  for (const difficulty of ['gentle', 'steady', 'bold']) {
    for (let seed = 1; seed < 30; seed++) {
      const lvl = createLevel(seed, { difficulty });
      for (const b of lvl.bubbles) {
        const over = lvl.platforms.some((p) => b.x >= p.x && b.x <= p.x + p.w && b.y < p.y);
        assert.ok(over, `bubble at ${b.x} in seed ${seed} is over a gap`);
      }
    }
  }
});

test('gaps grow with difficulty', () => {
  const maxGap = (d) => {
    let m = 0;
    for (let s = 1; s < 40; s++) {
      const ps = createLevel(s, { difficulty: d }).platforms;
      for (let i = 1; i < ps.length; i++) m = Math.max(m, ps[i].x - (ps[i - 1].x + ps[i - 1].w));
    }
    return m;
  };
  assert.ok(maxGap('gentle') < maxGap('steady'));
  assert.ok(maxGap('steady') < maxGap('bold'));
});

test('content setting controls bubble labels', () => {
  const lvl = createLevel(7, { content: 'numbers' });
  assert.ok(lvl.bubbles.every((b) => CONTENT.numbers.includes(b.label)));
});

test('the player stands on the start platform and steering moves them', () => {
  const game = createGame({ seed: 3 });
  const y0 = game.player.y;
  run(game, { steer: 0 }, 500);
  assert.equal(game.player.y, y0, 'gravity must not sink the player into the floor');
  const x0 = game.player.x;
  run(game, { steer: 1 }, 300);
  assert.ok(game.player.x > x0);
});

test('jumping leaves the ground and lands again', () => {
  const game = createGame({ seed: 3 });
  stepGame(game, { steer: 0, jump: true }, 16);
  assert.equal(game.player.onGround, false);
  run(game, { steer: 0 }, 1500);
  assert.equal(game.player.onGround, true);
  assert.equal(game.stats.jumps, 1);
});

test('a jump pressed slightly before landing still fires (jump buffer)', () => {
  const game = createGame({ seed: 3 });
  stepGame(game, { jump: true }, 16);
  // Wait until just before landing, then press again.
  let guard = 0;
  while (game.player.vy < 0 || game.player.y + WORLD.playerH < game.level.platforms[0].y - 6) {
    stepGame(game, {}, 16);
    if (++guard > 400) break;
  }
  stepGame(game, { jump: true }, 16);
  run(game, {}, 200);
  assert.equal(game.stats.jumps, 2);
});

test('falling into a gap pops the player back, no penalty', () => {
  const game = createGame({ seed: 5 });
  run(game, { steer: 1 }, 6000); // walk right without jumping: falls into the first gap
  assert.ok(game.stats.respawns >= 1);
  assert.equal(game.stars, 0);
  assert.ok(game.player.y < WORLD.height);
});

test('touching the target bubble scores, a wrong bubble does not', () => {
  const game = createGame({ seed: 9 });
  const target = game.level.bubbles.find((b) => b.label === game.target);
  const wrong = game.level.bubbles.find((b) => b.label !== game.target);
  if (wrong) {
    game.player.x = wrong.x - WORLD.playerW / 2;
    game.player.y = wrong.y - WORLD.playerH / 2;
    stepGame(game, {}, 16);
    assert.equal(game.stars, 0);
    assert.equal(game.stats.wrong, 1);
    assert.ok(game.events.includes('wrong'));
  }
  game.player.x = target.x - WORLD.playerW / 2;
  game.player.y = target.y - WORLD.playerH / 2;
  stepGame(game, {}, 16);
  assert.equal(game.stars, 1);
  assert.ok(target.collected);
  assert.notEqual(game.target, null);
});

test('five correct bubbles finish a level', () => {
  const game = createGame({ seed: 11 });
  for (let i = 0; i < WORLD.targetsPerLevel; i++) {
    const b = game.level.bubbles.find((x) => !x.collected && x.label === game.target);
    game.player.x = b.x - WORLD.playerW / 2;
    game.player.y = b.y - WORLD.playerH / 2;
    stepGame(game, {}, 16);
  }
  assert.equal(game.levelNumber, 2);
  assert.ok(game.events.includes('level'));
  const s = summarize(game);
  assert.equal(s.correct, WORLD.targetsPerLevel);
  assert.equal(s.level, 2);
});

// Analytic reach of a full-speed jump that lands `rise` px higher.
function reach(rise) {
  const v = WORLD.jumpVelocity;
  const gr = WORLD.gravity;
  const disc = v * v - 2 * gr * rise;
  if (disc < 0) return 0;
  return WORLD.maxSpeed * ((v + Math.sqrt(disc)) / gr);
}

test('every gap in every generated level can be jumped', () => {
  for (const difficulty of ['gentle', 'steady', 'bold']) {
    for (let seed = 1; seed < 200; seed++) {
      const ps = createLevel(seed, { difficulty }).platforms;
      for (let i = 1; i < ps.length; i++) {
        const gap = ps[i].x - (ps[i - 1].x + ps[i - 1].w);
        const rise = ps[i - 1].y - ps[i].y; // positive = next platform is higher
        assert.ok(gap <= 0.9 * reach(rise), `${difficulty} seed ${seed}: gap ${gap}px, rise ${rise}px`);
      }
    }
  }
});

test('slow speed slows time but keeps the same jump arc', () => {
  const fast = createGame({ seed: 3, speed: 1 });
  const slow = createGame({ seed: 3, speed: 0.5 });
  stepGame(fast, { jump: true }, 16);
  stepGame(slow, { jump: true }, 16);
  let peakFast = Infinity;
  let peakSlow = Infinity;
  for (let i = 0; i < 200; i++) {
    stepGame(fast, {}, 16);
    stepGame(slow, {}, 16);
    peakFast = Math.min(peakFast, fast.player.y);
    peakSlow = Math.min(peakSlow, slow.player.y);
  }
  assert.ok(Math.abs(peakFast - peakSlow) < 6, `${peakFast} vs ${peakSlow}`);
  assert.ok(slow.realMs > slow.timeMs);
});
