import { spawn } from 'node:child_process';

/** Runs your FFmpeg quietly; rejects with its error output if it fails. */
export const runFfmpeg = (args: string[]) =>
  new Promise<void>((resolve, reject) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err.trim() || `FFmpeg exited with code ${code}`))));
  });
