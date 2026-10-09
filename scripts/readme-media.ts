// Renders the README GIFs with the app's own export pipeline.
// Usage: start the app (`pnpm dev`), drop a sample clip into it, then:
//   node scripts/readme-media.ts sample-code-screen.mp4 [sample-video.mp4]
// The optional second file is used by the effects that go over a video of you (freeze frame, comment reply…).
// Writes docs/media/<effect>.gif, and docs/media/hero.gif on Windows (its labels use a Windows font).
// Needs FFmpeg on your PATH.
import fs from 'node:fs';
import path from 'node:path';
import { runFfmpeg } from '../server/ffmpeg.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'docs', 'media');
const API = `http://localhost:${process.env.PORT ?? 3210}`;
const HOOKS = [
  'focus-snap',
  'punch-zoom',
  'text-drop',
  'window-3d',
  'arrow-circle',
  'before-after-cut',
  'glitch',
  'notification',
  'red-strike',
  'prompt-typing',
  'stopwatch',
  'freeze-frame',
  'spotlight',
  'cursor-click',
  'comment-reply',
  'top-list',
  'poll',
];
/** These look best over a video (they freeze it or sit on top of it). */
const OVER_VIDEO = new Set(['freeze-frame', 'comment-reply', 'top-list', 'poll']);

const [sampleName, videoName] = process.argv.slice(2);
if (!sampleName) throw new Error('Pass the name of a video already in media/, e.g. sample-code-screen.mp4');

const call = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(`${API}${url}`, init);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
  return body as T;
};

/** Exports one effect as MP4 through the app's server and returns the file path. */
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

/** Small looping GIF with its own palette (keeps the colors clean at a few hundred KB). */
const toGif = (input: string, output: string, width: number, fps = 15, extraFilter = '') =>
  runFfmpeg([
    '-y',
    '-i',
    input,
    '-filter_complex',
    `${extraFilter}fps=${fps},scale=${width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,
    output,
  ]);

const all = await call<{ name: string }[]>('/api/media');
const media = all.find((m) => m.name === sampleName);
if (!media) throw new Error(`${sampleName} isn't in media/`);
const video = videoName ? all.find((m) => m.name === videoName) : media;
if (!video) throw new Error(`${videoName} isn't in media/`);
fs.mkdirSync(OUT, { recursive: true });

// One GIF per hook: "effect only", over the sample clip.
for (const id of HOOKS) {
  const mp4 = await exportMp4(id, { media: OVER_VIDEO.has(id) ? video : media, fps: 30 });
  await toGif(mp4, path.join(OUT, `${id}.gif`), 270);
  console.log(`✓ docs/media/${id}.gif`);
}

if (process.platform !== 'win32') {
  console.log('Skipping hero.gif (its labels use a Windows font).');
  process.exit(0);
}

// Hero: the same clip without a hook and with one, side by side.
const totalSec = 5;
const plain = await exportMp4('no-effect', { media, fps: 30, durationSec: totalSec, timeline: { startSec: 0, effectSec: totalSec } });
const hooked = await exportMp4('red-strike', {
  media,
  fps: 30,
  durationSec: totalSec,
  timeline: { startSec: 0, effectSec: 2.4 },
  showMedia: true,
});
const label = (text: string) =>
  `drawtext=text='${text}':fontfile='C\\:/Windows/Fonts/segoeuib.ttf':fontsize=64:fontcolor=white:box=1:boxcolor=0x0a0b0dcc:boxborderw=24:x=(w-text_w)/2:y=90`;
const sideBySide = path.join(ROOT, 'exports', 'hero-side-by-side.mp4');
await runFfmpeg([
  '-y',
  '-i',
  plain,
  '-i',
  hooked,
  '-filter_complex',
  `[0:v]${label('without hook')}[l];[1:v]${label('with hook')}[r];[l][r]hstack=inputs=2`,
  '-an',
  sideBySide,
]);
await toGif(sideBySide, path.join(OUT, 'hero.gif'), 540, 15);
console.log('✓ docs/media/hero.gif');
