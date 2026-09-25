import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cameraTransform, fitRect, pointIn, pointToMedia } from './layout.ts';

const FRAME = { x: 0, y: 0, w: 1080, h: 1920 };

test('fitRect contain: a 16:9 capture is fully visible and vertically centered', () => {
  assert.deepEqual(fitRect(1920, 1080, FRAME, 'contain'), { x: 0, y: 656.25, w: 1080, h: 607.5 });
});

test('fitRect cover: fills the height and crops the sides', () => {
  const r = fitRect(1920, 1080, FRAME, 'cover');
  assert.equal(r.h, 1920);
  assert.ok(Math.abs(r.w - 3413.333) < 0.01);
  assert.ok(Math.abs(r.x - -1166.667) < 0.01);
});

test('pointIn places the point relative to the media, not the frame', () => {
  const r = fitRect(1920, 1080, FRAME, 'contain');
  assert.deepEqual(pointIn(r, 0.5, 0.5), { x: 540, y: 960 });
  assert.deepEqual(pointIn(r, 0, 0), { x: 0, y: 656.25 });
});

test('pointToMedia undoes pointIn and clamps clicks outside the capture', () => {
  const r = fitRect(1920, 1080, FRAME, 'contain');
  const p = pointIn(r, 0.25, 0.8);
  assert.deepEqual(pointToMedia(r, p.x, p.y), { fx: 0.25, fy: 0.8 });
  assert.deepEqual(pointToMedia(r, 540, 100), { fx: 0.5, fy: 0 });
});

/** Applies the transform (origin 0 0) to a point, to check where it ends up. */
const apply = (t: string, p: { x: number; y: number }) => {
  const m = /translate\((-?[\d.e+-]+)px, (-?[\d.e+-]+)px\) scale\(([\d.]+)\)/.exec(t)!;
  const [tx, ty, s] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return { x: p.x * s + tx, y: p.y * s + ty };
};

test('cameraTransform: without centering, the focus stays put while zooming', () => {
  const focus = { x: 800, y: 700 };
  const out = apply(cameraTransform(focus, 2.5, 0, FRAME), focus);
  assert.ok(Math.abs(out.x - 800) < 1e-6 && Math.abs(out.y - 700) < 1e-6);
});

test('cameraTransform: full centering brings the focus to the frame center', () => {
  const focus = { x: 800, y: 700 };
  const out = apply(cameraTransform(focus, 2.5, 1, FRAME), focus);
  assert.ok(Math.abs(out.x - 540) < 1e-6 && Math.abs(out.y - 960) < 1e-6);
});
