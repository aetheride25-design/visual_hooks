import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compatibility, fadeOut, formatDuration, hasTimeline, onVideoOf, planTimeline } from './timeline.ts';
import type { MediaRef } from './types.ts';

const video: MediaRef = { src: 'v', kind: 'video', name: 'v.mp4', width: 1080, height: 1920, durationSec: 12 };
const audio: MediaRef = { src: 'a', kind: 'audio', name: 'a.mp3', width: 0, height: 0, durationSec: 8 };
const image: MediaRef = { src: 'i', kind: 'image', name: 'i.png', width: 100, height: 100 };

test('onVideoOf infers the type when the effect does not set it', () => {
  assert.equal(onVideoOf({ group: 'hook', usesMedia: true }), 'moment');
  assert.equal(onVideoOf({ group: 'support', usesMedia: false }), 'overlay');
  assert.equal(onVideoOf({ group: 'piece', usesMedia: false }), 'none');
  assert.equal(onVideoOf({ group: 'support', usesMedia: true, onVideo: 'full' }), 'full');
});

test('planTimeline: at the start, at the end, inside the video and the whole video', () => {
  assert.deepEqual(planTimeline({ onVideo: 'moment', totalSec: 12, effectSec: 2 }), { startSec: 0, effectSec: 2 });
  assert.deepEqual(planTimeline({ onVideo: 'overlay', totalSec: 12, effectSec: 3, defaultAt: 'end' }), { startSec: 9, effectSec: 3 });
  // Moved past the end, it sticks to the end.
  assert.deepEqual(planTimeline({ onVideo: 'moment', totalSec: 12, effectSec: 2, startSec: 11 }), { startSec: 10, effectSec: 2 });
  assert.deepEqual(planTimeline({ onVideo: 'moment', totalSec: 12, effectSec: 2, startSec: -3 }), { startSec: 0, effectSec: 2 });
  // Video shorter than the effect: the effect is trimmed.
  assert.deepEqual(planTimeline({ onVideo: 'moment', totalSec: 1.5, effectSec: 2 }), { startSec: 0, effectSec: 1.5 });
  // At the end of a 7.827982 s audio: in hundredths, without going over.
  assert.deepEqual(planTimeline({ onVideo: 'overlay', totalSec: 7.827982, effectSec: 3, defaultAt: 'end' }), { startSec: 4.82, effectSec: 3 });
  assert.deepEqual(planTimeline({ onVideo: 'full', totalSec: 12, effectSec: 5, startSec: 4 }), { startSec: 0, effectSec: 12 });
});

test('fadeOut is 1 and drops to 0 over the last frames', () => {
  assert.equal(fadeOut(0, 60, 30), 1);
  assert.equal(fadeOut(50, 60, 30), 1);
  assert.equal(fadeOut(55, 60, 30), 5 / 9);
  assert.equal(fadeOut(60, 60, 30), 0);
});

test('compatibility: with audio only, effects that need an image are not allowed', () => {
  assert.equal(compatibility('moment', 'hook', video), null);
  assert.equal(compatibility('overlay', 'support', audio), null);
  const reason = compatibility('moment', 'hook', audio);
  assert.match(reason?.en ?? '', /Needs an image/);
  assert.match(reason?.es ?? '', /Necesita imagen/);
  assert.match(compatibility('full', 'support', audio)?.en ?? '', /Needs an image/);
  // "No effect" lasts the whole video, but with audio it's the background with your voice.
  assert.equal(compatibility('full', 'base', audio), null);
});

test('hasTimeline and formatDuration', () => {
  assert.equal(hasTimeline(video), true);
  assert.equal(hasTimeline(audio), true);
  assert.equal(hasTimeline(image), false);
  assert.equal(hasTimeline(null), false);
  assert.equal(formatDuration(7.4), '0:07');
  assert.equal(formatDuration(65), '1:05');
});
