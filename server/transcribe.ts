// Local transcription with Whisper (whisper.cpp): gets the timing of every word for the captions.
// The first time it installs whisper.cpp and downloads the model into .whisper/ (git-ignored). Nothing leaves your PC.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { downloadWhisperModel, installWhisperCpp, toCaptions, transcribe, type Language } from '@remotion/install-whisper-cpp';
import { wordsFromTokens, type CaptionWord } from '../src/lib/captions.ts';
import { tr, type Lang } from '../src/lib/i18n.ts';
import { runFfmpeg } from './ffmpeg.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const WHISPER_DIR = path.join(ROOT, '.whisper');
// 1.5.5: the version Remotion recommends; on Windows it downloads a ready-made binary, no compiling.
const WHISPER_VERSION = '1.5.5';
const WHISPER_BIN = path.join(WHISPER_DIR, `whisper.cpp-${WHISPER_VERSION}`);

export type WhisperModel = 'base' | 'small' | 'medium';
export const WHISPER_MODELS: WhisperModel[] = ['base', 'small', 'medium'];
/** Language spoken in the video. */
export type TranscribeLang = 'es' | 'en' | 'auto';

export type TranscribeJob = {
  id: string;
  status: 'installing' | 'downloading' | 'transcribing' | 'done' | 'error';
  progress: number;
  words: CaptionWord[] | null;
  error: string | null;
};

const jobs = new Map<string, TranscribeJob>();
let counter = 0;
export const getTranscribeJob = (id: string) => jobs.get(id);

/** Where a video's transcript is saved (next to it in media/, so it's never redone). */
const cacheFile = (mediaFile: string, model: WhisperModel, speech: TranscribeLang) =>
  `${mediaFile}.${model}.${speech}.captions.json`;

/** Audio to 16 kHz mono WAV, the format whisper.cpp requires. */
const extractAudio = async (input: string, output: string, ui: Lang) => {
  try {
    await runFfmpeg(['-y', '-i', input, '-vn', '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', output]);
  } catch (err) {
    if (/does not contain any stream|matches no streams/.test((err as Error).message))
      throw new Error(tr({ en: 'This video has no audio.', es: 'Este video no tiene audio.' }, ui));
    throw err;
  }
};

// One transcription at a time: whisper uses every core and two at once would only be slower.
let queue: Promise<unknown> = Promise.resolve();

/** `ui` is the app's language, for error messages. */
export const startTranscription = (mediaFile: string, model: WhisperModel, speech: TranscribeLang, ui: Lang): TranscribeJob => {
  const id = `tr-${Date.now()}-${++counter}`;
  const job: TranscribeJob = { id, status: 'installing', progress: 0, words: null, error: null };
  jobs.set(id, job);

  const cached = cacheFile(mediaFile, model, speech);
  if (fs.existsSync(cached)) {
    job.words = JSON.parse(fs.readFileSync(cached, 'utf8'));
    job.status = 'done';
    job.progress = 1;
    return job;
  }

  const run = async () => {
    fs.mkdirSync(WHISPER_DIR, { recursive: true });
    try {
      await installWhisperCpp({ to: WHISPER_BIN, version: WHISPER_VERSION, printOutput: true });
    } catch (err) {
      // Half-finished install (e.g. you closed the app): delete it so the next try starts clean.
      fs.rmSync(WHISPER_BIN, { recursive: true, force: true });
      throw err;
    }
    job.status = 'downloading';
    await downloadWhisperModel({
      model,
      folder: WHISPER_DIR,
      printOutput: false,
      onProgress: (done, total) => (job.progress = total ? done / total : 0),
    });

    job.status = 'transcribing';
    job.progress = 0;
    const wav = path.join(os.tmpdir(), `hooks-${id}.wav`);
    try {
      await extractAudio(mediaFile, wav, ui);
      const out = await transcribe({
        inputPath: wav,
        whisperPath: WHISPER_BIN,
        whisperCppVersion: WHISPER_VERSION,
        model,
        modelFolder: WHISPER_DIR,
        tokenLevelTimestamps: true,
        splitOnWord: true,
        language: speech === 'auto' ? null : (speech as Language),
        printOutput: false,
        onProgress: (p) => (job.progress = p),
      });
      const words = wordsFromTokens(toCaptions({ whisperCppOutput: out }).captions);
      if (!words.length) throw new Error(tr({ en: 'Whisper found no speech in this file.', es: 'Whisper no encontró voz en este video.' }, ui));
      fs.writeFileSync(cached, JSON.stringify(words));
      job.words = words;
      job.progress = 1;
      job.status = 'done';
    } finally {
      fs.rmSync(wav, { force: true });
    }
  };

  queue = queue.then(run).catch((err: Error) => {
    job.status = 'error';
    job.error = err.message;
    console.error(`[transcription ${id}]`, err);
  });
  return job;
};
