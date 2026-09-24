import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeWordIndex, displayText, editWord, formatMs, pageAt, paginate, wordsFromTokens, type CaptionWord } from './captions.ts';

const w = (text: string, startMs: number, endMs = startMs + 200): CaptionWord => ({ text, startMs, endMs });

test('wordsFromTokens junta los trozos de una palabra y quita marcas como [Música]', () => {
  const words = wordsFromTokens([
    { text: 'Hoy', startMs: 0, endMs: 200 },
    { text: ' uso', startMs: 200, endMs: 400 },
    { text: ' Clau', startMs: 400, endMs: 500 },
    { text: 'de', startMs: 500, endMs: 650 },
    { text: ' [Música]', startMs: 700, endMs: 900 },
    { text: ' ', startMs: 900, endMs: 950 },
    { text: ' ¿ves', startMs: 1000, endMs: 1200 },
    { text: '?', startMs: 1200, endMs: 1250 },
  ]);
  assert.deepEqual(
    words.map((x) => x.text),
    ['Hoy', 'uso', 'Claude', '¿ves?'],
  );
  assert.deepEqual([words[2].startMs, words[2].endMs], [400, 650]);
});

test('wordsFromTokens usa el instante real (DTW) si Whisper lo da', () => {
  const [a, b] = wordsFromTokens([
    { text: ' Y', startMs: 0, endMs: 300, timestampMs: 120 },
    { text: ' ya', startMs: 300, endMs: 1500, timestampMs: 5000 },
  ]);
  assert.equal(a.startMs, 120);
  assert.equal(b.startMs, 1500); // nunca después de que termina
});

test('paginate respeta el máximo de palabras y corta en la puntuación y los silencios', () => {
  const words = [w('Esto', 0), w('lo', 250), w('hice', 500), w('rápido.', 750), w('Y', 1000), w('funciona', 2500)];
  const pages = paginate(words, 3);
  assert.deepEqual(
    pages.map((p) => p.words.map((x) => x.text).join(' ')),
    ['Esto lo hice', 'rápido.', 'Y', 'funciona'],
  );
});

test('paginate: cada página dura hasta la siguiente, pero se apaga en los silencios largos', () => {
  const pages = paginate([w('uno', 0, 300), w('dos', 400, 700), w('tres', 3000, 3300)], 1, 600, 400);
  assert.equal(pages[0].endMs, 400); // sigue hasta que empieza "dos"
  assert.equal(pages[1].endMs, 1100); // silencio: se queda 400 ms y desaparece
  assert.equal(pages[2].endMs, 3700);
});

test('pageAt y activeWordIndex encuentran lo que se ve y la palabra que se dice', () => {
  const pages = paginate([w('a', 0), w('b', 300), w('c', 600)], 3);
  assert.equal(pageAt(pages, -10), null);
  const page = pageAt(pages, 350)!;
  assert.equal(activeWordIndex(page, 350), 1);
  assert.equal(activeWordIndex(page, 0), 0);
  assert.equal(pageAt(pages, 5000), null);
});

test('editWord corrige, borra o parte una palabra sin mover las demás', () => {
  const words = [w('cloud', 0, 400), w('code', 400, 800), w('eh', 800, 900)];
  assert.equal(editWord(words, 0, 'Claude')[0].text, 'Claude');
  assert.deepEqual(editWord(words, 2, '  ').map((x) => x.text), ['cloud', 'code']);
  const split = editWord(words, 0, 'Claude Code');
  assert.deepEqual(split.slice(0, 2), [w('Claude', 0, 200), w('Code', 200, 400)]);
  assert.equal(split.length, 4);
});

test('displayText y formatMs', () => {
  assert.equal(displayText('niño,', true, true), 'NIÑO');
  assert.equal(displayText('¿sí?', true, true), '¿SÍ?');
  assert.equal(displayText('hola.', false, false), 'hola.');
  assert.equal(formatMs(65300), '1:05.3');
});
