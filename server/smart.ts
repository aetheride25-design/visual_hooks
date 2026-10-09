// Fast MP4 export for long videos ("smart rendering"): Remotion only draws the span where something happens
// (the effect and the captions); the rest of your video is untouched, so FFmpeg joins it around that clip.
// Pure planning, no processes: it can be tested with node --test. The runner is in fast-export.ts.
import { fitRect, type Fit } from '../src/lib/layout.ts';
import { bgPalette, type BgProps } from '../src/lib/background.ts';
import type { MediaRef, Timeline } from '../src/lib/types.ts';
import type { CaptionWord } from '../src/lib/captions.ts';

/** The export props this plan reads (the rest travel to Remotion untouched). */
export type SmartProps = Partial<BgProps> & {
  media?: MediaRef | null;
  fps?: number;
  durationSec?: number;
  timeline?: Timeline | null;
  captions?: { words?: CaptionWord[]; offsetMs?: number } | null;
  fit?: unknown;
};

/** Your video as ffprobe sees it. */
export type SourceInfo = {
  width: number;
  height: number;
  codec: string;
  pixFmt: string;
  profile: string;
  /** Frame rate as a fraction ("30/1", "30000/1001"), declared and average. */
  rFrameRate: string;
  avgFrameRate: string;
  /** Rotation from the phone's metadata, in degrees (0 if none). */
  rotation: number;
  colorSpace: string;
  hasAudio: boolean;
  audioCodec: string;
};

export type Span = { from: number; to: number };

/** Captions need a little room: pages pop in and linger 400 ms after their last word. */
const CAPTION_PAD_MS = { before: 200, after: 800 };
/** Below this much untouched video, the full render is just as fast. */
const MIN_SAVED_SEC = 1;

/** Frames [from, to) where the export differs from your plain video: the effect, plus the captions if on. */
export const renderSpan = (p: SmartProps, total: number): Span | null => {
  const fps = p.fps ?? 30;
  if (!p.timeline) return null;
  let from = Math.round(p.timeline.startSec * fps);
  let to = from + Math.max(1, Math.round(p.timeline.effectSec * fps));
  const words = p.captions?.words ?? [];
  if (p.captions && words.length) {
    const offset = p.captions.offsetMs ?? 0;
    const first = Math.min(...words.map((w) => w.startMs)) + offset - CAPTION_PAD_MS.before;
    const last = Math.max(...words.map((w) => w.endMs)) + offset + CAPTION_PAD_MS.after;
    from = Math.min(from, Math.floor((first / 1000) * fps));
    to = Math.max(to, Math.ceil((last / 1000) * fps));
  }
  from = Math.max(0, from);
  to = Math.min(total, to);
  return to > from ? { from, to } : null;
};

/** "0x1d1f24" from "#1d1f24", for FFmpeg's pad color. */
const ffColor = (hex: string) => `0x${hex.replace('#', '')}`;

/**
 * FFmpeg filter that frames your video like the render does outside the effect (see shell.tsx):
 * filling the frame (crop) or fully visible over a solid background (pad).
 * null when the render shows an animated background around it: only Remotion can draw that.
 */
export const framingFilter = (
  src: { width: number; height: number; colorSpace?: string },
  out: { width: number; height: number },
  p: SmartProps,
): string | null => {
  const fit: Fit = p.fit === 'cover' ? 'cover' : 'contain';
  const r = fitRect(src.width, src.height, { x: 0, y: 0, w: out.width, h: out.height }, fit);
  const fills = r.x <= 0.5 && r.y <= 0.5 && r.w >= out.width - 1 && r.h >= out.height - 1;
  const size = `${out.width}:${out.height}`;
  // Colors as the render sees them: Chrome reads an untagged video as BT.709 and the export is BT.709.
  const color = `in_color_matrix=${['', 'unknown'].includes(src.colorSpace ?? '') ? 'bt709' : 'auto'}:out_color_matrix=bt709`;
  if (fills) return `scale=${size}:force_original_aspect_ratio=increase:${color},crop=${size}`;
  if ((p.bg ?? 'aurora') !== 'solid') return null;
  return (
    `scale=${size}:force_original_aspect_ratio=decrease:force_divisible_by=2:${color},` +
    `pad=${size}:(ow-iw)/2:(oh-ih)/2:color=${ffColor(bgPalette(p).base)}`
  );
};

