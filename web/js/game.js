// Platformer simulation for NeuroLearner. No DOM here: the game state is a
// plain object and stepGame() advances it, so the rules are unit-tested in
// node (web/tests/game.test.mjs) and render.js only draws what this produces.

export const WORLD = {
  height: 540,
  gravity: 1900, // px/s^2
  jumpVelocity: 860, // px/s
  maxSpeed: 270, // px/s at speed 1.0
  accel: 2200, // px/s^2 toward the target speed
  playerW: 44,
  playerH: 50,
  coyoteMs: 160, // can still jump this long after walking off an edge
  bufferMs: 180, // a jump pressed this early still fires on landing
  bubbleR: 34,
  targetsPerLevel: 5,
};

// Gap ranges per difficulty. "gentle" gaps can be crossed with a slow jump.
export const DIFFICULTY = {
  gentle: { gap: [40, 90], rise: 50, bubbles: 10 },
  steady: { gap: [70, 130], rise: 80, bubbles: 12 },
  bold: { gap: [100, 170], rise: 100, bubbles: 14 },
};

export const CONTENT = {
  letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'M', 'O', 'P', 'R', 'S', 'T'],
  numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  colors: ['red', 'blue', 'yellow', 'green', 'purple', 'orange'],
};

// Small deterministic PRNG so a level seed always builds the same level.
export function createRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function between(rng, lo, hi) {
  return lo + (hi - lo) * rng();
}

export function createLevel(seed, { difficulty = 'gentle', content = 'letters' } = {}) {
  const rng = createRng(seed);
  const d = DIFFICULTY[difficulty] || DIFFICULTY.gentle;
  const labels = CONTENT[content] || CONTENT.letters;
  const platforms = [];
  const groundY = 440;

  // Wide starting platform so the child can get used to steering first.
  let x = 0;
  let y = groundY;
  platforms.push({ x: 0, y, w: 420 });
  x = 420;

  const count = 9 + Math.floor(rng() * 3);
  for (let i = 0; i < count; i++) {
    x += between(rng, d.gap[0], d.gap[1]);
    const w = between(rng, 220, 360);
    y = Math.round(Math.min(groundY, Math.max(250, y + between(rng, -d.rise, d.rise))));
    platforms.push({ x: Math.round(x), y, w: Math.round(w) });
    x += w;
  }
  // Wide finish platform
  x += between(rng, d.gap[0], d.gap[1]);
  platforms.push({ x: Math.round(x), y: groundY, w: 500 });
  const width = Math.round(x + 500);

  // Bubbles float above platforms (never over gaps) at reachable heights.
  const bubbles = [];
  const usable = platforms.slice(1);
  for (let i = 0; i < d.bubbles; i++) {
    const p = usable[i % usable.length];
    const bx = p.x + between(rng, 50, Math.max(60, p.w - 50));
    const by = p.y - between(rng, 70, 150);
    bubbles.push({
      id: i,
      x: Math.round(bx),
      y: Math.round(by),
      label: labels[Math.floor(rng() * labels.length)],
      collected: false,
      bounceMs: 0,
    });
  }
  return { seed, difficulty, content, platforms, bubbles, width, groundY };
}

export function createGame({ seed = 1, difficulty = 'gentle', content = 'letters', speed = 1 } = {}) {
  const level = createLevel(seed, { difficulty, content });
  const start = level.platforms[0];
  const game = {
    level,
    levelNumber: 1,
    speed,
    timeMs: 0, // game clock (runs slower when speed < 1)
    realMs: 0, // wall clock, used for the session summary
    player: {
      x: 80,
      y: start.y - WORLD.playerH,
      vx: 0,
      vy: 0,
      onGround: true,
      lastGroundMs: 0,
      jumpQueuedMs: -Infinity,
      safe: { x: 80, y: start.y - WORLD.playerH },
      facing: 1,
    },
    target: null,
    stars: 0,
    events: [], // drained by the UI each frame: 'jump', 'correct', 'wrong', 'respawn', 'level'
    stats: { correct: 0, wrong: 0, wrongSinceTarget: 0, jumps: 0, respawns: 0, targetStartMs: 0, timesToCollect: [] },
  };
  pickTarget(game);
  return game;
}

// Choose the next label to find, preferring a bubble ahead of the player so
// the child is never asked to go backwards.
export function pickTarget(game) {
  const open = game.level.bubbles.filter((b) => !b.collected);
  if (open.length === 0) {
    game.target = null;
    return null;
  }
  const ahead = open.filter((b) => b.x >= game.player.x - 40);
  const pool = ahead.length ? ahead : open;
  pool.sort((a, b) => a.x - b.x);
  const pickFrom = pool.slice(0, Math.min(3, pool.length));
  const choice = pickFrom[Math.floor(createRng(game.level.seed * 31 + game.stars * 7 + open.length)() * pickFrom.length)];
  game.target = choice.label;
  game.stats.targetStartMs = game.realMs;
  game.stats.wrongSinceTarget = 0;
  return game.target;
}

function platformUnder(level, px, prevBottom, bottom) {
  for (const p of level.platforms) {
    const overlaps = px + WORLD.playerW > p.x + 4 && px < p.x + p.w - 4;
    if (overlaps && prevBottom <= p.y + 1 && bottom >= p.y) return p;
  }
  return null;
}

