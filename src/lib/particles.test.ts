import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cloudPath, hash01, spark } from './particles.ts';

test('hash01 es estable y queda en [0, 1)', () => {
  assert.equal(hash01(7), hash01(7));
  for (let n = 0; n < 500; n++) {
    const v = hash01(n);
    assert.ok(v >= 0 && v < 1, `hash01(${n}) = ${v}`);
  }
});

test('spark es determinista y nunca sale del círculo', () => {
  assert.deepEqual(spark(3, 1.25, 540, 330, 150), spark(3, 1.25, 540, 330, 150));
  for (let i = 0; i < 18; i++) {
    for (let t = 0; t <= 3; t += 1 / 30) {
      const s = spark(i, t, 540, 330, 150);
      assert.ok(Math.hypot(s.x - 540, s.y - 330) <= 150 + 1e-9, `destello ${i} fuera en t=${t}`);
      assert.ok(s.alpha >= 0.35 && s.alpha <= 1);
    }
  }
});

test('spark se mueve con el tiempo y reparte los 3 colores', () => {
  const a = spark(1, 0, 540, 330, 150);
  const b = spark(1, 0.5, 540, 330, 150);
  assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > 1);
  assert.deepEqual([0, 1, 2, 3].map((i) => spark(i, 0, 0, 0, 1).color), [0, 1, 2, 0]);
});

test('cloudPath cierra el contorno con un arco por bulto', () => {
  const d = cloudPath(540, 320, 260, 170, 9);
  assert.ok(d.startsWith('M540.0 150.0'));
  assert.ok(d.endsWith(' Z'));
  assert.equal(d.match(/ A/g)?.length, 9);
});
