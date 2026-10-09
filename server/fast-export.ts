// Runs the fast MP4 export planned in smart.ts: Remotion draws only the span, FFmpeg joins your video around it.
import fs from 'node:fs';
import path from 'node:path';
import { renderMedia } from '@remotion/renderer';
import type { VideoConfig } from 'remotion';
import { runFfmpeg, runFfprobe } from './ffmpeg.ts';
import {
  clipForCopyArgs,
  concatLine,
  copyJoinArgs,
  copyPieceArgs,
  fastProgress,
  joinReencodeArgs,
  snapToKeyframes,
  type FastPlan,
  type SourceInfo,
  type Span,
} from './smart.ts';

type Plan = Extract<FastPlan, { fast: true }>;

/** Your video's file on disk, from the URL the app gave it (only files in media/). */
export const sourceFile = (src: unknown, mediaDir: string): string | null => {
  if (typeof src !== 'string') return null;
  try {
    const { pathname } = new URL(src, 'http://localhost');
    if (!pathname.startsWith('/media/')) return null;
    const name = path.basename(decodeURIComponent(pathname.slice('/media/'.length)));
    const file = path.join(mediaDir, name);
    return fs.existsSync(file) ? file : null;
  } catch {
    return null;
  }
};

type Probed = SourceInfo & { videoStart: number; formatStart: number };

/** What the plan needs to know about your video. */
export const probeSource = async (file: string): Promise<Probed> => {
  const json = JSON.parse(
    await runFfprobe([
      '-show_entries',
      'stream=codec_type,codec_name,width,height,pix_fmt,profile,r_frame_rate,avg_frame_rate,color_space,start_time:stream_side_data=rotation:stream_tags=rotate:format=start_time',
      '-of',
      'json',
      file,
    ]),
  );
  const streams: any[] = json.streams ?? [];
  const v = streams.find((s) => s.codec_type === 'video') ?? {};
  const a = streams.find((s) => s.codec_type === 'audio');
  const rotation = Number(v.side_data_list?.find((d: any) => d.rotation !== undefined)?.rotation ?? v.tags?.rotate ?? 0) || 0;
  return {
    width: Number(v.width) || 0,
    height: Number(v.height) || 0,
    codec: String(v.codec_name ?? ''),
    pixFmt: String(v.pix_fmt ?? ''),
    profile: String(v.profile ?? ''),
    rFrameRate: String(v.r_frame_rate ?? '0/1'),
    avgFrameRate: String(v.avg_frame_rate ?? '0/1'),
    rotation,
    colorSpace: String(v.color_space ?? ''),
    hasAudio: !!a,
    audioCodec: String(a?.codec_name ?? ''),
    videoStart: Number(v.start_time) || 0,
    formatStart: Number(json.format?.start_time) || 0,
  };
};

/** Frame numbers of your video's keyframes, and how many frames it has (read from the packets, nothing is decoded). */
const keyframesOf = async (file: string, fps: number, videoStart: number): Promise<{ keys: number[]; frames: number }> => {
  const out = await runFfprobe(['-select_streams', 'v:0', '-show_entries', 'packet=pts_time,flags', '-of', 'csv=p=0', file]);
  const lines = out.split('\n').filter((l) => l.includes(','));
  const keys = lines
    .filter((l) => /,K/.test(l))
    .map((l) => Math.round((Number(l.split(',')[0]) - videoStart) * fps))
    .filter((n) => Number.isFinite(n) && n >= 0);
  return { keys, frames: lines.length };
};

