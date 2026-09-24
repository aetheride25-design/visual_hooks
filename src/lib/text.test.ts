import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLines, parseWords } from './text.ts';

test('parseWords marca como acento lo que va entre asteriscos', () => {
  assert.deepEqual(parseWords('Lo hice en *una hora*'), [
    { text: 'Lo', accent: false },
    { text: 'hice', accent: false },
    { text: 'en', accent: false },
    { text: 'una', accent: true },
    { text: 'hora', accent: true },
  ]);
});

test('parseWords: una sola palabra con acento y texto sin acentos', () => {
  assert.deepEqual(parseWords('*gratis* ya'), [
    { text: 'gratis', accent: true },
    { text: 'ya', accent: false },
  ]);
  assert.deepEqual(parseWords('  hola   mundo '), [
    { text: 'hola', accent: false },
    { text: 'mundo', accent: false },
  ]);
});

test('parseWords acepta puntuación después del asterisco de cierre', () => {
  assert.deepEqual(parseWords('Te quita *excusas*.'), [
    { text: 'Te', accent: false },
    { text: 'quita', accent: false },
    { text: 'excusas.', accent: true },
  ]);
  assert.deepEqual(parseWords('¡*gratis*! ya'), [
    { text: '¡gratis!', accent: true },
    { text: 'ya', accent: false },
  ]);
});

test('parseWords ignora asteriscos sueltos sin romper el resto', () => {
  assert.deepEqual(parseWords('a * b'), [
    { text: 'a', accent: false },
    { text: 'b', accent: false },
  ]);
});

test('parseLines respeta los saltos de línea y descarta líneas vacías', () => {
  const lines = parseLines('Número\n\n*uno*');
  assert.equal(lines.length, 2);
  assert.deepEqual(lines[1], [{ text: 'uno', accent: true }]);
});
