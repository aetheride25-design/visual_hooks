// Destellos que flotan dentro de un círculo sin formar nada: cada uno sigue una curva
// de Lissajous propia (determinista, sin Math.random) y nunca sale del radio.

export type Spark = { x: number; y: number; size: number; alpha: number; color: number };

/** Pseudoaleatorio estable a partir de un entero (misma semilla → mismo valor). */
export const hash01 = (n: number): number => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Posición del destello `i` en el tiempo `t`, dentro del círculo (cx, cy, r). */
export const spark = (i: number, t: number, cx: number, cy: number, r: number): Spark => {
  const a = 0.35 + hash01(i * 3 + 1) * 0.9;
  const b = 0.3 + hash01(i * 3 + 2) * 0.9;
  const p = hash01(i * 3 + 3) * Math.PI * 2;
  // Radio que "respira" entre 20 % y 95 % del círculo.
  const rad = r * (0.2 + 0.75 * (0.5 + 0.5 * Math.sin(t * (0.5 + hash01(i + 40)) + p * 1.3)));
  const ang = p + t * (a - 0.2) * 1.6 + Math.sin(t * b * 2 + p) * 0.8;
  const twinkle = 0.5 + 0.5 * Math.sin(t * (3 + hash01(i + 70) * 4) + p * 2);
  return {
    x: cx + Math.cos(ang) * rad,
    y: cy + Math.sin(ang) * rad,
    size: 5 + 9 * hash01(i + 90) + 4 * twinkle,
    alpha: 0.35 + 0.65 * twinkle,
    color: i % 3,
  };
};

/** Contorno de nube: `n` bultos alrededor de una elipse, como un globo de pensamiento. */
export const cloudPath = (cx: number, cy: number, rx: number, ry: number, n: number): string => {
  const pts = Array.from({ length: n }, (_, k) => {
    const ang = -Math.PI / 2 + (k / n) * Math.PI * 2;
    return { x: cx + Math.cos(ang) * rx, y: cy + Math.sin(ang) * ry };
  });
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let k = 1; k <= n; k++) {
    const a = pts[k - 1];
    const b = pts[k % n];
    const chord = Math.hypot(b.x - a.x, b.y - a.y);
    // Arco con radio algo mayor que media cuerda: cada tramo se abulta hacia afuera.
    d += ` A${(chord * 0.62).toFixed(1)} ${(chord * 0.62).toFixed(1)} 0 0 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  return `${d} Z`;
};