// input: { steer: -1..1, jump: boolean (edge-triggered) }
export function stepGame(game, input, dtMs) {
  // "speed" slows the whole simulation evenly, so a slow game has exactly the
  // same jumpable gaps as a normal one, just with more time to react.
  const realStep = Math.min(dtMs, 50); // clamp so a background tab cannot teleport the player
  const gameStep = realStep * game.speed;
  const dt = gameStep / 1000;
  game.timeMs += gameStep;
  game.realMs += realStep;
  const p = game.player;
  const s = Math.max(-1, Math.min(1, input.steer || 0));

  // Horizontal: ease toward the target speed instead of snapping to it.
  const targetVx = s * WORLD.maxSpeed;
  const dv = targetVx - p.vx;
  const maxDv = WORLD.accel * dt;
  p.vx += Math.max(-maxDv, Math.min(maxDv, dv));
  if (Math.abs(s) > 0.05) p.facing = Math.sign(s);

  // Jumping with coyote time and a jump buffer: both forgive late or early
  // timing, which matters when a gesture takes a moment to register.
  if (input.jump) p.jumpQueuedMs = game.timeMs;
  const canJump = p.onGround || game.timeMs - p.lastGroundMs <= WORLD.coyoteMs;
  if (canJump && game.timeMs - p.jumpQueuedMs <= WORLD.bufferMs) {
    p.vy = -WORLD.jumpVelocity;
    p.onGround = false;
    p.lastGroundMs = -Infinity;
    p.jumpQueuedMs = -Infinity;
    game.stats.jumps += 1;
    game.events.push('jump');
  }

  // Vertical
  const prevBottom = p.y + WORLD.playerH;
  p.vy += WORLD.gravity * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.x = Math.max(0, Math.min(game.level.width - WORLD.playerW, p.x));

  const bottom = p.y + WORLD.playerH;
  const landed = p.vy >= 0 ? platformUnder(game.level, p.x, prevBottom, bottom) : null;
  if (landed) {
    p.y = landed.y - WORLD.playerH;
    p.vy = 0;
    p.onGround = true;
    p.lastGroundMs = game.timeMs;
    p.safe = { x: Math.max(landed.x + 10, Math.min(p.x, landed.x + landed.w - WORLD.playerW - 10)), y: p.y };
  } else {
    if (p.onGround) p.lastGroundMs = game.timeMs;
    p.onGround = false;
  }

  // Falling is never a failure: put the player back on the last safe spot.
  if (p.y > WORLD.height + 120) {
    p.x = p.safe.x;
    p.y = p.safe.y;
    p.vx = 0;
    p.vy = 0;
    p.onGround = true;
    p.lastGroundMs = game.timeMs;
    game.stats.respawns += 1;
    game.events.push('respawn');
  }

  // Bubbles
  const cx = p.x + WORLD.playerW / 2;
  const cy = p.y + WORLD.playerH / 2;
  for (const b of game.level.bubbles) {
    if (b.collected) continue;
    if (b.bounceMs > 0) {
      b.bounceMs = Math.max(0, b.bounceMs - gameStep);
      continue;
    }
    const hit = Math.hypot(cx - b.x, cy - b.y) < WORLD.bubbleR + Math.min(WORLD.playerW, WORLD.playerH) / 2;
    if (!hit) continue;
    if (b.label === game.target) {
      b.collected = true;
      game.stars += 1;
      game.stats.correct += 1;
      game.stats.timesToCollect.push(game.realMs - game.stats.targetStartMs);
      game.events.push('correct');
      if (game.stars % WORLD.targetsPerLevel === 0) {
        nextLevel(game);
      } else {
        pickTarget(game);
      }
      break; // one collection per frame; the level may have just been replaced
    } else {
      // Wrong bubble: a gentle bounce and a hint, never a penalty.
      b.bounceMs = 900;
      game.stats.wrong += 1;
      game.stats.wrongSinceTarget += 1;
      game.events.push('wrong');
    }
  }
  return game;
}

export function nextLevel(game) {
  const { difficulty, content } = game.level;
  game.levelNumber += 1;
  game.level = createLevel(game.level.seed + 1, { difficulty, content });
  const start = game.level.platforms[0];
  Object.assign(game.player, {
    x: 80,
    y: start.y - WORLD.playerH,
    vx: 0,
    vy: 0,
    onGround: true,
    lastGroundMs: game.timeMs,
    safe: { x: 80, y: start.y - WORLD.playerH },
  });
  game.events.push('level');
  pickTarget(game);
}

export function summarize(game) {
  const t = game.stats.timesToCollect;
  const median = t.length ? [...t].sort((a, b) => a - b)[Math.floor(t.length / 2)] : null;
  return {
    level: game.levelNumber,
    stars: game.stars,
    correct: game.stats.correct,
    wrongTouches: game.stats.wrong,
    jumps: game.stats.jumps,
    respawns: game.stats.respawns,
    playedSeconds: Math.round(game.realMs / 1000),
    medianSecondsToFind: median === null ? null : Math.round(median / 100) / 10,
  };
}
