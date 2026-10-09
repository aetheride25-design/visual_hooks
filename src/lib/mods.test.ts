import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectMods, effectProblem } from './mods.ts';

const Comp = () => null;
const effect = (over: Record<string, unknown> = {}) => ({
  id: 'sticker-slap',
  name: { en: 'Sticker slap', es: 'Sticker' },
  description: { en: 'A sticker', es: 'Un sticker' },
  group: 'hook',
  usesMedia: true,
  defaultDurationSec: 2,
  defaults: { text: 'Hi' },
  params: [{ key: 'text', label: 'Text', type: 'text' }],
  component: Comp,
  ...over,
});

test('a valid mod effect loads and is marked as a mod', () => {
  const { effects, problems } = collectMods([{ folder: 'sticker', module: { default: effect() } }], ['punch-zoom']);
  assert.equal(problems.length, 0);
  assert.equal(effects.length, 1);
  assert.equal(effects[0].source, 'mod');
});

test('the same effect exported as default and named counts once; arrays are flattened', () => {
  const e = effect();
  const other = effect({ id: 'other-one' });
  const { effects } = collectMods([{ folder: 'x', module: { default: e, sticker: e, more: [other] } }], []);
  assert.deepEqual(effects.map((x) => x.id), ['sticker-slap', 'other-one']);
});

test('helpers a mod exports are ignored, but a mod with no effect is reported', () => {
  const ok = collectMods([{ folder: 'x', module: { default: effect(), helper: () => 1, SIZE: 4 } }], []);
  assert.equal(ok.problems.length, 0);
  const empty = collectMods([{ folder: 'empty', module: { helper: () => 1 } }], []);
  assert.equal(empty.effects.length, 0);
  assert.match(empty.problems[0].message, /exports no effect/);
});

test('id clashes with core effects or other mods are rejected, the first one wins', () => {
  const { effects, problems } = collectMods(
    [
      { folder: 'a', module: { default: effect({ id: 'punch-zoom' }) } },
      { folder: 'b', module: { default: effect() } },
      { folder: 'c', module: { default: effect() } },
    ],
    ['punch-zoom'],
  );
  assert.deepEqual(effects.map((e) => e.id), ['sticker-slap']);
  assert.deepEqual(problems.map((p) => p.folder), ['a', 'c']);
});

test('effectProblem explains what is wrong', () => {
  const none = new Set<string>();
  assert.equal(effectProblem(effect() as any, none), null);
  assert.match(effectProblem(effect({ id: 'Bad Id' }) as any, none)!, /lowercase/);
  assert.match(effectProblem(effect({ name: 'Sticker' }) as any, none)!, /name needs/);
  assert.match(effectProblem(effect({ group: 'base' }) as any, none)!, /group/);
  assert.match(effectProblem(effect({ defaultDurationSec: 0 }) as any, none)!, /defaultDurationSec/);
  assert.match(effectProblem(effect({ defaults: {} }) as any, none)!, /no default/);
});
