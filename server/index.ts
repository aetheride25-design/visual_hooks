// Servidor local de la mini app. Solo escucha en 127.0.0.1: tus archivos no salen de tu PC.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { createServer as createVite } from 'vite';
import { browserPlan, isTrustedRequest, mediaKind, probeMedia, safeName, serveFile, transcodeArgs } from './files.ts';
import { cancelJob, EXPORT_DIR, getJob, startExport, type ExportFormat } from './render.ts';
import { getTranscribeJob, startTranscription, WHISPER_MODELS, type TranscribeLang, type WhisperModel } from './transcribe.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const MEDIA_DIR = path.join(ROOT, 'media');
const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT ?? 3210);
const ORIGIN = `http://localhost:${PORT}`;

fs.mkdirSync(MEDIA_DIR, { recursive: true });

const json = (res: http.ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
};

const MAX_JSON = 1_000_000;
const readJson = async (req: http.IncomingMessage): Promise<any> => {
  if (!String(req.headers['content-type'] ?? '').startsWith('application/json')) throw new Error('Se esperaba JSON');
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > MAX_JSON) throw new Error('Petición demasiado grande');
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

const runFfmpeg = (args: string[]) =>
  new Promise<void>((resolve, reject) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err.trim() || `FFmpeg salió con código ${code}`))));
  });

/**
 * Si el navegador no puede leer el video subido (p. ej. ProRes), lo convierte con tu FFmpeg
 * y deja solo la versión convertida en media/ (tu archivo original no se toca).
 */
const makeBrowserReadable = async (name: string): Promise<string> => {
  if (mediaKind(name) !== 'video') return name;
  const file = path.join(MEDIA_DIR, name);
  const { codec, pixFmt } = probeMedia(file);
  const plan = browserPlan(codec, pixFmt);
  if (!plan) return name;
  const stem = name.slice(0, name.length - path.extname(name).length);
  const out = uniqueName(`${stem}${plan === 'webm-alpha' ? '.webm' : '.mp4'}`);
  console.log(`Convirtiendo ${name} (${codec}, ${pixFmt}) → ${out}`);
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

const uniqueName = (name: string): string => {
  const ext = path.extname(name);
  const stem = name.slice(0, name.length - ext.length);
  let candidate = name;
  for (let i = 2; fs.existsSync(path.join(MEDIA_DIR, candidate)); i++) candidate = `${stem}-${i}${ext}`;
  return candidate;
};

const vite = await createVite({
  configFile: path.join(ROOT, 'vite.config.ts'),
  server: { middlewareMode: true },
  appType: 'spa',
});

const api = async (req: http.IncomingMessage, res: http.ServerResponse): Promise<boolean> => {
  const url = new URL(req.url ?? '/', ORIGIN);
  const p = url.pathname;

  if (p.startsWith('/media/') && (req.method === 'GET' || req.method === 'HEAD')) {
    return serveFile(req, res, MEDIA_DIR, decodeURIComponent(p.slice('/media/'.length)));
  }
  if (p === '/api/media' && req.method === 'GET') return json(res, 200, mediaList()), true;

  if (p === '/api/upload' && req.method === 'POST') {
    const name = uniqueName(safeName(decodeURIComponent(String(req.headers['x-filename'] ?? ''))));
    const kind = mediaKind(name);
    if (!kind) return json(res, 400, { error: 'Solo videos (mp4, mov, webm, mkv) o imágenes (png, jpg, webp, gif).' }), true;
    const file = path.join(MEDIA_DIR, name);
    await pipeline(req, fs.createWriteStream(file));
    try {
      return json(res, 200, mediaRef(await makeBrowserReadable(name))), true;
    } catch (err) {
      fs.rmSync(file, { force: true });
      console.error(err);
      return json(res, 400, { error: `FFmpeg no pudo leer o convertir ${name}.` }), true;
    }
  }

  if (p === '/api/export' && req.method === 'POST') {
    const body = await readJson(req);
    const format = body.format as ExportFormat;
    if (!['mp4', 'prores', 'png'].includes(format)) return json(res, 400, { error: 'Formato inválido' }), true;
    const job = startExport(String(body.effectId), body.props ?? {}, format);
    return json(res, 200, { id: job.id }), true;
  }
  const jobMatch = /^\/api\/export\/([\w.-]+)(\/cancel)?$/.exec(p);
  if (jobMatch) {
    if (jobMatch[2] && req.method === 'POST') return json(res, 200, { ok: cancelJob(jobMatch[1]) }), true;
    const job = getJob(jobMatch[1]);
    if (!job) return json(res, 404, { error: 'No existe ese export' }), true;
    const { cancel, ...visible } = job;
    return json(res, 200, visible), true;
  }
  if (p === '/api/transcribe' && req.method === 'POST') {
    const body = await readJson(req);
    const name = path.basename(String(body.name ?? ''));
    const file = path.join(MEDIA_DIR, name);
    if (mediaKind(name) !== 'video' || !fs.existsSync(file)) return json(res, 400, { error: 'Elige un video con voz.' }), true;
    const model = WHISPER_MODELS.includes(body.model) ? (body.model as WhisperModel) : 'small';
    const lang: TranscribeLang = ['es', 'en', 'auto'].includes(body.lang) ? body.lang : 'es';
    return json(res, 200, { id: startTranscription(file, model, lang).id }), true;
  }
  const trMatch = /^\/api\/transcribe\/([\w-]+)$/.exec(p);
  if (trMatch && req.method === 'GET') {
    const job = getTranscribeJob(trMatch[1]);
    return job ? json(res, 200, job) : json(res, 404, { error: 'No existe esa transcripción' }), true;
  }
  if (p === '/api/open-exports' && req.method === 'POST') {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
    spawn('explorer.exe', [EXPORT_DIR], { detached: true, stdio: 'ignore' }).unref();
    return json(res, 200, { ok: true }), true;
  }
  return false;
};

http
  .createServer(async (req, res) => {
    try {
      if (!isTrustedRequest(req.headers.host, req.headers.origin, PORT)) {
        res.writeHead(403);
        res.end('Solo para uso local');
        return;
      }
      if (await api(req, res)) return;
      vite.middlewares(req, res, () => {
        res.statusCode = 404;
        res.end('No encontrado');
      });
    } catch (err) {
      console.error(err);
      if (!res.headersSent) json(res, 500, { error: (err as Error).message });
    }
  })
  .listen(PORT, HOST, () => console.log(`\n  Hooks visuales listo en ${ORIGIN}\n`));
