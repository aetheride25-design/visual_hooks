// Pure animation math: no React or DOM, so it can be tested with node --test.
// Everything depends only on the time `t` (animation seconds), never on the real clock:
// that is what keeps the preview and the frame-by-frame render in sync.

export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/** 0→1 progress of a span that starts at `start` and lasts `dur` seconds. */
export const progress = (t: number, start: number, dur: number): number =>
  dur <= 0 ? (t >= start ? 1 : 0) : clamp01((t - start) / dur);

export const lerp = (a: number, b: number, p: number): number => a + (b - a) * p;

export const easeOutCubic = (p: number): number => 1 - (1 - p) ** 3;
export const easeInOutCubic = (p: number): number =>
  p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
export const easeOutExpo = (p: number): number => (p >= 1 ? 1 : 1 - 2 ** (-10 * p));
export const easeInExpo = (p: number): number => (p <= 0 ? 0 : 2 ** (10 * p - 10));
/** Overshoots a little and settles back: the "punch" of dropping text. */
export const easeOutBack = (p: number, overshoot = 1.9): number => {
  const c3 = overshoot + 1;
  return 1 + c3 * (p - 1) ** 3 + overshoot * (p - 1) ** 2;
};

/** Animation time from the frame. `speed` speeds up or slows down the whole effect. */
export const timeOf = (frame: number, fps: number, speed: number): number =>
  (frame / fps) * speed;

/**
 * Deterministic shake (no Math.random) that dies out on its own.
 * Returns the offset in px at time `t` since the impact.
 */
export const shake = (t: number, amp: number, dur: number, seed = 1): { x: number; y: number } => {
  if (t < 0 || t >= dur || amp === 0) return { x: 0, y: 0 };
  const decay = (1 - t / dur) ** 2;
  const w = 2 * Math.PI * 17;
  return {
    x: amp * decay * Math.sin(w * t + seed * 1.7) * Math.cos(w * 0.37 * t + seed),
    y: amp * decay * Math.cos(w * 1.13 * t + seed * 0.9),
  };
};

/** Intermediate value of a counter going up, rounded to `decimals`. */
export const countValue = (target: number, p: number, decimals: number): number => {
  const f = 10 ** decimals;
  return Math.round(target * easeOutExpo(clamp01(p)) * f) / f;
};

/** Thousands separator "," and decimal point ".". */
export const formatNumber = (n: number, decimals: number): string =>
  n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/**
 * The part of `text` already "typed" at time `t`, at `cps` characters per second.
 * Counts real characters (accented letters and emojis are never split in half).
 */
export const typedText = (text: string, t: number, start: number, cps: number): string => {
  const chars = Array.from(text);
  if (t < start) return '';
  // +1e-6: so 0.7 − 0.5 = 0.19999… doesn't lose a letter to rounding.
  return chars.slice(0, Math.min(chars.length, Math.floor((t - start) * cps + 1e-6))).join('');
};

/** Second at which `text` finishes typing. */
export const typingEnd = (text: string, start: number, cps: number): number => start + Array.from(text).length / cps;

/** Cursor that blinks twice per second (on for the first half of each cycle). */
export const cursorOn = (t: number): boolean => ((t * 2) % 1 + 1) % 1 < 0.5;

/** "m:ss" or "h:mm:ss" clock from seconds (truncated, like a stopwatch). */
export const formatClock = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const two = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${two(m)}:${two(s % 60)}` : `${m}:${two(s % 60)}`;
};
