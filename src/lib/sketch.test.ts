import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handArrow, handEllipse, polylineLength, toPath } from './sketch.ts';

test('polylineLength suma los tramos', () => {
  assert.equal(polylineLength([{ x: 0, y: 0 }, { x: 3, y: 4 }, { x: 3, y: 10 }]), 11);
  assert.equal(polylineLength([{ x: 5, y: 5 }]), 0);
});

test('handEllipse rodea el centro y da más de una vuelta', () => {
  const pts = handEllipse({ x: 500, y: 800 }, 200, 100);
  const len = polylineLength(pts);
  const perimeter = 2 * Math.PI * Math.sqrt((200 ** 2 + 100 ** 2) / 2);
  assert.ok(len > perimeter, `largo ${len} debería superar una vuelta (${perimeter})`);
  for (const p of pts) assert.ok(Math.abs(p.x - 500) <= 200 * 1.2 && Math.abs(p.y - 800) <= 100 * 1.2);
});

test('handArrow empieza en el origen y la punta cae en el destino', () => {
  const { shaft, head } = handArrow({ x: 100, y: 1500 }, { x: 600, y: 900 });
  assert.deepEqual(shaft[0], { x: 100, y: 1500 });
  const end = shaft[shaft.length - 1];
  assert.ok(Math.hypot(end.x - 600, end.y - 900) < 1e-9);
  assert.equal(head.length, 2);
  for (const wing of head) assert.deepEqual(wing[0], end);
});

test('toPath arma un path SVG que empieza con M', () => {
  assert.equal(toPath([{ x: 1, y: 2 }, { x: 3.25, y: 4 }]), 'M1.0 2.0 L3.3 4.0');
});
