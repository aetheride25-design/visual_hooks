import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compatibility, fadeOut, formatDuration, hasTimeline, onVideoOf, planTimeline } from './timeline.ts';
import type { MediaRef } from './types.ts';

const video: MediaRef = { src: 'v', kind: 'video', name: 'v.mp4', width: 1080, height: 1920, durationSec: 12 };
const audio: MediaRef = { src: 'a', kind: 'audio', name: 'a.mp3', width: 0, height: 0, durationSec: 8 };
const image: MediaRef = { src: 'i', kind: 'image', name: 'i.png', width: 100, height: 100 };

test('onVideoOf deduce el tipo si el efecto no lo dice', () => {
  assert.equal(onVideoOf({ group: 'hook', usesMedia: true }), 'moment');
  assert.equal(onVideoOf({ group: 'apoyo', usesMedia: false }), 'overlay');
  assert.equal(onVideoOf({ group: 'pieza', usesMedia: false }), 'none');
  assert.equal(onVideoOf({ group: 'apoyo', usesMedia: true, onVideo: 'full' }), 'full');
});

test('planTimeline: al inicio, al final, dentro del video y todo el video', () => {
  assert.deepEqual(planTimeline({ onVideo: 'moment', totalSec: 12, effectSec: 2 }), { startSec: 0, effectSec: 2 });
  assert.deepEqual(planTimeline({ onVideo: 'overlay', totalSec: 12, effectSec: 3, defaultAt: 'end' }), { startSec: 9, effectSec: 3 });
  // Si lo mueves más allá del final, se queda pegado al final.
  assert.deepEqual(planTimeline({ onVideo: 'moment', totalSec: 12, effectSec: 2, startSec: 11 }), { startSec: 10, effectSec: 2 });
  assert.deepEqual(planTimeline({ onVideo: 'moment', totalSec: 12, effectSec: 2, startSec: -3 }), { startSec: 0, effectSec: 2 });
  // Video más corto que el efecto: el efecto se recorta.
  assert.deepEqual(planTimeline({ onVideo: 'moment', totalSec: 1.5, effectSec: 2 }), { startSec: 0, effectSec: 1.5 });
  // Al final de un audio de 7.827982 s: en centésimas, sin pasarse.
  assert.deepEqual(planTimeline({ onVideo: 'overlay', totalSec: 7.827982, effectSec: 3, defaultAt: 'end' }), { startSec: 4.82, effectSec: 3 });
  assert.deepEqual(planTimeline({ onVideo: 'full', totalSec: 12, effectSec: 5, startSec: 4 }), { startSec: 0, effectSec: 12 });
});

test('fadeOut vale 1 y baja a 0 en los últimos cuadros', () => {
  assert.equal(fadeOut(0, 60, 30), 1);
  assert.equal(fadeOut(50, 60, 30), 1);
  assert.equal(fadeOut(55, 60, 30), 5 / 9);
  assert.equal(fadeOut(60, 60, 30), 0);
});

test('compatibility: con un audio solo no van efectos que necesitan imagen', () => {
  assert.equal(compatibility('moment', 'hook', video), null);
  assert.equal(compatibility('overlay', 'apoyo', audio), null);
  assert.match(compatibility('moment', 'hook', audio) ?? '', /Necesita imagen/);
  assert.match(compatibility('full', 'apoyo', audio) ?? '', /Necesita imagen/);
  // "Sin efecto" dura todo, pero con un audio es el fondo con tu voz.
  assert.equal(compatibility('full', 'base', audio), null);
});

test('hasTimeline y formatDuration', () => {
  assert.equal(hasTimeline(video), true);
  assert.equal(hasTimeline(audio), true);
  assert.equal(hasTimeline(image), false);
  assert.equal(hasTimeline(null), false);
  assert.equal(formatDuration(7.4), '0:07');
  assert.equal(formatDuration(65), '1:05');
});
