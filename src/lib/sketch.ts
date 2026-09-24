// Trazos "dibujados a mano": puntos con un temblor determinista y su largo,
// para animarlos con stroke-dasharray / stroke-dashoffset.

export type Pt = { x: number; y: number };

export const polylineLength = (pts: Pt[]): number => {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return len;
};

export const toPath = (pts: Pt[]): string =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

/** Óvalo a mano: da ~1.1 vueltas y no cierra perfecto, como un plumón. */
export const handEllipse = (c: Pt, rx: number, ry: number, seed = 1, steps = 90): Pt[] => {
  const pts: Pt[] = [];
  const start = -Math.PI * 0.62;
  const turns = 2 * Math.PI * 1.1;
  for (let i = 0; i <= steps; i++) {
    const a = start + (turns * i) / steps;
    const k = i / steps;
    const wobble = 1 + 0.035 * Math.sin(3 * a + seed) + 0.06 * k; // se abre un poco al final
    pts.push({ x: c.x + Math.cos(a) * rx * wobble, y: c.y + Math.sin(a) * ry * wobble });
  }
  return pts;
};

/** Flecha curva de `from` a `to` (curva cuadrática que se arquea hacia un costado). */
export const handArrow = (from: Pt, to: Pt, bend = 0.25, steps = 50): { shaft: Pt[]; head: Pt[][] } => {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const ctrl = { x: mx - dy * bend, y: my + dx * bend };
  const shaft: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const k = i / steps;
    const a = (1 - k) ** 2;
    const b = 2 * (1 - k) * k;
    const c = k ** 2;
    shaft.push({ x: a * from.x + b * ctrl.x + c * to.x, y: a * from.y + b * ctrl.y + c * to.y });
  }
  const last = shaft[shaft.length - 1];
  const prev = shaft[shaft.length - 4];
  const ang = Math.atan2(last.y - prev.y, last.x - prev.x);
  const len = Math.max(40, Math.hypot(dx, dy) * 0.14);
  const wing = (s: number) => [last, { x: last.x - Math.cos(ang + s * 0.5) * len, y: last.y - Math.sin(ang + s * 0.5) * len }];
  return { shaft, head: [wing(1), wing(-1)] };
};
