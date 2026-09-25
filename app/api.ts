import type { CaptionWord } from '../src/lib/captions.ts';
import type { Lang } from '../src/lib/i18n.ts';
import type { MediaRef } from '../src/lib/types.ts';

export type ExportFormat = 'mp4' | 'prores' | 'png';
export type ExportScale = 1 | 2;
export type JobState = {
  id: string;
  status: 'preparing' | 'rendering' | 'done' | 'error' | 'cancelled';
  progress: number;
  output: string | null;
  error: string | null;
};

/** UI language: sent on every request so the server answers errors in it. */
let apiLang: Lang = 'en';
export const setApiLang = (lang: Lang) => {
  apiLang = lang;
};

const headers = (extra?: Record<string, string>): Record<string, string> => ({ 'x-lang': apiLang, ...extra });
const JSON_TYPE = { 'Content-Type': 'application/json' };

const ok = async <T,>(res: Response): Promise<T> => {
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? `Error ${res.status}`);
  return body as T;
};

export const listMedia = () => fetch('/api/media', { headers: headers() }).then((r) => ok<MediaRef[]>(r));

export const uploadMedia = (file: File) =>
  fetch('/api/upload', {
    method: 'POST',
    headers: headers({ 'x-filename': encodeURIComponent(file.name) }),
    body: file,
  }).then((r) => ok<MediaRef>(r));

export const startExport = (effectId: string, props: Record<string, unknown>, format: ExportFormat, scale: ExportScale) =>
  fetch('/api/export', {
    method: 'POST',
    headers: headers(JSON_TYPE),
    body: JSON.stringify({ effectId, props, format, scale }),
  }).then((r) => ok<{ id: string }>(r));

export const getExport = (id: string) => fetch(`/api/export/${id}`, { headers: headers() }).then((r) => ok<JobState>(r));
export const cancelExport = (id: string) => fetch(`/api/export/${id}/cancel`, { method: 'POST', headers: headers() });
export const openExports = () => fetch('/api/open-exports', { method: 'POST', headers: headers() });

export type TranscribeModel = 'base' | 'small' | 'medium';
export type TranscribeLang = 'es' | 'en' | 'auto';
export type TranscribeState = {
  id: string;
  status: 'installing' | 'downloading' | 'transcribing' | 'done' | 'error';
  progress: number;
  words: CaptionWord[] | null;
  error: string | null;
};

export const startTranscribe = (name: string, model: TranscribeModel, lang: TranscribeLang) =>
  fetch('/api/transcribe', {
    method: 'POST',
    headers: headers(JSON_TYPE),
    body: JSON.stringify({ name, model, lang }),
  }).then((r) => ok<{ id: string }>(r));

export const getTranscribe = (id: string) =>
  fetch(`/api/transcribe/${id}`, { headers: headers() }).then((r) => ok<TranscribeState>(r));
