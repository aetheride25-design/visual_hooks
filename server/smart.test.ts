import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clipForCopyArgs,
  concatLine,
  copyPieceArgs,
  fastProgress,
  framingFilter,
  joinReencodeArgs,
  parseRate,
  planFast,
  renderSpan,
  snapToKeyframes,
  type SmartProps,
  type SourceInfo,
} from './smart.ts';

const video = { src: 'http://localhost:3210/media/talk.mp4', kind: 'video' as const, name: 'talk.mp4', width: 1080, height: 1920, durationSec: 600 };
const props = (p: Partial<SmartProps> = {}): SmartProps => ({
  media: video,
  fps: 30,
  durationSec: 600,
  timeline: { startSec: 31.3, effectSec: 5 },
  captions: null,
  bg: 'aurora',
  ...p,
});
const source = (s: Partial<SourceInfo> = {}): SourceInfo => ({
  width: 1080,
  height: 1920,
  codec: 'h264',
  pixFmt: 'yuv420p',
  profile: 'High',
  rFrameRate: '30/1',
  avgFrameRate: '30/1',
  rotation: 0,
  colorSpace: 'bt709',
  hasAudio: true,
  audioCodec: 'aac',
  ...s,
});
const TOTAL = 18000;
const plan = (p: Partial<SmartProps> = {}, s: Partial<SourceInfo> | null = {}, format = 'mp4', size = { width: 1080, height: 1920 }) =>
  planFast({ format, props: props(p), total: TOTAL, ...size, source: s && source(s) });

test('renderSpan: the effect span, in frames', () => {
  assert.deepEqual(renderSpan(props(), TOTAL), { from: 939, to: 1089 });
  assert.equal(renderSpan(props({ timeline: null }), TOTAL), null);
});

test('renderSpan: captions widen it to cover every word (with room for the pages to linger)', () => {
  const captions = { words: [{ text: 'hi', startMs: 2000, endMs: 2300 }, { text: 'there', startMs: 60000, endMs: 60400 }], offsetMs: 100 };
  // 2000 + 100 - 200 = 1.9 s → frame 57; 60400 + 100 + 800 = 61.3 s → frame 1839.
  assert.deepEqual(renderSpan(props({ captions }), TOTAL), { from: 57, to: 1839 });
  // Captions turned on but nothing transcribed: only the effect.
  assert.deepEqual(renderSpan(props({ captions: { words: [] } }), TOTAL), { from: 939, to: 1089 });
});

test('renderSpan: clamped to the video', () => {
  assert.deepEqual(renderSpan(props({ timeline: { startSec: 598, effectSec: 5 } }), TOTAL), { from: 17940, to: 18000 });
});

test('planFast: a vertical H.264 video like the export can be copied around the effect', () => {
  const p = plan();
  assert.equal(p.fast, true);
  if (p.fast) {
    assert.equal(p.copy, true);
    assert.deepEqual(p.span, { from: 939, to: 1089 });
  }
});

test('planFast: keeps the full render when it must', () => {
  assert.equal(plan({}, {}, 'prores').fast, false);
  assert.equal(plan({}, {}, 'png').fast, false);
  assert.equal(plan({ timeline: null }).fast, false);
  assert.equal(plan({ media: { ...video, kind: 'audio' } }).fast, false);
  assert.equal(plan({}, null).fast, false);
  assert.equal(plan({}, { rotation: 90 }).fast, false);
  // An effect that lasts the whole video (e.g. 'full'), or captions from start to end.
  assert.equal(plan({ timeline: { startSec: 0, effectSec: 600 } }).fast, false);
  assert.equal(plan({ timeline: { startSec: 0, effectSec: 599.5 } }).fast, false);
  // A horizontal video fully visible over an animated background: only Remotion can draw that background.
  assert.equal(plan({}, { width: 1920, height: 1080 }).fast, false);
});

test('planFast: re-encodes the rest when it can be framed but not copied', () => {
  const cases: [Partial<SmartProps>, Partial<SourceInfo>][] = [
    [{ bg: 'solid' }, { width: 1920, height: 1080 }], // padded over a solid color
    [{ fit: 'cover' }, { width: 1920, height: 1080 }], // cropped to fill
    [{}, { width: 2160, height: 3840 }], // 4K vertical scaled down
    [{}, { codec: 'hevc' }],
    [{}, { pixFmt: 'yuvj420p' }],
    [{}, { rFrameRate: '60/1', avgFrameRate: '60/1' }],
    [{}, { avgFrameRate: '29/1' }], // variable frame rate (phones)
    [{}, { colorSpace: 'bt470bg' }],
  ];
  for (const [p, s] of cases) {
    const r = plan(p, s);
    assert.equal(r.fast, true, JSON.stringify(s));
    if (r.fast) assert.equal(r.copy, false, JSON.stringify(s));
  }
  // ×2 export: a 4K vertical video now matches it exactly.
  const x2 = plan({}, { width: 2160, height: 3840 }, 'mp4', { width: 2160, height: 3840 });
  assert.ok(x2.fast && x2.copy);
});

