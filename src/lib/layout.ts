// Geometría pura para ubicar tu captura dentro del cuadro vertical.

export type Rect = { x: number; y: number; w: number; h: number };
export type Fit = 'cover' | 'contain';

/** Rectángulo que ocupa un medio de `mw×mh` dentro de una caja, llenándola o completo. */
export const fitRect = (mw: number, mh: number, box: Rect, fit: Fit): Rect => {
  const s = fit === 'cover' ? Math.max(box.w / mw, box.h / mh) : Math.min(box.w / mw, box.h / mh);
  const w = mw * s;
  const h = mh * s;
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
};

/** Punto (en px del cuadro) que corresponde a (fx, fy) ∈ [0,1] sobre el medio. */
export const pointIn = (r: Rect, fx: number, fy: number): { x: number; y: number } => ({
  x: r.x + fx * r.w,
  y: r.y + fy * r.h,
});

/** Lo inverso de `pointIn`: un clic en el cuadro → (fx, fy) sobre el medio, limitado a [0,1]. */
export const pointToMedia = (r: Rect, x: number, y: number): { fx: number; fy: number } => {
  const c = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 100) / 100;
  return { fx: c((x - r.x) / r.w), fy: c((y - r.y) / r.h) };
};

/**
 * Transformación de "cámara" que acerca `zoom` veces hacia el punto `focus`
 * y, según `center` (0→1), lo lleva al centro de la caja.
 * Devuelve un transform CSS para aplicar con transform-origin 0 0.
 */
export const cameraTransform = (
  focus: { x: number; y: number },
  zoom: number,
  center: number,
  box: Rect,
): string => {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  // Punto del foco después de escalar alrededor de él mismo: no se mueve.
  // Luego se traslada hacia el centro de la caja proporcionalmente a `center`.
  const tx = focus.x * (1 - zoom) + (cx - focus.x) * center;
  const ty = focus.y * (1 - zoom) + (cy - focus.y) * center;
  return `translate(${tx}px, ${ty}px) scale(${zoom})`;
};
