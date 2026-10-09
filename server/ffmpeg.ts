import { spawn } from 'node:child_process';

type RunOptions = {
  /** Called with each frame number FFmpeg reports writing. */
  onFrame?: (frame: number) => void;
  /** Registers a callback that stops FFmpeg (e.g. Remotion's cancel signal). */
  cancelSignal?: (cb: () => void) => void;
};

/** Runs your FFmpeg quietly; rejects with its error output if it fails. */
export const runFfmpeg = (args: string[], o: RunOptions = {}) =>
  new Promise<void>((resolve, reject) => {
    const progress = o.onFrame ? ['-progress', 'pipe:1', '-nostats'] : [];
    const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...progress, ...args], {
      stdio: ['ignore', o.onFrame ? 'pipe' : 'ignore', 'pipe'],
    });
    let err = '';
    let killed = false;
    p.stderr?.on('data', (d) => (err += d));
    p.stdout?.on('data', (d: Buffer) => {
      for (const m of String(d).matchAll(/^frame=(\d+)/gm)) o.onFrame?.(Number(m[1]));
    });
    o.cancelSignal?.(() => {
      killed = true;
      p.kill('SIGKILL');
    });
    p.on('error', reject);
    p.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(killed ? 'Cancelled' : err.trim() || `FFmpeg exited with code ${code}`));
    });
  });

/** Runs ffprobe and returns what it prints. */
export const runFfprobe = (args: string[]) =>
  new Promise<string>((resolve, reject) => {
    const p = spawn('ffprobe', ['-v', 'error', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    const out: Buffer[] = [];
    let err = '';
    p.stdout.on('data', (d: Buffer) => out.push(d));
    p.stderr.on('data', (d) => (err += d));
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve(Buffer.concat(out).toString('utf8')) : reject(new Error(err.trim() || `ffprobe exited with code ${code}`))));
  });
