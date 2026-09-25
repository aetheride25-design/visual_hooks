// Local server for the app. It only listens on 127.0.0.1: your files never leave your PC.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { createServer as createVite } from 'vite';
import { tr, type Lang } from '../src/lib/i18n.ts';
import { browserPlan, isTrustedRequest, mediaKind, probeMedia, safeName, serveFile, transcodeArgs } from './files.ts';
import { cancelJob, EXPORT_DIR, getJob, startExport, type ExportFormat } from './render.ts';
import { runFfmpeg } from './ffmpeg.ts';
import { getTranscribeJob, startTranscription, WHISPER_MODELS, type TranscribeLang, type WhisperModel } from './transcribe.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const MEDIA_DIR = path.join(ROOT, 'media');
const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT ?? 3210);
const ORIGIN = `http://localhost:${PORT}`;

fs.mkdirSync(MEDIA_DIR, { recursive: true });

/** UI language of the request (the app sends it in `x-lang`), for error messages. */
const langOf = (req: http.IncomingMessage): Lang => (req.headers['x-lang'] === 'es' ? 'es' : 'en');

const json = (res: http.ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
};

const MAX_JSON = 1_000_000;
const readJson = async (req: http.IncomingMessage): Promise<any> => {
  if (!String(req.headers['content-type'] ?? '').startsWith('application/json')) throw new Error('Expected JSON');
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > MAX_JSON) throw new Error('Request too large');
    chunks.push(c as Buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
};

const mediaRef = (name: string) => {
  const { width, height, durationSec } = probeMedia(path.join(MEDIA_DIR, name));
  return {
    name,
    kind: mediaKind(name)!,
    src: `${ORIGIN}/media/${encodeURIComponent(name)}`,
    width,
    height,
    ...(durationSec ? { durationSec } : {}),
  };
};

const uniqueName = (name: string): string => {
  const ext = path.extname(name);
  const stem = name.slice(0, name.length - ext.length);
  let candidate = name;
  for (let i = 2; fs.existsSync(path.join(MEDIA_DIR, candidate)); i++) candidate = `${stem}-${i}${ext}`;
  return candidate;
};

/**
 * If the browser can't read the uploaded video (e.g. ProRes), converts it with your FFmpeg
 * and keeps only the converted copy in media/ (your original file is untouched).
 */
const makeBrowserReadable = async (name: string): Promise<string> => {
  if (mediaKind(name) !== 'video') return name;
  const file = path.join(MEDIA_DIR, name);
  const { codec, pixFmt } = probeMedia(file);
  const plan = browserPlan(codec, pixFmt);
  if (!plan) return name;
  const stem = name.slice(0, name.length - path.extname(name).length);
  const out = uniqueName(`${stem}${plan === 'webm-alpha' ? '.webm' : '.mp4'}`);
  console.log(`Converting ${name} (${codec}, ${pixFmt}) → ${out}`);
  try {
    await runFfmpeg(transcodeArgs(plan, file, path.join(MEDIA_DIR, out)));
  } finally {
    fs.rmSync(file, { force: true });
  }
  return out;
};

const mediaList = () =>
  fs.readdirSync(MEDIA_DIR).flatMap((name) => {
    if (!mediaKind(name)) return [];
    try {
      return [mediaRef(name)];
    } catch (err) {
      console.warn((err as Error).message);
      return [];
    }
  });

/** Opens a folder in the system file manager. */
const openFolder = (dir: string) => {
  const cmd = process.platform === 'win32' ? 'explorer.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  spawn(cmd, [dir], { detached: true, stdio: 'ignore' }).on('error', () => undefined).unref();
};

const vite = await createVite({
  configFile: path.join(ROOT, 'vite.config.ts'),
  server: { middlewareMode: true },
  appType: 'spa',
});

