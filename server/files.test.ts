import { test } from 'node:test';
import assert from 'node:assert/strict';
import { browserPlan, isTrustedRequest, mediaKind, parseRange, safeName, transcodeArgs } from './files.ts';

test('parseRange: normal, open-ended and suffix ranges', () => {
  assert.deepEqual(parseRange('bytes=0-99', 1000), { start: 0, end: 99 });
  assert.deepEqual(parseRange('bytes=500-', 1000), { start: 500, end: 999 });
  assert.deepEqual(parseRange('bytes=-100', 1000), { start: 900, end: 999 });
  assert.deepEqual(parseRange('bytes=900-5000', 1000), { start: 900, end: 999 });
});

test('parseRange: rejects impossible or malformed ranges', () => {
  assert.equal(parseRange(undefined, 1000), null);
  assert.equal(parseRange('bytes=1000-', 1000), null);
  assert.equal(parseRange('bytes=50-10', 1000), null);
  assert.equal(parseRange('bytes=-', 1000), null);
  assert.equal(parseRange('items=0-1', 1000), null);
});

test('safeName strips paths, accents and dangerous characters', () => {
  assert.equal(safeName('..\\..\\Windows\\evil.MP4'), 'evil.mp4');
  assert.equal(safeName('Grabación de pantalla (1).mov'), 'Grabacion-de-pantalla-1.mov');
  assert.equal(safeName('???.png'), 'file.png');
});

test('isTrustedRequest only accepts this server and local origins', () => {
  assert.equal(isTrustedRequest('localhost:3210', 'http://localhost:3210', 3210), true);
  assert.equal(isTrustedRequest('127.0.0.1:3210', undefined, 3210), true);
  assert.equal(isTrustedRequest('localhost:3210', 'http://localhost:3000', 3210), true);
  assert.equal(isTrustedRequest('localhost:3210', 'https://evil.com', 3210), false);
  assert.equal(isTrustedRequest('evil.com:3210', undefined, 3210), false);
  assert.equal(isTrustedRequest('localhost:3210', 'http://localhost.evil.com', 3210), false);
  assert.equal(isTrustedRequest(undefined, undefined, 3210), false);
});

test('browserPlan: ProRes with alpha → WebM with alpha; ProRes without alpha → MP4; H.264/VP9 as is', () => {
  assert.equal(browserPlan('prores', 'yuva444p12le'), 'webm-alpha');
  assert.equal(browserPlan('prores', 'yuv422p10le'), 'mp4');
  assert.equal(browserPlan('h264', 'yuv420p'), null);
  assert.equal(browserPlan('vp9', 'yuva420p'), null);
  assert.equal(browserPlan('qtrle', 'argb'), 'webm-alpha');
});

test('transcodeArgs keeps alpha only when converting to WebM', () => {
  const webm = transcodeArgs('webm-alpha', 'in.mov', 'out.webm');
  assert.ok(webm.includes('libvpx-vp9') && webm[webm.indexOf('-pix_fmt') + 1] === 'yuva420p');
  assert.equal(webm.at(-1), 'out.webm');
  const mp4 = transcodeArgs('mp4', 'in.mov', 'out.mp4');
  assert.equal(mp4[mp4.indexOf('-pix_fmt') + 1], 'yuv420p');
});

test('transcodeArgs keeps the audio (captions need it)', () => {
  assert.ok(!transcodeArgs('mp4', 'in.mov', 'out.mp4').includes('-an'));
  assert.ok(!transcodeArgs('webm-alpha', 'in.mov', 'out.webm').includes('-an'));
  assert.equal(transcodeArgs('mp4', 'in.mov', 'out.mp4').at(-1), 'out.mp4');
});

test('mediaKind tells video, image, audio and others apart', () => {
  assert.equal(mediaKind('a.MP4'), 'video');
  assert.equal(mediaKind('a.webp'), 'image');
  assert.equal(mediaKind('voice.MP3'), 'audio');
  assert.equal(mediaKind('voice.m4a'), 'audio');
  assert.equal(mediaKind('a.exe'), null);
});