test('framingFilter: crop to fill, pad over a solid color, nothing for animated backgrounds', () => {
  const out = { width: 1080, height: 1920 };
  assert.match(framingFilter({ width: 1080, height: 1920 }, out, {})!, /^scale=1080:1920:force_original_aspect_ratio=increase:.*,crop=1080:1920$/);
  assert.match(framingFilter({ width: 1920, height: 1080 }, out, { fit: 'cover' })!, /crop=1080:1920/);
  assert.equal(framingFilter({ width: 1920, height: 1080 }, out, { bg: 'aurora' }), null);
  const pad = framingFilter({ width: 1920, height: 1080 }, out, { bg: 'solid', bgTint: 'custom', bgBase: '#123456' })!;
  assert.match(pad, /pad=1080:1920:\(ow-iw\)\/2:\(oh-ih\)\/2:color=0x123456$/);
  // An untagged video is read as BT.709, like Chrome does in the render.
  assert.match(framingFilter({ width: 1080, height: 1920, colorSpace: 'unknown' }, out, {})!, /in_color_matrix=bt709/);
  assert.match(framingFilter({ width: 1080, height: 1920, colorSpace: 'bt470bg' }, out, {})!, /in_color_matrix=auto/);
});

test('parseRate', () => {
  assert.equal(parseRate('30/1'), 30);
  assert.ok(Math.abs(parseRate('30000/1001') - 29.97) < 0.001);
  assert.equal(parseRate('0/0'), 0);
});

test('snapToKeyframes: widens the span to the keyframes around it', () => {
  const keys = [0, 60, 120, 180, 240];
  assert.deepEqual(snapToKeyframes(keys, { from: 70, to: 130 }, 300), { from: 60, to: 180 });
  assert.deepEqual(snapToKeyframes(keys, { from: 60, to: 120 }, 300), { from: 60, to: 120 });
  assert.deepEqual(snapToKeyframes(keys, { from: 0, to: 30 }, 300), { from: 0, to: 60 });
  // No keyframe after the span: it runs to the end.
  assert.deepEqual(snapToKeyframes(keys, { from: 250, to: 280 }, 300), { from: 240, to: 300 });
  assert.deepEqual(snapToKeyframes([60, 0], { from: 10, to: 20 }, 300), { from: 0, to: 60 });
});

test('joinReencodeArgs: before + clip + after, original audio, exact frame count', () => {
  const p = plan({}, { codec: 'hevc' });
  assert.ok(p.fast);
  const args = joinReencodeArgs({ source: 'in.mp4', clip: 'clip.mp4', output: 'out.mp4', plan: p, audioCodec: 'aac', hasAudio: true });
  const graph = args[args.indexOf('-filter_complex') + 1];
  assert.match(graph, /trim=end_frame=939/);
  assert.match(graph, /trim=start_frame=1089:end_frame=18000/);
  assert.match(graph, /\[pre\]\[mid\]\[post\]concat=n=3:v=1:a=0\[v\]/);
  assert.deepEqual(args.slice(args.indexOf('-map', args.indexOf('[v]')), args.indexOf('-map', args.indexOf('[v]')) + 4), ['-map', '0:a:0', '-c:a', 'copy']);
  assert.equal(args[args.indexOf('-frames:v') + 1], '18000');
  assert.equal(args.at(-1), 'out.mp4');
});

test('joinReencodeArgs: an effect at the very start or end joins two parts; no audio, no audio map', () => {
  const start = plan({ timeline: { startSec: 0, effectSec: 5 } }, { codec: 'hevc' });
  assert.ok(start.fast);
  const a = joinReencodeArgs({ source: 'in', clip: 'c', output: 'o', plan: start, audioCodec: 'opus', hasAudio: true });
  const g = a[a.indexOf('-filter_complex') + 1];
  assert.match(g, /\[s0\]nullsink/);
  assert.match(g, /\[mid\]\[post\]concat=n=2/);
  assert.ok(a.includes('aac'));
  const end = plan({ timeline: { startSec: 595, effectSec: 5 } }, { codec: 'hevc' });
  assert.ok(end.fast);
  const b = joinReencodeArgs({ source: 'in', clip: 'c', output: 'o', plan: end, audioCodec: 'aac', hasAudio: false });
  assert.match(b[b.indexOf('-filter_complex') + 1], /\[pre\]\[mid\]concat=n=2/);
  assert.ok(!b.includes('0:a:0'));
});

test('copy route args', () => {
  const clip = clipForCopyArgs('c.mp4', 'mid.ts', 'High', false);
  assert.deepEqual(clip.slice(clip.indexOf('-x264-params'), clip.indexOf('-x264-params') + 2), ['-x264-params', 'sps-id=1']);
  assert.equal(clip[clip.indexOf('-profile:v') + 1], 'high');
  assert.ok(!clip.includes('-colorspace'));
  assert.ok(clipForCopyArgs('c', 'm', 'Constrained Baseline', true).includes('-colorspace'));
  assert.ok(!clipForCopyArgs('c', 'm', 'High 4:4:4 Predictive', true).includes('-profile:v'));
  // From the start: no seek. Later: half a frame past the keyframe.
  assert.deepEqual(copyPieceArgs('in', 'pre.ts', 0, 900, 30).slice(0, 3), ['-y', '-i', 'in']);
  const post = copyPieceArgs('in', 'post.ts', 1140, 100, 30, 0.02);
  assert.equal(post[post.indexOf('-ss') + 1], (0.02 + 1140.5 / 30).toFixed(6));
  assert.equal(post[post.indexOf('-frames:v') + 1], '100');
  assert.equal(concatLine("C:\\clips\\it's.ts"), "file 'C:/clips/it'\\''s.ts'");
});

test('fastProgress: weighted by what each part costs', () => {
  assert.equal(fastProgress({ span: 150, rest: 17850, copy: true, rendered: 0, joined: 0 }), 0);
  assert.equal(fastProgress({ span: 150, rest: 17850, copy: true, rendered: 1, joined: 1 }), 1);
  const half = fastProgress({ span: 150, rest: 17850, copy: false, rendered: 1, joined: 0 });
  assert.ok(half > 0.04 && half < 0.1, String(half));
});
