import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { findMods, indexSource, INDEX_FILE, scaffoldMod, toModId, writeModsIndex } from './mods.ts';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'mods-'));

test('toModId makes a safe id from any name', () => {
  assert.equal(toModId('Sticker Slap!'), 'sticker-slap');
  assert.equal(toModId('  Corazón   rojo '), 'corazon-rojo');
  assert.equal(toModId('***'), '');
});

test('indexSource imports each mod in order', () => {
  const src = indexSource([
    { folder: 'a-mod', entry: 'index.tsx' },
    { folder: 'b', entry: 'index.ts' },
  ]);
  assert.match(src, /import \* as m0 from '\.\/a-mod\/index\.tsx';/);
  assert.match(src, /import \* as m1 from '\.\/b\/index\.ts';/);
  assert.match(src, /\{ folder: "b", module: m1 \}/);
  assert.match(indexSource([]), /export const modules: ModModule\[\] = \[\];/);
});

test('findMods skips drafts, hidden folders and folders without an index', () => {
  const dir = tmp();
  for (const f of ['b-mod', 'a-mod', '_draft', '.hidden', 'empty']) fs.mkdirSync(path.join(dir, f));
  for (const f of ['b-mod', 'a-mod', '_draft', '.hidden']) fs.writeFileSync(path.join(dir, f, 'index.tsx'), '');
  fs.writeFileSync(path.join(dir, 'README.md'), '');
  assert.deepEqual(findMods(dir).map((m) => m.folder), ['a-mod', 'b-mod']);
});

test('writeModsIndex only writes when something changed; scaffoldMod creates a mod and lists it', () => {
  const dir = tmp();
  assert.equal(writeModsIndex(dir), true);
  assert.equal(writeModsIndex(dir), false);
  const file = scaffoldMod('My Sticker', dir);
  assert.equal(path.basename(path.dirname(file)), 'my-sticker');
  assert.match(fs.readFileSync(file, 'utf8'), /id: 'my-sticker'/);
  assert.match(fs.readFileSync(path.join(dir, INDEX_FILE), 'utf8'), /my-sticker\/index\.tsx/);
  assert.throws(() => scaffoldMod('my sticker', dir), /already exists/);
});
