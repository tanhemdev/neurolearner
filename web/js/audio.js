// Short synthesized sounds plus spoken prompts. Everything is generated in the
// browser, so there are no audio files to load and nothing to license.

let ctx = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, startOffset, duration, { type = 'sine', gain = 0.15 } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + startOffset;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

export const sounds = {
  jump: () => tone(520, 0, 0.12, { type: 'triangle', gain: 0.08 }),
  correct: () => {
    tone(660, 0, 0.18);
    tone(880, 0.12, 0.28);
  },
  wrong: () => tone(220, 0, 0.25, { type: 'sine', gain: 0.07 }),
  level: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3)),
  respawn: () => tone(330, 0, 0.2, { type: 'triangle', gain: 0.06 }),
  unlock: () => audio(),
};

export function speak(text, { enabled = true, rate = 0.9 } = {}) {
  if (!enabled || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate;
  u.pitch = 1.05;
  window.speechSynthesis.speak(u);
}

export function promptFor(target, content) {
  if (content === 'numbers') return `Find the number ${target}`;
  if (content === 'colors') return `Find the color ${target}`;
  return `Find the letter ${target}`;
}
