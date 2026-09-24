import type { MediaRef } from '../src/lib/types.ts';

export type ExportFormat = 'mp4' | 'prores' | 'png';
export type JobState = {
  id: string;
  status: 'preparando' | 'renderizando' | 'listo' | 'error' | 'cancelado';
  progress: number;
  output: string | null;
  error: string | null;
};

const ok = async <T,>(res: Response): Promise<T> => {
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? `Error ${res.status}`);
  return body as T;
};

export const listMedia = () => fetch('/api/media').then((r) => ok<MediaRef[]>(r));

export const uploadMedia = (file: File) =>
  fetch('/api/upload', {
    method: 'POST',
    headers: { 'x-filename': encodeURIComponent(file.name) },
    body: file,
  }).then((r) => ok<MediaRef>(r));

export const startExport = (effectId: string, props: Record<string, unknown>, format: ExportFormat) =>
  fetch('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ effectId, props, format }),
  }).then((r) => ok<{ id: string }>(r));

export const getExport = (id: string) => fetch(`/api/export/${id}`).then((r) => ok<JobState>(r));
export const cancelExport = (id: string) => fetch(`/api/export/${id}/cancel`, { method: 'POST' });
export const openExports = () => fetch('/api/open-exports', { method: 'POST' });
