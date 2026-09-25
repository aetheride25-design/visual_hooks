// Captions: transcribe with Whisper and fix words.
import React, { useEffect, useState } from 'react';
import type { MediaRef } from '../../src/lib/types.ts';
import { editWord, formatMs, toSrt, toVtt, type CaptionWord } from '../../src/lib/captions.ts';
import { getTranscribe, startTranscribe, type TranscribeLang, type TranscribeModel, type TranscribeState } from '../api.ts';
import { useLang, type StringKey } from '../i18n.tsx';

const TR_STATUS: Record<TranscribeState['status'], StringKey> = {
  installing: 'trInstalling',
  downloading: 'trDownloading',
  transcribing: 'trTranscribing',
  done: 'done',
  error: 'error',
};

const MODELS: [TranscribeModel, StringKey][] = [
  ['base', 'modelFast'],
  ['small', 'modelGood'],
  ['medium', 'modelBest'],
];

const LANGS: [TranscribeLang, StringKey][] = [
  ['es', 'langEs'],
  ['en', 'langEn'],
  ['auto', 'langAuto'],
];

export const CaptionsEditor: React.FC<{
  video: MediaRef | null;
  words: CaptionWord[];
  wordsFor: string;
  offsetMs: number;
  onChange: (words: CaptionWord[], wordsFor: string) => void;
  onSeek: (ms: number) => void;
}> = ({ video, words, wordsFor, offsetMs, onChange, onSeek }) => {
  const { lang: uiLang, t } = useLang();
  const [model, setModel] = useState<TranscribeModel>('small');
  // Spoken language: starts as the UI language.
  const [lang, setLang] = useState<TranscribeLang>(uiLang);
  const [job, setJob] = useState<TranscribeState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = job !== null && job.status !== 'done' && job.status !== 'error';
  const isAudio = video?.kind === 'audio';
  const hasVoice = video?.kind === 'video' || isAudio;

  useEffect(() => {
    if (!busy || !job) return;
    const name = video?.name ?? '';
    const timer = setInterval(
      () =>
        getTranscribe(job.id)
          .then((j) => {
            setJob(j);
            if (j.status === 'done' && j.words) onChange(j.words, name);
          })
          .catch((e) => setError(e.message)),
      700,
    );
    return () => clearInterval(timer);
  }, [busy, job?.id]);

  const run = async () => {
    if (!video) return;
    setError(null);
    try {
      const { id } = await startTranscribe(video.name, model, lang);
      setJob({ id, status: 'installing', progress: 0, words: null, error: null });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const mine = hasVoice && wordsFor === video.name;

  /** Downloads the transcript as a subtitle file, with the same "Shift earlier / later" as the preview. */
  const download = (format: 'srt' | 'vtt') => {
    if (!video) return;
    const text = format === 'srt' ? toSrt(words, 7, offsetMs) : toVtt(words, 7, offsetMs);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    a.download = `${video.name.replace(/\.[^.]+$/, '')}.${format}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  return (
    <div className="field captions">
      <span>{t('transcript')}</span>
      <div className="segmented">
        {MODELS.map(([v, l]) => (
          <button key={v} className={model === v ? 'on' : ''} onClick={() => setModel(v)} title={t('whisperModel', { v })}>
            {t(l)}
          </button>
        ))}
      </div>
      <div className="segmented">
        {LANGS.map(([v, l]) => (
          <button key={v} className={lang === v ? 'on' : ''} onClick={() => setLang(v)}>
            {t(l)}
          </button>
        ))}
      </div>
      <button className="primary" disabled={!hasVoice || busy} onClick={run}>
        {busy ? t('transcribing') : mine ? t('transcribeAgain') : t('transcribeMine', { kind: isAudio ? 'audio' : 'video' })}
      </button>
      {!hasVoice && <small>{t('pickVoice')}</small>}
      {hasVoice && wordsFor && !mine && <small>{t('otherFile', { file: wordsFor })}</small>}
      {mine && words.length > 0 && (
        <div className="downloads">
          <button className="primary ghost" onClick={() => download('srt')} title={t('srtHint')}>
            ⬇ SRT
          </button>
          <button className="primary ghost" onClick={() => download('vtt')} title={t('vttHint')}>
            ⬇ VTT
          </button>
        </div>
      )}
      {job && job.status !== 'done' && (
        <div className="job">
          <div className="bar">
            <div style={{ width: `${Math.round(job.progress * 100)}%` }} />
          </div>
          <span>
            {t(TR_STATUS[job.status])}
            {(job.status === 'downloading' || job.status === 'transcribing') && ` ${Math.round(job.progress * 100)} %`}
            {job.status === 'error' && `: ${job.error}`}
          </span>
        </div>
      )}
      {error && <div className="job error">{error}</div>}
      {words.length > 0 && (
        <>
          <small>{t('editHint')}</small>
          <div className="words">
            {words.map((w, i) => (
              <div key={`${i}-${w.startMs}-${w.text}`} className="word">
                <button className="link" onClick={() => onSeek(w.startMs)}>
                  {formatMs(w.startMs)}
                </button>
                <input
                  defaultValue={w.text}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                  onBlur={(e) => e.target.value !== w.text && onChange(editWord(words, i, e.target.value), wordsFor)}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
