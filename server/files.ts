import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import type { IncomingMessage, ServerResponse } from 'node:http';

export const VIDEO_EXT = ['.mp4', '.mov', '.webm', '.mkv', '.m4v'];
export const IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

const MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export const mediaKind = (name: string): 'video' | 'image' | null => {
  const ext = path.extname(name).toLowerCase();
  if (VIDEO_EXT.includes(ext)) return 'video';
  if (IMAGE_EXT.includes(ext)) return 'image';
  return null;
};

export type Probe = { width: number; height: number; codec: string; pixFmt: string };

/** Tamaño, códec y formato de píxel del video o imagen, leídos con el ffprobe de tu FFmpeg. Se cachea por archivo. */
const probeCache = new Map<string, { mtime: number; probe: Probe }>();
export const probeMedia = (file: string): Probe => {
  const mtime = fs.statSync(file).mtimeMs;
  const hit = probeCache.get(file);
  if (hit && hit.mtime === mtime) return hit.probe;
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,codec_name,pix_fmt', '-of', 'json', file],
    { encoding: 'utf8' },
  );
  const s = JSON.parse(out).streams?.[0] ?? {};
  const probe: Probe = { width: Number(s.width), height: Number(s.height), codec: String(s.codec_name ?? ''), pixFmt: String(s.pix_fmt ?? '') };
  if (!probe.width || !probe.height) throw new Error(`No pude leer el tamaño de ${path.basename(file)}`);
  probeCache.set(file, { mtime, probe });
  return probe;
};

/** Códecs de video que Chrome decodifica (vista previa y render). ProRes no está. */
const BROWSER_CODECS = ['h264', 'vp8', 'vp9', 'av1'];

/** ¿El formato de píxel trae canal alfa (transparencia)? */
export const hasAlpha = (pixFmt: string): boolean => /^(yuva|rgba|bgra|argb|abgr|gbrap|ya)/.test(pixFmt);

/**
 * Qué hacer con un video subido para que el navegador lo lea:
 * - null: sirve tal cual.
 * - 'webm-alpha': convertir a WebM VP9 conservando la transparencia (p. ej. ProRes 4444).
 * - 'mp4': convertir a MP4 H.264 (p. ej. ProRes sin transparencia).
 */
export const browserPlan = (codec: string, pixFmt: string): 'webm-alpha' | 'mp4' | null => {
  if (BROWSER_CODECS.includes(codec)) return null;
  return hasAlpha(pixFmt) ? 'webm-alpha' : 'mp4';
};

/** Argumentos de FFmpeg para esa conversión (sin audio: los videos se usan en silencio). */
export const transcodeArgs = (plan: 'webm-alpha' | 'mp4', input: string, output: string): string[] =>
  plan === 'webm-alpha'
    ? ['-y', '-i', input, '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '18', '-row-mt', '1',
       '-deadline', 'good', '-cpu-used', '2', '-auto-alt-ref', '0', '-g', '30', '-an', output]
    : ['-y', '-i', input, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'medium', '-g', '30', '-an', output];

/** Nombre seguro para guardar en disco: sin rutas, sin caracteres raros. */
export const safeName = (raw: string): string => {
  const base = path.basename(raw.replace(/\\/g, '/'));
  const ext = path.extname(base).toLowerCase();
  const stem = base
    .slice(0, base.length - ext.length)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${stem || 'archivo'}${ext}`;
};

/** Origen de una página servida desde esta misma PC (la app o el render de Remotion). */
export const isLocalOrigin = (origin: string): boolean => /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(origin);

/**
 * Protege el servidor de otras webs abiertas en tu navegador:
 * - Host tiene que ser este servidor (frena el "DNS rebinding").
 * - Si la petición trae Origin, tiene que ser local (frena los POST desde webs ajenas).
 */
export const isTrustedRequest = (host: string | undefined, origin: string | undefined, port: number): boolean => {
  if (host !== `localhost:${port}` && host !== `127.0.0.1:${port}`) return false;
  return origin === undefined || isLocalOrigin(origin);
};

/** Interpreta la cabecera Range (necesaria para que el video se pueda adelantar en la vista previa). */
export const parseRange = (header: string | undefined, size: number): { start: number; end: number } | null => {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === '' && m[2] === '')) return null;
  let start: number;
  let end: number;
  if (m[1] === '') {
    start = Math.max(0, size - Number(m[2]));
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start > end || start >= size) return null;
  return { start, end };
};

/** Sirve un archivo dentro de `dir` con soporte de Range. Devuelve false si no existe. */
export const serveFile = (req: IncomingMessage, res: ServerResponse, dir: string, relName: string): boolean => {
  const file = path.resolve(dir, relName);
  if (!file.startsWith(path.resolve(dir) + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    return false;
  }
  const size = fs.statSync(file).size;
  const type = MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
  // El render (Chrome headless en otro puerto local) lee el video con fetch: solo se permite a orígenes locales.
  const origin = req.headers.origin;
  const headers: Record<string, string> = {
    'Content-Type': type,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-cache',
    Vary: 'Origin',
    ...(origin && isLocalOrigin(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
  };
  const range = parseRange(req.headers.range, size);
  if (req.headers.range && !range) {
    res.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}` });
    res.end();
    return true;
  }
  if (range) {
    res.writeHead(206, {
      ...headers,
      'Content-Range': `bytes ${range.start}-${range.end}/${size}`,
      'Content-Length': range.end - range.start + 1,
    });
    if (req.method === 'HEAD') return res.end(), true;
    fs.createReadStream(file, range).pipe(res);
  } else {
    res.writeHead(200, { ...headers, 'Content-Length': size });
    if (req.method === 'HEAD') return res.end(), true;
    fs.createReadStream(file).pipe(res);
  }
  return true;
};
