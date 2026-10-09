import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bgDefaults } from '../../src/lib/background.ts';
import { fromSaved, toSaved } from './saved.ts';

const known = (id: string) => id === 'punch-zoom' || id === 'text-drop';

const state = {
  effectId: 'punch-zoom',
  overrides: { 'punch-zoom': { label: 'Hi', after: { src: 'http://x/media/a.mp4', kind: 'video' } } },
  mediaName: 'clip.mp4',
  fps: 60 as const,
  speed: 1.5,
  transparent: false,
  bg: bgDefaults,
  mode: 'video' as const,
  captionsOn: true,
  captions: { captionStyle: 'pop', words: [{ text: 'x', startMs: 0, endMs: 1 }], wordsFor: 'clip.mp4' },
  transcripts: { 'clip.mp4': [{ text: 'hola', startMs: 0, endMs: 300 }] },
  tab: 'captions' as const,
};

test('toSaved drops media picks and the words inside the captions settings', () => {
  const s = toSaved(state);
  assert.deepEqual(s.overrides['punch-zoom'], { label: 'Hi' });
  assert.deepEqual(s.captions, { captionStyle: 'pop' });
  assert.equal(s.transcripts['clip.mp4'].length, 1);
});

test('fromSaved round-trips what toSaved stores', () => {
  const back = fromSaved(JSON.stringify(toSaved(state)), known)!;
  assert.equal(back.effectId, 'punch-zoom');
  assert.equal(back.fps, 60);
  assert.equal(back.tab, 'captions');
  assert.equal(back.mediaName, 'clip.mp4');
});

test('fromSaved ignores unknown effects, broken JSON and out-of-range values', () => {
  assert.equal(fromSaved('{oops', known), null);
  assert.equal(fromSaved(null, known), null);
  assert.equal(fromSaved(JSON.stringify({ v: 2, effectId: 'punch-zoom' }), known), null);
  const back = fromSaved(JSON.stringify({ v: 1, effectId: 'gone', overrides: { gone: {}, 'text-drop': { a: 1 } }, speed: 0, fps: 24 }), known)!;
  assert.equal(back.effectId, undefined);
  assert.deepEqual(Object.keys(back.overrides!), ['text-drop']);
  assert.equal(back.speed, undefined);
  assert.equal(back.fps, undefined);
});
