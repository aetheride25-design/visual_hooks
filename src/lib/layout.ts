// Pure geometry to place your capture inside the vertical frame.

export type Rect = { x: number; y: number; w: number; h: number };
export type Fit = 'cover' | 'contain';

/** Rect taken by `mw×mh` media inside a box, filling it (cover) or fully visible (contain). */
export const fitRect = (mw: number, mh: number, box: Rect, fit: Fit): Rect => {
  const s = fit === 'cover' ? Math.max(box.w / mw, box.h / mh) : Math.min(box.w / mw, box.h / mh);
  const w = mw * s;
  const h = mh * s;
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
};

/** Point (in frame px) matching (fx, fy) ∈ [0,1] on the media. */
export const pointIn = (r: Rect, fx: number, fy: number): { x: number; y: number } => ({
  x: r.x + fx * r.w,
  y: r.y + fy * r.h,
});

/** Inverse of `pointIn`: a click on the frame → (fx, fy) on the media, clamped to [0,1]. */
export const pointToMedia = (r: Rect, x: number, y: number): { fx: number; fy: number } => {
  const c = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 100) / 100;
  return { fx: c((x - r.x) / r.w), fy: c((y - r.y) / r.h) };
};

/**
 * "Camera" transform that zooms `zoom` times into the `focus` point
 * and, depending on `center` (0→1), brings it to the center of the box.
 * Returns a CSS transform to apply with transform-origin 0 0.
 */
export const cameraTransform = (
  focus: { x: number; y: number },
  zoom: number,
  center: number,
  box: Rect,
): string => {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  // Scaling around the focus point leaves it in place.
  // Then it moves toward the box center in proportion to `center`.
  const tx = focus.x * (1 - zoom) + (cx - focus.x) * center;
  const ty = focus.y * (1 - zoom) + (cy - focus.y) * center;
  return `translate(${tx}px, ${ty}px) scale(${zoom})`;
};