/** "30000/1001" → 29.97. */
export const parseRate = (rate: string): number => {
  const [n, d = '1'] = rate.split('/');
  const v = Number(n) / Number(d);
  return Number.isFinite(v) ? v : 0;
};

export type FastPlan =
  | { fast: false; reason: string }
  | {
      fast: true;
      span: Span;
      total: number;
      fps: number;
      width: number;
      height: number;
      /** Framing filter for the untouched parts when they're re-encoded. */
      vf: string;
      /** Can the untouched parts be copied as they are (no re-encode)? */
      copy: boolean;
    };

/**
 * Should this export go the fast way? Only an MP4 of an effect applied to your video, where the video outside
 * the effect can be framed by FFmpeg exactly like the render does. Anything else: the full render, as before.
 */
export const planFast = (o: {
  format: string;
  props: SmartProps;
  total: number;
  width: number;
  height: number;
  source: SourceInfo | null;
}): FastPlan => {
  const { props: p, source } = o;
  const fps = p.fps ?? 30;
  if (o.format !== 'mp4') return { fast: false, reason: 'not mp4' };
  if (!p.timeline || p.media?.kind !== 'video') return { fast: false, reason: 'not applied to a video' };
  if (!source) return { fast: false, reason: 'source not found' };
  if (source.rotation % 360 !== 0) return { fast: false, reason: 'rotated source' };
  const span = renderSpan(p, o.total);
  if (!span) return { fast: false, reason: 'no span' };
  if (o.total - (span.to - span.from) < MIN_SAVED_SEC * fps) return { fast: false, reason: 'span covers the video' };
  const out = { width: o.width, height: o.height };
  const vf = framingFilter(source, out, p);
  if (!vf) return { fast: false, reason: 'animated background around the video' };
  const copy =
    source.codec === 'h264' &&
    source.pixFmt === 'yuv420p' &&
    source.width === o.width &&
    source.height === o.height &&
    ['', 'unknown', 'bt709'].includes(source.colorSpace) &&
    Math.abs(parseRate(source.rFrameRate) - fps) < 0.001 &&
    Math.abs(parseRate(source.avgFrameRate) - fps) < 0.01;
  return { fast: true, span, total: o.total, fps, width: o.width, height: o.height, vf, copy };
};

/**
 * Widens the span to your video's keyframes, the only places it can be cut without re-encoding:
 * from the last keyframe at or before `from` to the first one at or after `to` (or the end).
 */
export const snapToKeyframes = (keyframes: number[], span: Span, total: number): Span => {
  const sorted = [...keyframes].sort((a, b) => a - b);
  const from = sorted.filter((k) => k <= span.from).pop() ?? 0;
  const to = sorted.find((k) => k >= span.to && k < total) ?? total;
  return { from, to };
};

const X264 = ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709'];
const AUDIO = (codec: string) => (codec === 'aac' ? ['-c:a', 'copy'] : ['-c:a', 'aac', '-b:a', '320k']);

/**
 * Re-encode route, one FFmpeg pass: your video framed and cut before and after the span, the Remotion clip
 * in between, and your original audio underneath, continuous (so it never drifts or clicks at a join).
 * Inputs: 0 = your video, 1 = the clip of the span.
 */
