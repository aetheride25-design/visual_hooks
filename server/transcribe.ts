// Transcripción local con Whisper (whisper.cpp): saca el tiempo de cada palabra para los subtítulos.
// La primera vez instala whisper.cpp y baja el modelo en .whisper/ (queda fuera de git). Nada sale de tu PC.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { downloadWhisperModel, installWhisperCpp, toCaptions, transcribe, type Language } from '@remotion/install-whisper-cpp';
import { wordsFromTokens, type CaptionWord } from '../src/lib/captions.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const WHISPER_DIR = path.join(ROOT, '.whisper');
// 1.5.5: la versión que Remotion recomienda; en Windows baja un binario listo, sin compilar.
const WHISPER_VERSION = '1.5.5';
const WHISPER_BIN = path.join(WHISPER_DIR, `whisper.cpp-${WHISPER_VERSION}`);

export type WhisperModel = 'base' | 'small' | 'medium';
export const WHISPER_MODELS: WhisperModel[] = ['base', 'small', 'medium'];
export type TranscribeLang = 'es' | 'en' | 'auto';

export type TranscribeJob = {
  id: string;
  status: 'instalando' | 'descargando' | 'transcribiendo' | 'listo' | 'error';
  progress: number;
  words: CaptionWord[] | null;
  error: string | null;
};

const jobs = new Map<string, TranscribeJob>();
let counter = 0;
export const getTranscribeJob = (id: string) => jobs.get(id);

/** Dónde se guarda la transcripción de un video (junto a él en media/, para no repetirla). */
const cacheFile = (mediaFile: string, model: WhisperModel, lang: TranscribeLang) =>
  `${mediaFile}.${model}.${lang}.captions.json`;

/** Audio a WAV mono de 16 kHz, el formato que exige whisper.cpp. */
const extractAudio = (input: string, output: string) =>
  new Promise<void>((resolve, reject) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', input, '-vn', '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', output], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('error', reject);
    p.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(/does not contain any stream|matches no streams/.test(err) ? 'Este video no tiene audio.' : err.trim() || `FFmpeg salió con código ${code}`)),
    );
  });

// Una transcripción a la vez: whisper usa todos los núcleos y dos juntas solo irían más lento.
let queue: Promise<unknown> = Promise.resolve();

export const startTranscription = (mediaFile: string, model: WhisperModel, lang: TranscribeLang): TranscribeJob => {
  const id = `tr-${Date.now()}-${++counter}`;
  const job: TranscribeJob = { id, status: 'instalando', progress: 0, words: null, error: null };
  jobs.set(id, job);

  const cached = cacheFile(mediaFile, model, lang);
  if (fs.existsSync(cached)) {
    job.words = JSON.parse(fs.readFileSync(cached, 'utf8'));
    job.status = 'listo';
    job.progress = 1;
    return job;
  }

  const run = async () => {
    fs.mkdirSync(WHISPER_DIR, { recursive: true });
    try {
      await installWhisperCpp({ to: WHISPER_BIN, version: WHISPER_VERSION, printOutput: true });
    } catch (err) {
      // Instalación a medias (p. ej. cerraste la app): se borra para que el próximo intento empiece de cero.
      fs.rmSync(WHISPER_BIN, { recursive: true, force: true });
      throw err;
    }
    job.status = 'descargando';
    await downloadWhisperModel({
      model,
      folder: WHISPER_DIR,
      printOutput: false,
      onProgress: (done, total) => (job.progress = total ? done / total : 0),
    });

    job.status = 'transcribiendo';
    job.progress = 0;
    const wav = path.join(os.tmpdir(), `hooks-${id}.wav`);
    try {
      await extractAudio(mediaFile, wav);
      const out = await transcribe({
        inputPath: wav,
        whisperPath: WHISPER_BIN,
        whisperCppVersion: WHISPER_VERSION,
        model,
        modelFolder: WHISPER_DIR,
        tokenLevelTimestamps: true,
        splitOnWord: true,
        language: lang === 'auto' ? null : (lang as Language),
        printOutput: false,
        onProgress: (p) => (job.progress = p),
      });
      const words = wordsFromTokens(toCaptions({ whisperCppOutput: out }).captions);
      if (!words.length) throw new Error('Whisper no encontró voz en este video.');
      fs.writeFileSync(cached, JSON.stringify(words));
      job.words = words;
      job.progress = 1;
      job.status = 'listo';
    } finally {
      fs.rmSync(wav, { force: true });
    }
  };

  queue = queue.then(run).catch((err: Error) => {
    job.status = 'error';
    job.error = err.message;
    console.error(`[transcripción ${id}]`, err);
  });
  return job;
};
