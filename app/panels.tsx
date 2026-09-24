import React, { useEffect, useRef, useState } from 'react';
import type { PlayerRef } from '@remotion/player';
import { aurora, paletteColors, type PaletteColor } from '../src/brand.ts';
import type { EffectDef, MediaRef, ParamDef } from '../src/lib/types.ts';
import { cancelExport, getExport, openExports, startExport, type ExportFormat, type JobState } from './api.ts';

/* ---------- Medios: arrastrar y soltar + lista ---------- */

export const MediaPanel: React.FC<{
  media: MediaRef[];
  selected: MediaRef | null;
  onSelect: (m: MediaRef | null) => void;
  onFiles: (files: File[]) => void;
  uploading: boolean;
}> = ({ media, selected, onSelect, onFiles, uploading }) => {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <section className="panel">
      <h2>Tu video o imagen</h2>
      <div
        className={`drop ${over ? 'over' : ''}`}
        onDragOver={(e) => (e.preventDefault(), setOver(true))}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          onFiles([...e.dataTransfer.files]);
        }}
        onClick={() => input.current?.click()}
      >
        {uploading ? 'Copiando (y convirtiendo si es ProRes)…' : 'Arrastra aquí o haz clic'}
        <small>Se guarda en la carpeta media/ de este proyecto</small>
        <input
          ref={input}
          type="file"
          accept="video/*,image/*"
          multiple
          hidden
          onChange={(e) => onFiles([...(e.target.files ?? [])])}
        />
      </div>
      <div className="media-list">
        <button className={`media-item ${selected === null ? 'on' : ''}`} onClick={() => onSelect(null)}>
          <span className="thumb demo">demo</span>
          <span>Pantalla de ejemplo</span>
        </button>
        {media.map((m) => (
          <button key={m.src} className={`media-item ${selected?.src === m.src ? 'on' : ''}`} onClick={() => onSelect(m)}>
            {m.kind === 'video' ? (
              <video className="thumb" src={`${m.src}#t=0.5`} muted preload="metadata" />
            ) : (
              <img className="thumb" src={m.src} alt="" />
            )}
            <span title={m.name}>{m.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

/* ---------- Lista de hooks y efectos ---------- */

export const EffectList: React.FC<{
  effects: EffectDef<any>[];
  selected: string;
  onSelect: (id: string) => void;
}> = ({ effects, selected, onSelect }) => {
  const group = (g: EffectDef['group'], title: string) => (
    <>
      <h3>{title}</h3>
      {effects
        .filter((e) => e.group === g)
        .map((e) => (
          <button key={e.id} className={`effect ${selected === e.id ? 'on' : ''}`} onClick={() => onSelect(e.id)}>
            <strong>{e.name}</strong>
            <span>{e.description}</span>
          </button>
        ))}
    </>
  );
  return (
    <section className="panel effects">
      {group('hook', 'Hooks visuales · 0–2 s')}
      {group('apoyo', 'Efectos de apoyo')}
      {group('pieza', 'Piezas animadas')}
    </section>
  );
};

/* ---------- Controles de parámetros ---------- */

const Swatches: React.FC<{ value: PaletteColor; onChange: (c: PaletteColor) => void }> = ({ value, onChange }) => (
  <div className="swatches">
    {paletteColors.map((c) => (
      <button
        key={c}
        title={c}
        className={`swatch ${value === c ? 'on' : ''}`}
        style={{ background: aurora[c] }}
        onClick={() => onChange(c)}
      />
    ))}
  </div>
);

export const Field: React.FC<{
  def: ParamDef;
  value: unknown;
  media: MediaRef[];
  onChange: (v: unknown) => void;
}> = ({ def, value, media, onChange }) => {
  switch (def.type) {
    case 'text':
      return (
        <label className="field">
          <span>{def.label}</span>
          {def.multiline ? (
            <textarea rows={3} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
          ) : (
            <input type="text" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
          )}
        </label>
      );
    case 'color':
      return (
        <div className="field">
          <span>{def.label}</span>
          <Swatches value={value as PaletteColor} onChange={onChange} />
        </div>
      );
    case 'number':
      return (
        <label className="field">
          <span>
            {def.label}
            <input
              className="num"
              type="number"
              min={def.min}
              max={def.max}
              step={def.step}
              value={Number(value)}
              onChange={(e) => {
                const n = Number(e.target.value);
                // Nunca fuera de rango: velocidad 0 o decimales negativos rompen el render.
                if (e.target.value !== '' && Number.isFinite(n)) onChange(Math.min(def.max, Math.max(def.min, n)));
              }}
            />
          </span>
          <input
            type="range"
            min={def.min}
            max={def.max}
            step={def.step}
            value={Number(value)}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </label>
      );
    case 'select':
      return (
        <div className="field">
          <span>{def.label}</span>
          <div className="segmented">
            {def.options.map((o) => (
              <button key={o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      );
    case 'boolean':
      return (
        <label className="field toggle">
          <span>{def.label}</span>
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
        </label>
      );
    case 'media': {
      const current = value as MediaRef | null;
      return (
        <label className="field">
          <span>{def.label}</span>
          <select
            value={current?.src ?? ''}
            onChange={(e) => onChange(media.find((m) => m.src === e.target.value) ?? null)}
          >
            <option value="">Pantalla de ejemplo</option>
            {media.map((m) => (
              <option key={m.src} value={m.src}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      );
    }
  }
};

/* ---------- Avance cuadro por cuadro ---------- */

export const FrameBar: React.FC<{ player: React.RefObject<PlayerRef | null>; total: number; fps: number }> = ({
  player,
  total,
  fps,
}) => {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const p = player.current;
    if (!p) return;
    const onFrame = (e: { detail: { frame: number } }) => setFrame(e.detail.frame);
    p.addEventListener('frameupdate', onFrame);
    p.addEventListener('seeked', onFrame);
    return () => {
      p.removeEventListener('frameupdate', onFrame);
      p.removeEventListener('seeked', onFrame);
    };
  }, [player.current]);
  const go = (f: number) => {
    player.current?.pause();
    player.current?.seekTo(Math.max(0, Math.min(total - 1, f)));
  };
  return (
    <div className="framebar">
      <button onClick={() => go(0)} title="Al inicio">⏮</button>
      <button onClick={() => go(frame - 1)} title="Cuadro anterior">◀</button>
      <span>
        cuadro <b>{frame}</b> / {total - 1} · {(frame / fps).toFixed(2)} s
      </span>
      <button onClick={() => go(frame + 1)} title="Cuadro siguiente">▶</button>
    </div>
  );
};

/* ---------- Export ---------- */

const FORMATS: { value: ExportFormat; label: string; hint: string }[] = [
  { value: 'mp4', label: 'MP4', hint: 'Con fondo, para subir directo' },
  { value: 'prores', label: 'ProRes 4444', hint: 'Transparente, para DaVinci' },
  { value: 'png', label: 'Secuencia PNG', hint: 'Transparente, un PNG por cuadro' },
];

export const ExportPanel: React.FC<{
  effectId: string;
  effectName: string;
  props: Record<string, unknown>;
  size: { width: number; height: number };
}> = ({ effectId, effectName, props, size }) => {
  const [format, setFormat] = useState<ExportFormat>('mp4');
  // Guardamos de qué efecto es cada export: al cambiar de efecto el resultado anterior sigue visible, pero rotulado.
  const [job, setJob] = useState<(JobState & { effectName: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = job?.status === 'preparando' || job?.status === 'renderizando';

  useEffect(() => {
    if (!busy || !job) return;
    const t = setInterval(() => getExport(job.id).then((j) => setJob({ ...j, effectName: job.effectName })).catch((e) => setError(e.message)), 500);
    return () => clearInterval(t);
  }, [busy, job?.id]);

  const run = async () => {
    setError(null);
    try {
      const { id } = await startExport(effectId, props, format);
      setJob({ id, status: 'preparando', progress: 0, output: null, error: null, effectName });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <section className="panel export">
      <h2>
        Exportar {size.width}×{size.height}
      </h2>
      <div className="formats">
        {FORMATS.map((f) => (
          <button key={f.value} className={format === f.value ? 'on' : ''} onClick={() => setFormat(f.value)}>
            <strong>{f.label}</strong>
            <span>{f.hint}</span>
          </button>
        ))}
      </div>
      {busy ? (
        <button className="primary ghost" onClick={() => cancelExport(job!.id)}>
          Cancelar
        </button>
      ) : (
        <button className="primary" onClick={run}>
          Exportar a {String(props.fps)} fps
        </button>
      )}
      {job && (
        <div className="job">
          <div className="bar">
            <div style={{ width: `${Math.round(job.progress * 100)}%` }} />
          </div>
          <span>
            <b>{job.effectName}</b>{' · '} 
            {job.status === 'preparando' && 'Preparando (la primera vez tarda más)…'}
            {job.status === 'renderizando' && `Renderizando cuadro por cuadro… ${Math.round(job.progress * 100)} %`}
            {job.status === 'listo' && '¡Listo!'}
            {job.status === 'cancelado' && 'Cancelado'}
            {job.status === 'error' && `Error: ${job.error}`}
          </span>
          {job.output && <code>{job.output}</code>}
        </div>
      )}
      {error && <div className="job error">{error}</div>}
      <button className="link" onClick={() => openExports()}>
        Abrir carpeta de exports
      </button>
    </section>
  );
};