/** Is the joined file sound? Exact frame count, and the seams decode without errors. */
const checkJoin = async (file: string, total: number, seams: number[], fps: number): Promise<string | null> => {
  const count = Number(
    (
      await runFfprobe(['-select_streams', 'v:0', '-count_packets', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', file])
    ).trim(),
  );
  if (count !== total) return `frame count ${count}, expected ${total}`;
  for (const seam of seams) {
    const at = Math.max(0, seam / fps - 3);
    const err = await new Promise<string>((resolve) => {
      runFfmpeg(['-err_detect', 'explode', '-ss', at.toFixed(3), '-i', file, '-t', '6', '-map', '0:v:0', '-f', 'null', '-'])
        .then(() => resolve(''))
        .catch((e: Error) => resolve(e.message));
    });
    if (err) return `decode error near frame ${seam}: ${err.slice(0, 300)}`;
  }
  return null;
};

export type FastResult = { route: 'copy' | 'reencode'; span: Span; ms: { render: number; join: number } };

export const runFastExport = async (o: {
  serveUrl: string;
  composition: VideoConfig;
  inputProps: Record<string, unknown>;
  scale: 1 | 2;
  cancelSignal: (cb: () => void) => void;
  source: string;
  info: Probed;
  plan: Plan;
  output: string;
  onProgress: (p: number) => void;
}): Promise<FastResult> => {
  const { plan, info, source } = o;
  // Hidden next to the export while it works; removed at the end.
  const work = path.join(path.dirname(o.output), `.${path.basename(o.output)}.parts`);
  fs.rmSync(work, { recursive: true, force: true });
  fs.mkdirSync(work, { recursive: true });
  const clip = path.join(work, 'span.mp4');
  try {
    let copy = plan.copy;
    let span = plan.span;
    // Your video can end a frame or two before the export (when its audio runs longer): the copy keeps what there is.
    let sourceFrames = plan.total;
    if (copy) {
      const { keys, frames } = await keyframesOf(source, plan.fps, info.videoStart);
      span = snapToKeyframes(keys, plan.span, plan.total);
      sourceFrames = frames;
    }
    const spanLen = span.to - span.from;
    const rest = plan.total - spanLen;
    let rendered = 0;
    const report = (joined: number) => o.onProgress(fastProgress({ span: spanLen, rest, copy, rendered, joined }));

    // 1. Remotion draws only the span (muted: the audio comes whole from your video).
    const t0 = Date.now();
    await renderMedia({
      serveUrl: o.serveUrl,
      composition: o.composition,
      inputProps: o.inputProps,
      outputLocation: clip,
      scale: o.scale,
      cancelSignal: o.cancelSignal,
      frameRange: [span.from, span.to - 1],
      muted: true,
      codec: 'h264',
      imageFormat: 'jpeg',
      jpegQuality: 95,
      // On the copy route it's encoded once more to fit between the pieces: start almost lossless.
      crf: copy ? 10 : 16,
      pixelFormat: 'yuv420p',
      colorSpace: 'bt709',
      onProgress: ({ progress }) => {
        rendered = progress;
        report(0);
      },
    });
    const t1 = Date.now();

    // 2a. Copy route: your video's pieces as they are, the clip in between, your audio underneath.
    if (copy) {
      try {
        const mid = path.join(work, 'mid.ts');
        await runFfmpeg(clipForCopyArgs(clip, mid, info.profile, info.colorSpace === 'bt709'), { cancelSignal: o.cancelSignal });
        const pieces: string[] = [];
        const postFrames = Math.max(0, Math.min(plan.total, sourceFrames) - span.to);
        if (span.from > 0) {
          const pre = path.join(work, 'pre.ts');
          await runFfmpeg(copyPieceArgs(source, pre, 0, span.from, plan.fps), { cancelSignal: o.cancelSignal });
          pieces.push(pre);
        }
        pieces.push(mid);
        if (postFrames > 0) {
          const post = path.join(work, 'post.ts');
          const shift = info.videoStart - info.formatStart;
          await runFfmpeg(copyPieceArgs(source, post, span.to, postFrames, plan.fps, shift), { cancelSignal: o.cancelSignal });
          pieces.push(post);
        }
        const list = path.join(work, 'list.txt');
        fs.writeFileSync(list, pieces.map(concatLine).join('\n') + '\n');
        await runFfmpeg(
          copyJoinArgs({
            list,
            source,
            output: o.output,
            total: plan.total,
            fps: plan.fps,
            hasAudio: info.hasAudio,
            audioCodec: info.audioCodec,
          }),
          { cancelSignal: o.cancelSignal },
        );
        const seams = [span.from, span.to].filter((f) => f > 0 && f < plan.total);
        const problem = await checkJoin(o.output, span.to + postFrames, seams, plan.fps);
        if (!problem) return { route: 'copy', span, ms: { render: t1 - t0, join: Date.now() - t1 } };
        throw new Error(problem);
      } catch (err) {
        if ((err as Error).message === 'Cancelled') throw err;
        // Something about your file didn't join cleanly: re-encode the rest instead (the clip is reused).
        console.warn(`[fast export] copy join rejected (${(err as Error).message}); re-encoding the rest`);
        copy = false;
      }
    }

    // 2b. Re-encode route: one FFmpeg pass frames your video around the clip.
    await runFfmpeg(
      joinReencodeArgs({ source, clip, output: o.output, plan: { ...plan, span }, audioCodec: info.audioCodec, hasAudio: info.hasAudio }),
      { cancelSignal: o.cancelSignal, onFrame: (f) => report(Math.min(1, f / plan.total)) },
    );
    return { route: 'reencode', span, ms: { render: t1 - t0, join: Date.now() - t1 } };
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
};
