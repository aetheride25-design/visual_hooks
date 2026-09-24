import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aurora } from '../brand.ts';
import { bgPalette, grainSeed } from './background.ts';

test('la marca usa menta, azul y violeta sobre el fondo oscuro', () => {
  assert.deepEqual(bgPalette({}), { base: aurora.base, colors: [aurora.mint, aurora.blue, aurora.violet] });
});

test('un solo color tiñe las tres luces', () => {
  assert.deepEqual(bgPalette({ bgTint: 'red' }).colors, [aurora.red, aurora.red, aurora.red]);
});

test('personalizado usa tus colores y descarta los que no son #rrggbb', () => {
  const p = bgPalette({ bgTint: 'custom', bgBase: '#FF0000', bgColors: ['#00ff00', 'rojo', '#abc'] });
  assert.equal(p.base, '#ff0000');
  assert.deepEqual(p.colors, ['#00ff00', aurora.blue, aurora.violet]);
});

test('los colores personalizados se ignoran si no está en modo personalizado', () => {
  assert.equal(bgPalette({ bgTint: 'mint', bgBase: '#ffffff' }).base, aurora.base);
});

test('la semilla del grano cambia con el tiempo y es determinista', () => {
  assert.equal(grainSeed(0), 0);
  assert.equal(grainSeed(1), 24);
  assert.equal(grainSeed(1), grainSeed(1));
  assert.notEqual(grainSeed(0.5), grainSeed(0.55));
});
