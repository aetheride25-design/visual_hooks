import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import type { IncomingMessage, ServerResponse } from 'node:http';

export const VIDEO_EXT = ['.mp4', '.mov', '.webm', '.mkv', '.m4v'];
export const IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
export const AUDIO_EXT = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.opus', '.flac'];

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
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.flac': 'audio/flac',
};

export const mediaKind = (name: string): 'video' | 'image' | 'audio' | null => {
  const ext = path.extname(name).toLowerCase();
  if (VIDEO_EXT.includes(ext)) return 'video';
  if (IMAGE_EXT.includes(ext)) return 'image';
  if (AUDIO_EXT.includes(ext)) return 'audio';
  return null;
};

export type Probe = { width: number; height: number; codec: string; pixFmt: string; durationSec: number | null };

/** Size, codec, pixel format and duration of the video, image or audio, read with your FFmpeg's ffprobe. Cached per file. */
const probeCache = new Map<string, { mtime: number; probe: Probe }>();
export const probeMedia = (file: string): Probe => {
  const mtime = fs.statSync(file).mtimeMs;
  const hit = probeCache.get(file);
  if (hit && hit.mtime === mtime) return hit.probe;
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,codec_name,pix_fmt:format=duration', '-of', 'json', file],
    { encoding: 'utf8' },
  );
  const json = JSON.parse(out);
  const s = json.streams?.[0] ?? {};
  const duration = Number(json.format?.duration);
  const kind = mediaKind(file);
  const probe: Probe = {
    width: Number(s.width),
    height: Number(s.height),
    codec: String(s.codec_name ?? ''),
    pixFmt: String(s.pix_fmt ?? ''),
    durationSec: kind !== 'image' && Number.isFinite(duration) && duration > 0 ? duration : null,
  };
  // Audio has no size (or only cover art): a duration is enough.
  if (kind === 'audio') {
    if (!probe.durationSec) throw new Error(`Couldn't read the duration of ${path.basename(file)}`);
    Object.assign(probe, { width: 0, height: 0 });
  } else if (!probe.width || !probe.height) throw new Error(`Couldn't read the size of ${path.basename(file)}`);
  probeCache.set(file, { mtime, probe });
  return probe;
};

/** Video codecs Chrome decodes (preview and render). ProRes isn't one. */
const BROWSER_CODECS = ['h264', 'vp8', 'vp9', 'av1'];

/** Does the pixel format carry an alpha channel (transparency)? */
export const hasAlpha = (pixFmt: string): boolean => /^(yuva|rgba|bgra|argb|abgr|gbrap|ya)/.test(pixFmt);

/**
 * What to do with an uploaded video so the browser can read it:
 * - null: serve as is.
 * - 'webm-alpha': convert to WebM VP9 keeping transparency (e.g. ProRes 4444).
 * - 'mp4': convert to MP4 H.264 (e.g. ProRes without transparency).
 */
export const browserPlan = (codec: string, pixFmt: string): 'webm-alpha' | 'mp4' | null => {
  if (BROWSER_CODECS.includes(codec)) return null;
  return hasAlpha(pixFmt) ? 'webm-alpha' : 'mp4';
};

/**
 * FFmpeg arguments for that conversion.
 * The audio is kept (if any): captions need it to transcribe and for the final MP4.
 */
export const transcodeArgs = (plan: 'webm-alpha' | 'mp4', input: string, output: string): string[] =>
  plan === 'webm-alpha'
    ? ['-y', '-i', input, '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '18', '-row-mt', '1',
       '-deadline', 'good', '-cpu-used', '2', '-auto-alt-ref', '0', '-g', '30', '-c:a', 'libopus', '-b:a', '160k', output]
    : ['-y', '-i', input, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'medium', '-g', '30',
       '-c:a', 'aac', '-b:a', '192k', output];

/** Safe name to store on disk: no paths, no odd characters. */
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
  return `${stem || 'file'}${ext}`;
};

/** Origin of a page served from this same PC (the app or the Remotion render). */
export const isLocalOrigin = (origin: string): boolean => /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(origin);

/**
 * Protects the server from other sites open in your browser:
 * - Host must be this server (stops "DNS rebinding").
 * - If the request has an Origin, it must be local (stops POSTs from other sites).
 */
export const isTrustedRequest = (host: string | undefined, origin: string | undefined, port: number): boolean => {
  if (host !== `localhost:${port}` && host !== `127.0.0.1:${port}`) return false;
  return origin === undefined || isLocalOrigin(origin);
};

/** Parses the Range header (needed to seek the video in the preview). */
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

/** Serves a file inside `dir` with Range support. Returns false if it doesn't exist. */
export const serveFile = (req: IncomingMessage, res: ServerResponse, dir: string, relName: string): boolean => {
  const file = path.resolve(dir, relName);
  if (!file.startsWith(path.resolve(dir) + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    return false;
  }
  const size = fs.statSync(file).size;
  const type = MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
  // The render (headless Chrome on another local port) fetches the video: only local origins are allowed.
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
