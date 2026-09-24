import { test } from 'node:test';
import assert from 'node:assert/strict';
import { browserPlan, isTrustedRequest, mediaKind, parseRange, safeName, transcodeArgs } from './files.ts';

test('parseRange: rangos normales, abiertos y de sufijo', () => {
  assert.deepEqual(parseRange('bytes=0-99', 1000), { start: 0, end: 99 });
  assert.deepEqual(parseRange('bytes=500-', 1000), { start: 500, end: 999 });
  assert.deepEqual(parseRange('bytes=-100', 1000), { start: 900, end: 999 });
  assert.deepEqual(parseRange('bytes=900-5000', 1000), { start: 900, end: 999 });
});

test('parseRange: rechaza rangos imposibles o mal escritos', () => {
  assert.equal(parseRange(undefined, 1000), null);
  assert.equal(parseRange('bytes=1000-', 1000), null);
  assert.equal(parseRange('bytes=50-10', 1000), null);
  assert.equal(parseRange('bytes=-', 1000), null);
  assert.equal(parseRange('items=0-1', 1000), null);
});

test('safeName quita rutas, tildes y caracteres peligrosos', () => {
  assert.equal(safeName('..\\..\\Windows\\evil.MP4'), 'evil.mp4');
  assert.equal(safeName('Grabación de pantalla (1).mov'), 'Grabacion-de-pantalla-1.mov');
  assert.equal(safeName('???.png'), 'archivo.png');
});

test('isTrustedRequest acepta solo este servidor y orígenes locales', () => {
  assert.equal(isTrustedRequest('localhost:3210', 'http://localhost:3210', 3210), true);
  assert.equal(isTrustedRequest('127.0.0.1:3210', undefined, 3210), true);
  assert.equal(isTrustedRequest('localhost:3210', 'http://localhost:3000', 3210), true);
  assert.equal(isTrustedRequest('localhost:3210', 'https://evil.com', 3210), false);
  assert.equal(isTrustedRequest('evil.com:3210', undefined, 3210), false);
  assert.equal(isTrustedRequest('localhost:3210', 'http://localhost.evil.com', 3210), false);
  assert.equal(isTrustedRequest(undefined, undefined, 3210), false);
});

test('browserPlan: ProRes con alfa → WebM con alfa; ProRes sin alfa → MP4; H.264/VP9 tal cual', () => {
  assert.equal(browserPlan('prores', 'yuva444p12le'), 'webm-alpha');
  assert.equal(browserPlan('prores', 'yuv422p10le'), 'mp4');
  assert.equal(browserPlan('h264', 'yuv420p'), null);
  assert.equal(browserPlan('vp9', 'yuva420p'), null);
  assert.equal(browserPlan('qtrle', 'argb'), 'webm-alpha');
});

test('transcodeArgs conserva el alfa solo en la conversión a WebM', () => {
  const webm = transcodeArgs('webm-alpha', 'in.mov', 'out.webm');
  assert.ok(webm.includes('libvpx-vp9') && webm[webm.indexOf('-pix_fmt') + 1] === 'yuva420p');
  assert.equal(webm.at(-1), 'out.webm');
  const mp4 = transcodeArgs('mp4', 'in.mov', 'out.mp4');
  assert.equal(mp4[mp4.indexOf('-pix_fmt') + 1], 'yuv420p');
});

test('transcodeArgs conserva el audio (lo necesitan los subtítulos)', () => {
  assert.ok(!transcodeArgs('mp4', 'in.mov', 'out.mp4').includes('-an'));
  assert.ok(!transcodeArgs('webm-alpha', 'in.mov', 'out.webm').includes('-an'));
  assert.equal(transcodeArgs('mp4', 'in.mov', 'out.mp4').at(-1), 'out.mp4');
});

test('mediaKind distingue video, imagen y otros', () => {
  assert.equal(mediaKind('a.MP4'), 'video');
  assert.equal(mediaKind('a.webp'), 'image');
  assert.equal(mediaKind('a.exe'), null);
});
