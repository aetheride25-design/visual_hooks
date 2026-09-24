import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { aurora, colorOf, type PaletteColor } from '../../brand.ts';
import { MediaAt, mediaRect } from '../../components/brand.tsx';
import { StampLabel } from '../../components/labels.tsx';
import { easeInOutCubic, progress, timeOf } from '../../lib/anim.ts';
import { FRAME } from '../../lib/frame.ts';
import type { Fit } from '../../lib/layout.ts';
import type { BaseProps, EffectDef, MediaRef } from '../../lib/types.ts';

type Props = {
  before: MediaRef | null;
  beforeLabel: string;
  afterLabel: string;
  color: PaletteColor;
  startSec: number;
  wipeSec: number;
  fit: Fit;
};

/** Una cortina de luz barre el "antes" y revela el "ahora" (tu video principal), con rótulos. */
const AntesDespues: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const w = easeInOutCubic(progress(t, p.startSec, p.wipeSec));
  const x = w * 1080;
  const color = colorOf(p.color);
  const radius = p.fit === 'contain' ? 24 : 0;

  return (
    <AbsoluteFill>
      <MediaAt
        media={p.before}
        rect={mediaRect(p.before, FRAME, p.fit)}
        style={{ borderRadius: radius, filter: 'grayscale(0.6) brightness(0.8)' }}
      />
      {/* El "ahora" se recorta desde la izquierda hasta la cortina. */}
      <AbsoluteFill style={{ clipPath: `inset(0 ${1080 - x}px 0 0)` }}>
        <MediaAt media={p.media} rect={mediaRect(p.media, FRAME, p.fit)} style={{ borderRadius: radius }} />
      </AbsoluteFill>
      {w > 0 && w < 1 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: x - 3,
            width: 6,
            background: aurora.text,
            boxShadow: `0 0 24px ${color}, 0 0 80px ${color}, 0 0 160px ${color}88`,
          }}
        />
      )}
      <AbsoluteFill style={{ padding: '260px 60px 0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <StampLabel text={p.beforeLabel} color={aurora.red} p={progress(t, 0.05, 0.3) * (w < 0.5 ? 1 : 0)} rotate={-4} />
        <StampLabel text={p.afterLabel} color={color} p={progress(t, p.startSec + p.wipeSec * 0.55, 0.3)} rotate={3} style={{ marginLeft: 'auto' }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const antesDespues: EffectDef<Props> = {
  id: 'antes-despues',
  name: 'Antes / después (cortina)',
  group: 'apoyo',
  description: 'Una cortina de luz barre el "antes" y revela el "ahora" (tu video principal), con rótulos.',
  usesMedia: true,
  defaultDurationSec: 3,
  defaults: { before: null, beforeLabel: 'ANTES', afterLabel: 'AHORA', color: 'mint', startSec: 0.6, wipeSec: 1.1, fit: 'contain' },
  params: [
    { key: 'before', label: 'Video o imagen del "antes"', type: 'media' },
    { key: 'beforeLabel', label: 'Rótulo del antes', type: 'text' },
    { key: 'afterLabel', label: 'Rótulo del ahora', type: 'text' },
    { key: 'color', label: 'Color de la cortina', type: 'color' },
    { key: 'startSec', label: 'Empieza a barrer (s)', type: 'number', min: 0, max: 3, step: 0.05 },
    { key: 'wipeSec', label: 'Duración del barrido (s)', type: 'number', min: 0.2, max: 3, step: 0.05 },
    {
      key: 'fit',
      label: 'Encuadre',
      type: 'select',
      options: [
        { value: 'contain', label: 'Completa' },
        { value: 'cover', label: 'Llenar pantalla' },
      ],
    },
  ],
  component: AntesDespues,
};
