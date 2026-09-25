import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aurora } from '../theme.ts';
import { bgPalette, grainSeed } from './background.ts';

test('the brand tint uses mint, blue and violet over the dark base', () => {
  assert.deepEqual(bgPalette({}), { base: aurora.base, colors: [aurora.mint, aurora.blue, aurora.violet] });
  assert.deepEqual(bgPalette({ bgTint: 'brand' }), bgPalette({}));
});

test('a single color tints all three lights', () => {
  assert.deepEqual(bgPalette({ bgTint: 'red' }).colors, [aurora.red, aurora.red, aurora.red]);
});

test('custom uses your colors and drops anything that is not #rrggbb', () => {
  const p = bgPalette({ bgTint: 'custom', bgBase: '#FF0000', bgColors: ['#00ff00', 'red', '#abc'] });
  assert.equal(p.base, '#ff0000');
  assert.deepEqual(p.colors, ['#00ff00', aurora.blue, aurora.violet]);
});

test('custom colors are ignored outside custom mode', () => {
  assert.equal(bgPalette({ bgTint: 'mint', bgBase: '#ffffff' }).base, aurora.base);
});

test('the grain seed changes over time and is deterministic', () => {
  assert.equal(grainSeed(0), 0);
  assert.equal(grainSeed(1), 24);
  assert.equal(grainSeed(1), grainSeed(1));
  assert.notEqual(grainSeed(0.5), grainSeed(0.55));
});
