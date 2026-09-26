import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { aurora, colorOf, type PaletteColor } from '../../theme.ts';
import { MediaAt, mediaRect } from '../../components/media.tsx';
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

/** A light curtain sweeps away the "before" and reveals the "now" (your main video), with labels. */
const BeforeAfterWipe: React.FC<Props & BaseProps> = (p) => {
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
      {/* The "now" is clipped from the left up to the curtain. */}
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

export const beforeAfterWipe: EffectDef<Props> = {
  id: 'before-after-wipe',
  name: { en: 'Before / after (wipe)', es: 'Antes / después (cortina)' },
  group: 'support',
  description: {
    en: 'A light curtain sweeps away the "before" and reveals the "now" (your main video), with labels.',
    es: 'Una cortina de luz barre el "antes" y revela el "ahora" (tu video principal), con rótulos.',
  },
  usesMedia: true,
  defaultDurationSec: 3,
  defaults: { before: null, beforeLabel: 'BEFORE', afterLabel: 'NOW', color: 'mint', startSec: 0.6, wipeSec: 1.1, fit: 'contain' },
  localized: { es: { beforeLabel: 'ANTES', afterLabel: 'AHORA' } },
  params: [
    { key: 'before', label: { en: '"Before" video or image', es: 'Video o imagen del "antes"' }, type: 'media' },
    { key: 'beforeLabel', label: { en: 'Before label', es: 'Rótulo del antes' }, type: 'text' },
    { key: 'afterLabel', label: { en: 'Now label', es: 'Rótulo del ahora' }, type: 'text' },
    { key: 'color', label: { en: 'Curtain color', es: 'Color de la cortina' }, type: 'color' },
    { key: 'startSec', label: { en: 'Wipe starts at (s)', es: 'Empieza a barrer (s)' }, type: 'number', min: 0, max: 3, step: 0.05 },
    { key: 'wipeSec', label: { en: 'Wipe duration (s)', es: 'Duración del barrido (s)' }, type: 'number', min: 0.2, max: 3, step: 0.05 },
    {
      key: 'fit',
      label: { en: 'Framing', es: 'Encuadre' },
      type: 'select',
      options: [
        { value: 'contain', label: { en: 'Full', es: 'Completa' } },
        { value: 'cover', label: { en: 'Fill screen', es: 'Llenar pantalla' } },
      ],
    },
  ],
  component: BeforeAfterWipe,
};
