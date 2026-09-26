import React, { useEffect, useRef, useState } from 'react';
import type { PlayerRef } from '@remotion/player';
import { aurora, paletteColors, type PaletteColor } from '../src/brand.ts';
import type { EffectDef, MediaRef, ParamDef } from '../src/lib/types.ts';
import { editWord, formatMs, toSrt, toVtt, type CaptionWord } from '../src/lib/captions.ts';
import { compatibility, formatDuration, onVideoOf, tagsOf } from '../src/lib/timeline.ts';
import {
  cancelExport,
  getExport,
  getTranscribe,
  openExports,
  startExport,
  startTranscribe,
  type ExportFormat,
  type JobState,
  type TranscribeLang,
  type TranscribeModel,
  type TranscribeState,
} from './api.ts';

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
      <h2>Tu video, imagen o audio</h2>
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
          accept="video/*,image/*,audio/*"
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
            ) : m.kind === 'audio' ? (
              <span className="thumb demo">🎵</span>
            ) : (
              <img className="thumb" src={m.src} alt="" />
            )}
            <span className="media-name">
              <span title={m.name}>{m.name}</span>
              <small>
                {m.kind === 'video' ? '🎬 Video' : m.kind === 'audio' ? '🎵 Audio' : '🖼 Imagen'}
                {m.durationSec ? ` · ${formatDuration(m.durationSec)}` : ''}
              </small>
            </span>
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
  /** Lo que elegiste a la izquierda: apaga los efectos que no funcionan con eso. */
  media: MediaRef | null;
  onSelect: (id: string) => void;
}> = ({ effects, selected, media, onSelect }) => {
  const group = (g: EffectDef['group'], title: string | null, hint?: string) => (
    <>
      {title && <h3>{title}</h3>}
      {hint && <p className="group-hint">{hint}</p>}
      {effects
        .filter((e) => e.group === g)
        .map((e) => {
          const onVideo = onVideoOf(e);
          const blocked = compatibility(onVideo, e.group, media);
          return (
            <button
              key={e.id}
              className={`effect ${selected === e.id ? 'on' : ''} ${blocked ? 'off' : ''}`}
              disabled={!!blocked}
              title={blocked ?? undefined}
              onClick={() => onSelect(e.id)}
            >
              <strong>{e.name}</strong>
              <span className="tags">
                {tagsOf(onVideo, e.group).map((t) => (
                  <em key={t}>{t}</em>
                ))}
              </span>
              <span>{blocked ?? e.description}</span>
            </button>
          );
        })}
    </>
  );
  return (
    <section className="panel effects">
      {group('base', null)}
      {group('hook', 'Hooks visuales · 0–2 s', 'Van en un tramo de tu video (al inicio, de entrada).')}
      {group('apoyo', 'Efectos de apoyo', 'Tarjetas encima de tu video en el segundo que elijas, o formatos que duran todo el video.')}
      {group('pieza', 'Piezas animadas', 'Clips sueltos: no van sobre un video.')}
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

/* ---------- Subtítulos: transcribir con Whisper y corregir palabras ---------- */

const TR_STATUS: Record<TranscribeState['status'], string> = {
  instalando: 'Instalando Whisper (solo la primera vez)…',
  descargando: 'Bajando el modelo (solo la primera vez)',
  transcribiendo: 'Escuchando tu video',
  listo: '¡Listo!',
  error: 'Error',
};

export const CaptionsEditor: React.FC<{
  video: MediaRef | null;
  words: CaptionWord[];
  wordsFor: string;
  offsetMs: number;
  onChange: (words: CaptionWord[], wordsFor: string) => void;
  onSeek: (ms: number) => void;
}> = ({ video, words, wordsFor, offsetMs, onChange, onSeek }) => {
  const [model, setModel] = useState<TranscribeModel>('small');
  const [lang, setLang] = useState<TranscribeLang>('es');
  const [job, setJob] = useState<TranscribeState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = job !== null && job.status !== 'listo' && job.status !== 'error';
  const isAudio = video?.kind === 'audio';
  const hasVoice = video?.kind === 'video' || isAudio;

  useEffect(() => {
    if (!busy || !job) return;
    const name = video?.name ?? '';
    const t = setInterval(
      () =>
        getTranscribe(job.id)
          .then((j) => {
            setJob(j);
            if (j.status === 'listo' && j.words) onChange(j.words, name);
          })
          .catch((e) => setError(e.message)),
      700,
    );
    return () => clearInterval(t);
  }, [busy, job?.id]);

  const run = async () => {
    if (!video) return;
    setError(null);
    try {
      const { id } = await startTranscribe(video.name, model, lang);
      setJob({ id, status: 'instalando', progress: 0, words: null, error: null });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const mine = hasVoice && wordsFor === video.name;

  /** Descarga la transcripción como archivo de subtítulos, con el mismo "Adelantar / atrasar" de la vista previa. */
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
      <span>Transcripción</span>
      <div className="segmented">
        {(
          [
            ['base', 'Rápido'],
            ['small', 'Bueno'],
            ['medium', 'Mejor'],
          ] as const
        ).map(([v, l]) => (
          <button key={v} className={model === v ? 'on' : ''} onClick={() => setModel(v)} title={`Modelo ${v} de Whisper`}>
            {l}
          </button>
        ))}
      </div>
      <div className="segmented">
        {(
          [
            ['es', 'Español'],
            ['en', 'Inglés'],
            ['auto', 'Detectar'],
          ] as const
        ).map(([v, l]) => (
          <button key={v} className={lang === v ? 'on' : ''} onClick={() => setLang(v)}>
            {l}
          </button>
        ))}
      </div>
      <button className="primary" disabled={!hasVoice || busy} onClick={run}>
        {busy ? 'Transcribiendo…' : mine ? '🎙 Transcribir de nuevo' : `🎙 Transcribir mi ${isAudio ? 'audio' : 'video'}`}
      </button>
      {!hasVoice && <small>Elige tu video o audio con voz en el panel izquierdo. Mientras tanto ves una frase de ejemplo.</small>}
      {hasVoice && wordsFor && !mine && <small>Estas palabras son de otro archivo ({wordsFor}). Transcribe este.</small>}
      {mine && words.length > 0 && (
        <div className="downloads">
          <button className="primary ghost" onClick={() => download('srt')} title="Para CapCut, DaVinci o Premiere">
            ⬇ SRT
          </button>
          <button className="primary ghost" onClick={() => download('vtt')} title="Para YouTube o la web">
            ⬇ VTT
          </button>
        </div>
      )}
      {job && job.status !== 'listo' && (
        <div className="job">
          <div className="bar">
            <div style={{ width: `${Math.round(job.progress * 100)}%` }} />
          </div>
          <span>
            {TR_STATUS[job.status]}
            {(job.status === 'descargando' || job.status === 'transcribiendo') && ` ${Math.round(job.progress * 100)} %`}
            {job.status === 'error' && `: ${job.error}`}
          </span>
        </div>
      )}
      {error && <div className="job error">{error}</div>}
      {words.length > 0 && (
        <>
          <small>Corrige una palabra y pulsa Enter. Vacía = se borra. Dos palabras = se reparten el tiempo. Clic en el tiempo para ir ahí.</small>
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

/* ---------- Línea de tiempo: dónde cae el efecto dentro de tu video ---------- */

export const TimelineBar: React.FC<{
  player: React.RefObject<PlayerRef | null>;
  totalSec: number;
  startSec: number;
  effectSec: number;
  fps: number;
  label: string;
  /** Falso si el efecto dura todo el video (no hay tramo que mover). */
  movable: boolean;
  onMove: (startSec: number) => void;
}> = ({ player, totalSec, startSec, effectSec, fps, label, movable, onMove }) => {
  const [frame, setFrame] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; start: number } | null>(null);
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

  const pct = (s: number) => `${(s / totalSec) * 100}%`;
  const secAt = (clientX: number) => {
    const box = track.current!.getBoundingClientRect();
    return Math.min(totalSec, Math.max(0, ((clientX - box.left) / box.width) * totalSec));
  };
  const seek = (sec: number) => {
    player.current?.pause();
    player.current?.seekTo(Math.round(sec * fps));
  };

  return (
    <div className="timeline">
      <div ref={track} className="track" onPointerDown={(e) => seek(secAt(e.clientX))}>
        <div
          className={`span ${movable ? 'movable' : ''}`}
          style={{ left: pct(startSec), width: pct(effectSec) }}
          title={movable ? 'Arrástralo para mover el efecto' : undefined}
          onPointerDown={(e) => {
            if (!movable) return;
            e.stopPropagation();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, start: startSec };
            player.current?.pause();
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            const box = track.current!.getBoundingClientRect();
            const next = drag.current.start + ((e.clientX - drag.current.x) / box.width) * totalSec;
            onMove(Math.round(Math.min(totalSec - effectSec, Math.max(0, next)) * 10) / 10);
          }}
          onPointerUp={() => {
            if (drag.current) seek(startSec);
            drag.current = null;
          }}
        >
          <span>{label}</span>
        </div>
        <div className="playhead" style={{ left: pct(frame / fps) }} />
      </div>
      <div className="ticks">
        <span>0 s</span>
        <span>tu video · {totalSec.toFixed(1)} s</span>
      </div>
    </div>
  );
};

/* ---------- Export ---------- */

const FORMATS: { value: ExportFormat; label: string; hint: string; timedHint: string }[] = [
  { value: 'mp4', label: 'MP4', hint: 'Con fondo, para subir directo', timedHint: 'Tu video completo con el efecto y su audio' },
  {
    value: 'prores',
    label: 'ProRes 4444',
    hint: 'Transparente, para DaVinci',
    timedHint: 'Sin tu video: efecto y subtítulos transparentes, en su segundo exacto',
  },
  { value: 'png', label: 'Secuencia PNG', hint: 'Transparente, un PNG por cuadro', timedHint: 'Igual que ProRes, un PNG por cuadro' },
];

export const ExportPanel: React.FC<{
  effectId: string;
  effectName: string;
  props: Record<string, unknown>;
  size: { width: number; height: number };
  /** "Aplicar a mi video": cambia lo que explica cada formato. */
  timed: boolean;
}> = ({ effectId, effectName, props, size, timed }) => {
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
            <span>{timed ? f.timedHint : f.hint}</span>
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
