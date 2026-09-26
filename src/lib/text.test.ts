import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLines, parseWords } from './text.ts';

test('parseWords marks text between asterisks as accent', () => {
  assert.deepEqual(parseWords('Done in *one hour*'), [
    { text: 'Done', accent: false },
    { text: 'in', accent: false },
    { text: 'one', accent: true },
    { text: 'hour', accent: true },
  ]);
});

test('parseWords: a single accented word, and text without accents', () => {
  assert.deepEqual(parseWords('*free* now'), [
    { text: 'free', accent: true },
    { text: 'now', accent: false },
  ]);
  assert.deepEqual(parseWords('  hello   world '), [
    { text: 'hello', accent: false },
    { text: 'world', accent: false },
  ]);
});

test('parseWords accepts punctuation around the asterisks', () => {
  assert.deepEqual(parseWords('No more *excuses*.'), [
    { text: 'No', accent: false },
    { text: 'more', accent: false },
    { text: 'excuses.', accent: true },
  ]);
  assert.deepEqual(parseWords('¡*gratis*! ya'), [
    { text: '¡gratis!', accent: true },
    { text: 'ya', accent: false },
  ]);
});

test('parseWords ignores stray asterisks without breaking the rest', () => {
  assert.deepEqual(parseWords('a * b'), [
    { text: 'a', accent: false },
    { text: 'b', accent: false },
  ]);
});

test('parseLines keeps line breaks and drops empty lines', () => {
  const lines = parseLines('Number\n\n*one*');
  assert.equal(lines.length, 2);
  assert.deepEqual(lines[1], [{ text: 'one', accent: true }]);
});
