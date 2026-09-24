import fs from 'node:fs';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { makeCancelSignal, renderFrames, renderMedia, selectComposition } from '@remotion/renderer';

export type ExportFormat = 'mp4' | 'prores' | 'png';

export type Job = {
  id: string;
  effectId: string;
  format: ExportFormat;
  status: 'preparando' | 'renderizando' | 'listo' | 'error' | 'cancelado';
  progress: number;
  output: string | null;
  error: string | null;
  cancel: () => void;
};

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const ENTRY = path.join(SRC, 'remotion', 'index.ts');
export const EXPORT_DIR = path.join(ROOT, 'exports');

// El bundle se reutiliza mientras no cambie el código de la biblioteca.
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
    // Si falla, se olvida solo este bundle (no uno más nuevo que ya lo reemplazó).
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

/** Fecha y hora local (la de tu PC) para nombrar el archivo: 20260923-214501. */
const stamp = () => {
  const d = new Date();
  const two = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${two(d.getMonth() + 1)}${two(d.getDate())}-${two(d.getHours())}${two(d.getMinutes())}${two(d.getSeconds())}`;
};

export const startExport = (effectId: string, props: Record<string, unknown>, format: ExportFormat): Job => {
  // El contador evita que dos exports en el mismo segundo se pisen.
  const id = `${effectId}-${stamp()}-${++counter}-${format}`;
  const { cancelSignal, cancel } = makeCancelSignal();
  const job: Job = { id, effectId, format, status: 'preparando', progress: 0, output: null, error: null, cancel };
  jobs.set(id, job);

  // MP4 siempre con fondo de marca (H.264 no guarda transparencia).
  // ProRes y PNG son para montar encima en DaVinci: siempre sin fondo.
  const inputProps = { ...props, transparent: format !== 'mp4' };
  const cancelled = () => job.status === 'cancelado';

  (async () => {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
    const serveUrl = await getBundle();
    if (cancelled()) return;
    const composition = await selectComposition({ serveUrl, id: effectId, inputProps });
    if (cancelled()) return;
    job.status = 'renderizando';

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
    job.status = 'listo';
  })().catch((err: Error) => {
    job.status = job.status === 'cancelado' ? 'cancelado' : 'error';
    job.error = err.message;
    console.error(`[export ${id}]`, err);
  });

  return job;
};

export const cancelJob = (id: string): boolean => {
  const job = jobs.get(id);
  if (!job || (job.status !== 'preparando' && job.status !== 'renderizando')) return false;
  job.status = 'cancelado';
  job.cancel();
  return true;
};
