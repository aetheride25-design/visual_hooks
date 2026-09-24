// Matemática de animación pura: sin React ni DOM, así se puede probar con node --test.
// Todo depende solo del tiempo `t` (segundos de animación), nunca del reloj real:
// eso es lo que hace que la vista previa y el render cuadro por cuadro coincidan.

export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Avance 0→1 de un tramo que empieza en `start` y dura `dur` segundos. */
export const progress = (t: number, start: number, dur: number): number =>
  dur <= 0 ? (t >= start ? 1 : 0) : clamp01((t - start) / dur);

export const lerp = (a: number, b: number, p: number): number => a + (b - a) * p;

export const easeOutCubic = (p: number): number => 1 - (1 - p) ** 3;
export const easeInOutCubic = (p: number): number =>
  p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
export const easeOutExpo = (p: number): number => (p >= 1 ? 1 : 1 - 2 ** (-10 * p));
export const easeInExpo = (p: number): number => (p <= 0 ? 0 : 2 ** (10 * p - 10));
/** Se pasa un poco y vuelve: da el "golpe" de los textos que caen. */
export const easeOutBack = (p: number, overshoot = 1.9): number => {
  const c3 = overshoot + 1;
  return 1 + c3 * (p - 1) ** 3 + overshoot * (p - 1) ** 2;
};

/** Tiempo de animación a partir del cuadro. `speed` acelera o frena todo el efecto. */
export const timeOf = (frame: number, fps: number, speed: number): number =>
  (frame / fps) * speed;

/**
 * Temblor determinista (sin Math.random) que se apaga solo.
 * Devuelve el desplazamiento en px para el tiempo `t` desde el impacto.
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

/** Valor intermedio de un contador que sube, redondeado a `decimals`. */
export const countValue = (target: number, p: number, decimals: number): number => {
  const f = 10 ** decimals;
  return Math.round(target * easeOutExpo(clamp01(p)) * f) / f;
};

/** Formato peruano: separador de miles "," y decimales ".". */
export const formatNumber = (n: number, decimals: number): string =>
  n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/**
 * Lo que ya se "escribió" de `text` en el tiempo `t`, a `cps` caracteres por segundo.
 * Cuenta por caracteres reales (tildes y emojis no se parten a la mitad).
 */
export const typedText = (text: string, t: number, start: number, cps: number): string => {
  const chars = Array.from(text);
  if (t < start) return '';
  // +1e-6: que 0.7 − 0.5 = 0.19999… no se coma una letra por redondeo.
  return chars.slice(0, Math.min(chars.length, Math.floor((t - start) * cps + 1e-6))).join('');
};

/** Segundo en que termina de escribirse `text`. */
export const typingEnd = (text: string, start: number, cps: number): number => start + Array.from(text).length / cps;

/** Cursor que parpadea 2 veces por segundo (encendido la primera mitad de cada ciclo). */
export const cursorOn = (t: number): boolean => ((t * 2) % 1 + 1) % 1 < 0.5;

/** Reloj "m:ss" o "h:mm:ss" a partir de segundos (se trunca, como un cronómetro). */
export const formatClock = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const two = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${two(m)}:${two(s % 60)}` : `${m}:${two(s % 60)}`;
};
