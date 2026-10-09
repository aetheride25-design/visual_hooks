// Renders the landing's effect clips with the app's own export pipeline.
// Usage: start the app (`pnpm dev`), drop a sample clip into it, then:
//   node site/scripts/render-media.ts sample-code-screen.mp4 [effect-id ...]
// Writes site/media/effects/<id>.mp4 (small, silent, looping) and <id>.jpg (poster) for every effect
// listed in site/effects.js, or only the ids you pass. Needs FFmpeg on your PATH.
import fs from 'node:fs';
import path from 'node:path';
import { runFfmpeg } from '../../server/ffmpeg.ts';

const SITE = path.resolve(import.meta.dirname, '..');
const OUT = path.join(SITE, 'media', 'effects');
const API = `http://localhost:${process.env.PORT ?? 3210}`;

const [sampleName, ...only] = process.argv.slice(2);
if (!sampleName) throw new Error('Pass the name of a video already in media/, e.g. sample-code-screen.mp4');

const listed = [...fs.readFileSync(path.join(SITE, 'effects.js'), 'utf8').matchAll(/\bid: '([\w-]+)'/g)].map((m) => m[1]);
const ids = only.length ? only : listed;

const call = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(`${API}${url}`, init);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
  return body as T;
};

const exportMp4 = async (effectId: string, props: Record<string, unknown>): Promise<string> => {
  const { id } = await call<{ id: string }>('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-lang': 'en' },
    body: JSON.stringify({ effectId, props, format: 'mp4' }),
  });
  for (;;) {
    await new Promise((r) => setTimeout(r, 500));
    const job = await call<{ status: string; output: string | null; error: string | null }>(`/api/export/${id}`);
    if (job.status === 'done') return job.output!;
    if (job.status === 'error' || job.status === 'cancelled') throw new Error(`${effectId}: ${job.error ?? job.status}`);
  }
};

const media = (await call<{ name: string }[]>('/api/media')).find((m) => m.name === sampleName);
if (!media) throw new Error(`${sampleName} isn't in media/`);
fs.mkdirSync(OUT, { recursive: true });

for (const id of ids) {
  const mp4 = await exportMp4(id, { media, fps: 30 });
  const out = path.join(OUT, `${id}.mp4`);
  // 400 px wide is enough for a gallery tile at 2x; CRF 28 keeps each clip around 100–300 KB.
  await runFfmpeg(['-y', '-i', mp4, '-an', '-vf', 'scale=400:-2:flags=lanczos', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-crf', '28', '-preset', 'slow', '-movflags', '+faststart', out]);
  // Poster from late in the clip, when the effect has landed.
  await runFfmpeg(['-y', '-sseof', '-0.4', '-i', out, '-frames:v', '1', '-q:v', '5', path.join(OUT, `${id}.jpg`)]);
  console.log(`✓ site/media/effects/${id}.mp4`);
}