export const joinReencodeArgs = (o: {
  source: string;
  clip: string;
  output: string;
  plan: Extract<FastPlan, { fast: true }>;
  audioCodec: string;
  hasAudio: boolean;
  preset?: string;
}): string[] => {
  const { span, total, fps, vf } = o.plan;
  const parts: string[] = [];
  const chains = [`[0:v]fps=${fps},${vf},setsar=1,format=yuv420p,split=2[s0][s1]`];
  if (span.from > 0) {
    chains.push(`[s0]trim=end_frame=${span.from},setpts=PTS-STARTPTS[pre]`);
    parts.push('[pre]');
  } else chains.push('[s0]nullsink');
  chains.push(`[1:v]setsar=1,format=yuv420p,setpts=PTS-STARTPTS[mid]`);
  parts.push('[mid]');
  if (span.to < total) {
    chains.push(`[s1]trim=start_frame=${span.to}:end_frame=${total},setpts=PTS-STARTPTS[post]`);
    parts.push('[post]');
  } else chains.push('[s1]nullsink');
  chains.push(`${parts.join('')}concat=n=${parts.length}:v=1:a=0[v]`);
  return [
    '-y',
    '-i', o.source,
    '-i', o.clip,
    '-filter_complex', chains.join(';'),
    '-map', '[v]',
    ...(o.hasAudio ? ['-map', '0:a:0', ...AUDIO(o.audioCodec)] : []),
    ...X264, '-preset', o.preset ?? 'veryfast', '-crf', '17',
    '-r', String(fps),
    '-frames:v', String(total),
    '-t', (total / fps).toFixed(6),
    '-movflags', '+faststart',
    o.output,
  ];
};

/**
 * Copy route, step 1: the clip re-encoded to sit between pieces of your video: same profile, and its own
 * parameter-set id (1; your video uses 0), so players never mix up the two encoders' settings at a join.
 */
export const clipForCopyArgs = (clip: string, output: string, profile: string, colorTagged: boolean): string[] => [
  '-y', '-i', clip,
  // Tagged like your video: an untagged video next to a tagged clip could shift colors at the joins in some players.
  '-map', '0:v:0', ...(colorTagged ? X264 : X264.slice(0, 4)),
  ...(/^(baseline|constrained baseline|main|high)$/i.test(profile) ? ['-profile:v', profile.toLowerCase().replace('constrained ', '')] : []),
  '-preset', 'medium', '-crf', '16',
  '-x264-params', 'sps-id=1',
  '-f', 'mpegts', output,
];

/** Copy route, step 2: a piece of your video, as is, from frame `from` (a keyframe) for `frames` frames. */
export const copyPieceArgs = (source: string, output: string, from: number, frames: number, fps: number, shift = 0): string[] => [
  '-y',
  // Half a frame past the keyframe: the seek lands exactly on it (`shift`: when the video starts after the audio).
  ...(from > 0 ? ['-ss', (shift + (from + 0.5) / fps).toFixed(6)] : []),
  '-i', source,
  '-map', '0:v:0', '-c:v', 'copy', '-frames:v', String(frames),
  '-bsf:v', 'h264_mp4toannexb', '-f', 'mpegts', output,
];

/** Copy route, step 3: the pieces joined (no re-encode) with your original audio underneath. */
export const copyJoinArgs = (o: { list: string; source: string; output: string; total: number; fps: number; hasAudio: boolean; audioCodec: string }): string[] => [
  '-y',
  '-f', 'concat', '-safe', '0', '-i', o.list,
  '-i', o.source,
  '-map', '0:v:0', '-c:v', 'copy',
  ...(o.hasAudio ? ['-map', '1:a:0', ...AUDIO(o.audioCodec)] : []),
  '-t', (o.total / o.fps).toFixed(6),
  '-movflags', '+faststart',
  o.output,
];

/** A line of the concat list: the path quoted the way FFmpeg reads it. */
export const concatLine = (file: string) => `file '${file.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`;

/**
 * Overall progress of a fast export: drawing a frame in Remotion costs far more than FFmpeg re-encoding one,
 * so each part weighs what it takes. Copying is almost free.
 */
export const fastProgress = (o: { span: number; rest: number; copy: boolean; rendered: number; joined: number }): number => {
  const ffWeight = o.copy ? 0.02 : 0.15;
  const totalCost = o.span + o.rest * ffWeight;
  return Math.min(1, (o.rendered * o.span + o.joined * o.rest * ffWeight) / Math.max(1, totalCost));
};
