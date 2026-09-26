import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeWordIndex, displayText, editWord, formatMs, pageAt, paginate, toSrt, toVtt, wordsFromTokens, type CaptionWord } from './captions.ts';

const w = (text: string, startMs: number, endMs = startMs + 200): CaptionWord => ({ text, startMs, endMs });

test('wordsFromTokens joins word pieces and drops tags like [Music]', () => {
  const words = wordsFromTokens([
    { text: 'Today', startMs: 0, endMs: 200 },
    { text: ' I', startMs: 200, endMs: 400 },
    { text: ' Clau', startMs: 400, endMs: 500 },
    { text: 'de', startMs: 500, endMs: 650 },
    { text: ' [Music]', startMs: 700, endMs: 900 },
    { text: ' ', startMs: 900, endMs: 950 },
    { text: ' ¿ves', startMs: 1000, endMs: 1200 },
    { text: '?', startMs: 1200, endMs: 1250 },
  ]);
  assert.deepEqual(
    words.map((x) => x.text),
    ['Today', 'I', 'Claude', '¿ves?'],
  );
  assert.deepEqual([words[2].startMs, words[2].endMs], [400, 650]);
});

test('wordsFromTokens uses the real timestamp (DTW) when Whisper provides it', () => {
  const [a, b] = wordsFromTokens([
    { text: ' And', startMs: 0, endMs: 300, timestampMs: 120 },
    { text: ' now', startMs: 300, endMs: 1500, timestampMs: 5000 },
  ]);
  assert.equal(a.startMs, 120);
  assert.equal(b.startMs, 1500); // never after it ends
});

test('paginate respects the word limit and splits at punctuation and silences', () => {
  const words = [w('I', 0), w('did', 250), w('this', 500), w('fast.', 750), w('And', 1000), w('works', 2500)];
  const pages = paginate(words, 3);
  assert.deepEqual(
    pages.map((p) => p.words.map((x) => x.text).join(' ')),
    ['I did this', 'fast.', 'And', 'works'],
  );
});

test('paginate: each page lasts until the next, but fades out on long silences', () => {
  const pages = paginate([w('one', 0, 300), w('two', 400, 700), w('three', 3000, 3300)], 1, 600, 400);
  assert.equal(pages[0].endMs, 400); // stays until "two" starts
  assert.equal(pages[1].endMs, 1100); // silence: lingers 400 ms and disappears
  assert.equal(pages[2].endMs, 3700);
});

test('pageAt and activeWordIndex find what is on screen and the word being spoken', () => {
  const pages = paginate([w('a', 0), w('b', 300), w('c', 600)], 3);
  assert.equal(pageAt(pages, -10), null);
  const page = pageAt(pages, 350)!;
  assert.equal(activeWordIndex(page, 350), 1);
  assert.equal(activeWordIndex(page, 0), 0);
  assert.equal(pageAt(pages, 5000), null);
});

test('editWord fixes, removes or splits a word without moving the others', () => {
  const words = [w('cloud', 0, 400), w('code', 400, 800), w('uh', 800, 900)];
  assert.equal(editWord(words, 0, 'Claude')[0].text, 'Claude');
  assert.deepEqual(editWord(words, 2, '  ').map((x) => x.text), ['cloud', 'code']);
  const split = editWord(words, 0, 'Claude Code');
  assert.deepEqual(split.slice(0, 2), [w('Claude', 0, 200), w('Code', 200, 400)]);
  assert.equal(split.length, 4);
});

test('displayText and formatMs', () => {
  assert.equal(displayText('niño,', true, true), 'NIÑO');
  assert.equal(displayText('¿sí?', true, true), '¿SÍ?');
  assert.equal(displayText('hello.', false, false), 'hello.');
  assert.equal(formatMs(65300), '1:05.3');
});

test('toSrt and toVtt split phrases and write each format\'s timestamps', () => {
  const words = [w('Hello,', 0, 300), w('this', 400, 600), w('is', 600, 700), w('a', 3700, 3900), w('test.', 3900, 4200)];
  assert.equal(
    toSrt(words),
    '1\n00:00:00,000 --> 00:00:00,400\nHello,\n\n' +
      '2\n00:00:00,400 --> 00:00:01,100\nthis is\n\n' +
      '3\n00:00:03,700 --> 00:00:04,600\na test.\n',
  );
  assert.equal(toVtt(words, 7, 3_600_000).split('\n').slice(0, 3).join('\n'), 'WEBVTT\n\n01:00:00.000 --> 01:00:00.400');
});
