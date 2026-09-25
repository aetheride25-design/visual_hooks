// Export: format, progress and the output path.
import React, { useEffect, useState } from 'react';
import { cancelExport, getExport, openExports, startExport, type ExportFormat, type JobState } from '../api.ts';
import { useLang, type StringKey } from '../i18n.tsx';

const FORMATS: { value: ExportFormat; label: StringKey; hint: StringKey; timedHint: StringKey }[] = [
  { value: 'mp4', label: 'mp4Label', hint: 'mp4Hint', timedHint: 'mp4Timed' },
  { value: 'prores', label: 'proresLabel', hint: 'proresHint', timedHint: 'proresTimed' },
  { value: 'png', label: 'pngLabel', hint: 'pngHint', timedHint: 'pngTimed' },
];

export const ExportPanel: React.FC<{
  effectId: string;
  effectName: string;
  props: Record<string, unknown>;
  size: { width: number; height: number };
  /** "Apply to my video": changes what each format explains. */
  timed: boolean;
}> = ({ effectId, effectName, props, size, timed }) => {
  const { t } = useLang();
  const [format, setFormat] = useState<ExportFormat>('mp4');
  // Each export remembers its effect: after switching effects the last result stays visible, but labeled.
  const [job, setJob] = useState<(JobState & { effectName: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = job?.status === 'preparing' || job?.status === 'rendering';

  useEffect(() => {
    if (!busy || !job) return;
    const timer = setInterval(() => getExport(job.id).then((j) => setJob({ ...j, effectName: job.effectName })).catch((e) => setError(e.message)), 500);
    return () => clearInterval(timer);
  }, [busy, job?.id]);

  const run = async () => {
    setError(null);
    try {
      const { id } = await startExport(effectId, props, format);
      setJob({ id, status: 'preparing', progress: 0, output: null, error: null, effectName });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <section className="panel export">
      <h2>{t('exportTitle', { w: size.width, h: size.height })}</h2>
      <div className="formats">
        {FORMATS.map((f) => (
          <button key={f.value} className={format === f.value ? 'on' : ''} onClick={() => setFormat(f.value)}>
            <strong>{t(f.label)}</strong>
            <span>{t(timed ? f.timedHint : f.hint)}</span>
          </button>
        ))}
      </div>
      {busy ? (
        <button className="primary ghost" onClick={() => cancelExport(job!.id)}>
          {t('cancel')}
        </button>
      ) : (
        <button className="primary" onClick={run}>
          {t('exportAt', { fps: String(props.fps) })}
        </button>
      )}
      {job && (
        <div className="job">
          <div className="bar">
            <div style={{ width: `${Math.round(job.progress * 100)}%` }} />
          </div>
          <span>
            <b>{job.effectName}</b>{' · '}
            {job.status === 'preparing' && t('preparing')}
            {job.status === 'rendering' && t('rendering', { p: Math.round(job.progress * 100) })}
            {job.status === 'done' && t('done')}
            {job.status === 'cancelled' && t('cancelled')}
            {job.status === 'error' && `${t('error')}: ${job.error}`}
          </span>
          {job.output && <code>{job.output}</code>}
        </div>
      )}
      {error && <div className="job error">{error}</div>}
      <button className="link" onClick={() => openExports()}>
        {t('openExports')}
      </button>
    </section>
  );
};