const api = async (req: http.IncomingMessage, res: http.ServerResponse): Promise<boolean> => {
  const url = new URL(req.url ?? '/', ORIGIN);
  const p = url.pathname;
  const lang = langOf(req);
  const fail = (status: number, en: string, es: string) => (json(res, status, { error: tr({ en, es }, lang) }), true);

  if (p.startsWith('/media/') && (req.method === 'GET' || req.method === 'HEAD')) {
    return serveFile(req, res, MEDIA_DIR, decodeURIComponent(p.slice('/media/'.length)));
  }
  if (p === '/api/media' && req.method === 'GET') return json(res, 200, mediaList()), true;

  if (p === '/api/upload' && req.method === 'POST') {
    const name = uniqueName(safeName(decodeURIComponent(String(req.headers['x-filename'] ?? ''))));
    if (!mediaKind(name))
      return fail(
        400,
        'Only videos (mp4, mov, webm, mkv), images (png, jpg, webp, gif) or audio (mp3, wav, m4a, ogg, flac).',
        'Solo videos (mp4, mov, webm, mkv), imágenes (png, jpg, webp, gif) o audios (mp3, wav, m4a, ogg, flac).',
      );
    const file = path.join(MEDIA_DIR, name);
    await pipeline(req, fs.createWriteStream(file));
    try {
      return json(res, 200, mediaRef(await makeBrowserReadable(name))), true;
    } catch (err) {
      fs.rmSync(file, { force: true });
      console.error(err);
      return fail(400, `FFmpeg couldn't read or convert ${name}.`, `FFmpeg no pudo leer o convertir ${name}.`);
    }
  }

  if (p === '/api/export' && req.method === 'POST') {
    const body = await readJson(req);
    const format = body.format as ExportFormat;
    if (!['mp4', 'prores', 'png'].includes(format)) return fail(400, 'Invalid format', 'Formato inválido');
    const job = startExport(String(body.effectId), body.props ?? {}, format);
    return json(res, 200, { id: job.id }), true;
  }
  const jobMatch = /^\/api\/export\/([\w.-]+)(\/cancel)?$/.exec(p);
  if (jobMatch) {
    if (jobMatch[2] && req.method === 'POST') return json(res, 200, { ok: cancelJob(jobMatch[1]) }), true;
    const job = getJob(jobMatch[1]);
    if (!job) return fail(404, 'No such export', 'No existe ese export');
    const { cancel, ...visible } = job;
    return json(res, 200, visible), true;
  }

  if (p === '/api/transcribe' && req.method === 'POST') {
    const body = await readJson(req);
    const name = path.basename(String(body.name ?? ''));
    const file = path.join(MEDIA_DIR, name);
    const kind = mediaKind(name);
    if ((kind !== 'video' && kind !== 'audio') || !fs.existsSync(file))
      return fail(400, 'Pick a video or audio file with a voice.', 'Elige un video o audio con voz.');
    const model = WHISPER_MODELS.includes(body.model) ? (body.model as WhisperModel) : 'small';
    const speech: TranscribeLang = ['es', 'en', 'auto'].includes(body.lang) ? body.lang : 'es';
    return json(res, 200, { id: startTranscription(file, model, speech, lang).id }), true;
  }
  const trMatch = /^\/api\/transcribe\/([\w-]+)$/.exec(p);
  if (trMatch && req.method === 'GET') {
    const job = getTranscribeJob(trMatch[1]);
    return job ? (json(res, 200, job), true) : fail(404, 'No such transcription', 'No existe esa transcripción');
  }

  if (p === '/api/open-exports' && req.method === 'POST') {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
    openFolder(EXPORT_DIR);
    return json(res, 200, { ok: true }), true;
  }
  return false;
};

http
  .createServer(async (req, res) => {
    try {
      if (!isTrustedRequest(req.headers.host, req.headers.origin, PORT)) {
        res.writeHead(403);
        res.end('Local use only');
        return;
      }
      if (await api(req, res)) return;
      vite.middlewares(req, res, () => {
        res.statusCode = 404;
        res.end('Not found');
      });
    } catch (err) {
      console.error(err);
      if (!res.headersSent) json(res, 500, { error: (err as Error).message });
    }
  })
  .listen(PORT, HOST, () => console.log(`\n  Visual Hooks ready at ${ORIGIN}\n`));
