import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  countValue,
  cursorOn,
  easeOutBack,
  formatClock,
  formatNumber,
  progress,
  shake,
  timeOf,
  typedText,
  typingEnd,
} from './anim.ts';

test('progress stays at 0 before and at 1 after the span', () => {
  assert.equal(progress(0.2, 0.5, 1), 0);
  assert.equal(progress(1.0, 0.5, 1), 0.5);
  assert.equal(progress(9, 0.5, 1), 1);
  assert.equal(progress(0.5, 0.5, 0), 1);
});

test('timeOf: speed scales the animation time', () => {
  assert.equal(timeOf(30, 30, 1), 1);
  assert.equal(timeOf(30, 60, 1), 0.5);
  assert.equal(timeOf(30, 30, 2), 2);
});

test('shake is deterministic and dies out at the end', () => {
  assert.deepEqual(shake(0.1, 20, 0.4), shake(0.1, 20, 0.4));
  assert.deepEqual(shake(0.4, 20, 0.4), { x: 0, y: 0 });
  assert.deepEqual(shake(-0.1, 20, 0.4), { x: 0, y: 0 });
  const early = Math.hypot(...Object.values(shake(0.01, 20, 0.4)));
  assert.ok(early > 0);
});

test('countValue lands exactly on the target', () => {
  assert.equal(countValue(60, 1, 0), 60);
  assert.equal(countValue(20.5, 1, 1), 20.5);
  assert.equal(countValue(60, 0, 0), 0);
  assert.ok(countValue(60, 0.5, 0) < 60);
});

test('formatNumber uses comma thousands and a decimal point', () => {
  assert.equal(formatNumber(1234567, 0), '1,234,567');
  assert.equal(formatNumber(20, 2), '20.00');
});

test('typedText types at the requested speed and never goes past the text', () => {
  assert.equal(typedText('hello', 0.1, 0.5, 10), '');
  assert.equal(typedText('hello', 0.7, 0.5, 10), 'he');
  assert.equal(typedText('hello', 99, 0.5, 10), 'hello');
});

test('typedText never splits accented letters or emojis', () => {
  assert.equal(typedText('añ🚀x', 0.3, 0, 10), 'añ🚀');
  assert.equal(typingEnd('añ🚀x', 1, 4), 2);
});

test('cursorOn blinks: on and off every half cycle', () => {
  assert.equal(cursorOn(0), true);
  assert.equal(cursorOn(0.2), true);
  assert.equal(cursorOn(0.3), false);
  assert.equal(cursorOn(0.55), true);
});

test('formatClock truncates like a stopwatch and switches to hours', () => {
  assert.equal(formatClock(0), '0:00');
  assert.equal(formatClock(59.99), '0:59');
  assert.equal(formatClock(600), '10:00');
  assert.equal(formatClock(3725), '1:02:05');
  assert.equal(formatClock(-3), '0:00');
});

test('easeOutBack ends at 1 and overshoots on the way', () => {
  assert.ok(Math.abs(easeOutBack(1) - 1) < 1e-9);
  assert.ok(easeOutBack(0.6) > 1);
});
