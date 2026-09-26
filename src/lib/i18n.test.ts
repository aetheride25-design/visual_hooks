import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectLang, fill, tr } from './i18n.ts';

test('tr returns a plain string as is and picks the language from a Text', () => {
  assert.equal(tr('MP4', 'es'), 'MP4');
  assert.equal(tr({ en: 'Image', es: 'Imagen' }, 'en'), 'Image');
  assert.equal(tr({ en: 'Image', es: 'Imagen' }, 'es'), 'Imagen');
});

test('detectLang takes the first supported base language, English otherwise', () => {
  assert.equal(detectLang(['es-PE']), 'es');
  assert.equal(detectLang(['fr', 'en-US']), 'en');
  assert.equal(detectLang(['ES']), 'es');
  assert.equal(detectLang(['fr', 'de']), 'en');
  assert.equal(detectLang([]), 'en');
});

test('fill replaces placeholders and leaves unknown ones untouched', () => {
  assert.equal(fill('Starts at {s} s', { s: 2 }), 'Starts at 2 s');
  assert.equal(fill('{a} + {b}', { a: 'x' }), 'x + {b}');
  assert.equal(fill('No placeholders', {}), 'No placeholders');
});
