// Controls under the preview: frame-by-frame stepping and the timeline.
import React, { useEffect, useRef, useState } from 'react';
import type { PlayerRef } from '@remotion/player';
import { useLang } from '../i18n.tsx';

type PlayerHandle = React.RefObject<PlayerRef | null>;

/** Current Player frame, updated while playing and after each seek. */
export const usePlayerFrame = (player: PlayerHandle): number => {
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
  return frame;
};

/* ---------- Frame-by-frame stepping ---------- */

export const FrameBar: React.FC<{ player: PlayerHandle; total: number; fps: number }> = ({ player, total, fps }) => {
  const { t } = useLang();
  const frame = usePlayerFrame(player);
  const go = (f: number) => {
    player.current?.pause();
    player.current?.seekTo(Math.max(0, Math.min(total - 1, f)));
  };
  return (
    <div className="framebar">
      <button onClick={() => go(0)} title={t('toStart')}>⏮</button>
      <button onClick={() => go(frame - 1)} title={t('prevFrame')}>◀</button>
      <span>
        {t('frame')} <b>{frame}</b> / {total - 1} · {(frame / fps).toFixed(2)} s
      </span>
      <button onClick={() => go(frame + 1)} title={t('nextFrame')}>▶</button>
    </div>
  );
};

/* ---------- Timeline: where the effect lands inside your video ---------- */

export const TimelineBar: React.FC<{
  player: PlayerHandle;
  totalSec: number;
  startSec: number;
  effectSec: number;
  fps: number;
  label: string;
  /** False if the effect lasts the whole video (no span to move). */
  movable: boolean;
  onMove: (startSec: number) => void;
}> = ({ player, totalSec, startSec, effectSec, fps, label, movable, onMove }) => {
  const { t } = useLang();
  const frame = usePlayerFrame(player);
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; start: number } | null>(null);

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
          title={movable ? t('dragSpan') : undefined}
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
        <span>{t('yourVideoLength', { d: totalSec.toFixed(1) })}</span>
      </div>
    </div>
  );
};
