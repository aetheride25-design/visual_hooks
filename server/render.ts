import fs from 'node:fs';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { makeCancelSignal, renderFrames, renderMedia, selectComposition } from '@remotion/renderer';

export type ExportFormat = 'mp4' | 'prores' | 'png';

export type Job = {
  id: string;
  effectId: string;
  format: ExportFormat;
  status: 'preparing' | 'rendering' | 'done' | 'error' | 'cancelled';
  progress: number;
  output: string | null;
  error: string | null;
  cancel: () => void;
};

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const ENTRY = path.join(SRC, 'remotion', 'index.ts');
export const EXPORT_DIR = path.join(ROOT, 'exports');

// The bundle is reused as long as the library code doesn't change.
let cached: { stamp: number; url: Promise<string> } | null = null;
const newestMtime = (dir: string): number =>
  fs.readdirSync(dir, { withFileTypes: true }).reduce((max, e) => {
    const full = path.join(dir, e.name);
    return Math.max(max, e.isDirectory() ? newestMtime(full) : fs.statSync(full).mtimeMs);
  }, 0);

const getBundle = (): Promise<string> => {
  const stamp = newestMtime(SRC);
  if (!cached || cached.stamp !== stamp) {
    const url = bundle({ entryPoint: ENTRY });
    // On failure, forget only this bundle (not a newer one that already replaced it).
    url.catch(() => {
      if (cached?.url === url) cached = null;
    });
    cached = { stamp, url };
  }
  return cached.url;
};

const jobs = new Map<string, Job>();
let counter = 0;
export const getJob = (id: string) => jobs.get(id);

/** Local date and time (your PC's) to name the file: 20260923-214501. */
const stamp = () => {
  const d = new Date();
  const two = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${two(d.getMonth() + 1)}${two(d.getDate())}-${two(d.getHours())}${two(d.getMinutes())}${two(d.getSeconds())}`;
};

export const startExport = (effectId: string, props: Record<string, unknown>, format: ExportFormat): Job => {
  // The counter keeps two exports in the same second from overwriting each other.
  const id = `${effectId}-${stamp()}-${++counter}-${format}`;
  const { cancelSignal, cancel } = makeCancelSignal();
  const job: Job = { id, effectId, format, status: 'preparing', progress: 0, output: null, error: null, cancel };
  jobs.set(id, job);

  // MP4 always has the background (H.264 can't store transparency).
  // ProRes and PNG are for layering in an editor: always without background.
  const inputProps = { ...props, transparent: format !== 'mp4' };
  const cancelled = () => job.status === 'cancelled';

  (async () => {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
    const serveUrl = await getBundle();
    if (cancelled()) return;
    const composition = await selectComposition({ serveUrl, id: effectId, inputProps });
    if (cancelled()) return;
    job.status = 'rendering';

    if (format === 'png') {
      const outputDir = path.join(EXPORT_DIR, id);
      await renderFrames({
        serveUrl,
        composition,
        inputProps,
        outputDir,
        imageFormat: 'png',
        cancelSignal,
        onStart: () => undefined,
        onFrameUpdate: (done) => (job.progress = done / composition.durationInFrames),
      });
      job.output = outputDir;
    } else {
      const outputLocation = path.join(EXPORT_DIR, `${id}.${format === 'mp4' ? 'mp4' : 'mov'}`);
      await renderMedia({
        serveUrl,
        composition,
        inputProps,
        outputLocation,
        cancelSignal,
        onProgress: ({ progress }) => (job.progress = progress),
        ...(format === 'mp4'
          ? ({ codec: 'h264', imageFormat: 'jpeg', jpegQuality: 95, crf: 16, pixelFormat: 'yuv420p' } as const)
          : ({ codec: 'prores', proResProfile: '4444', pixelFormat: 'yuva444p10le', imageFormat: 'png' } as const)),
      });
      job.output = outputLocation;
    }
    job.progress = 1;
    job.status = 'done';
  })().catch((err: Error) => {
    job.status = job.status === 'cancelled' ? 'cancelled' : 'error';
    job.error = err.message;
    console.error(`[export ${id}]`, err);
  });

  return job;
};

export const cancelJob = (id: string): boolean => {
  const job = jobs.get(id);
  if (!job || (job.status !== 'preparing' && job.status !== 'rendering')) return false;
  job.status = 'cancelled';
  job.cancel();
  return true;
};
