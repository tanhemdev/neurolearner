// Per-child settings profiles, stored only in this browser (localStorage).
// Nothing is uploaded anywhere.

export const DEFAULTS = {
  name: 'Player 1',
  input: 'keys', // 'camera' | 'keys'
  jumpGesture: 'pinch', // 'pinch' | 'open' | 'raise'
  deadZone: 0.15,
  smoothing: 0.35, // EMA alpha: lower = smoother but slower
  speed: 0.75,
  difficulty: 'gentle',
  content: 'letters',
  sound: true,
  speech: true,
  hints: true,
  highContrast: false,
  reducedMotion: false,
  autoWalk: false, // single-switch play: walk right automatically, the switch only jumps
  calibration: null,
};

const KEY = 'neurolearner.profiles.v1';

export function loadProfiles() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && parsed.profiles && Object.keys(parsed.profiles).length) return parsed;
  } catch {
    /* storage blocked or corrupted: fall through to defaults */
  }
  return { active: DEFAULTS.name, profiles: { [DEFAULTS.name]: { ...DEFAULTS } } };
}

export function saveProfiles(store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

export function activeProfile(store) {
  return { ...DEFAULTS, ...(store.profiles[store.active] || {}) };
}
