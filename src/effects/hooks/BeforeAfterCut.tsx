import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { colorOf, type PaletteColor } from '../../theme.ts';
import { MediaAt, mediaRect } from '../../components/media.tsx';
import { StampLabel } from '../../components/labels.tsx';
import { easeOutExpo, lerp, progress, shake, timeOf } from '../../lib/anim.ts';
import { FRAME } from '../../lib/frame.ts';
import type { Fit } from '../../lib/layout.ts';
import type { BaseProps, EffectDef, MediaRef } from '../../lib/types.ts';

type Props = {
  before: MediaRef | null;
  beforeLabel: string;
  afterLabel: string;
  cutSec: number;
  afterColor: PaletteColor;
  fit: Fit;
};

/** The "before" (dull, tinted red) cuts hard to the "now" (your main video) with a flash. */
const BeforeAfterCut: React.FC<Props & BaseProps> = (p) => {
  const frame = useCurrentFrame();
  const t = timeOf(frame, p.fps, p.speed);
  // The cut is decided by frame number (not seconds) so the Sequence cut and the labels
  // always land on the same frame, at any speed.
  const cutFrame = Math.max(1, Math.ceil((p.cutSec / Math.max(0.01, p.speed)) * p.fps));
  const after = frame >= cutFrame;
  const since = timeOf(frame - cutFrame, p.fps, p.speed);
  const punch = after ? lerp(1.18, 1, easeOutExpo(progress(since, 0, 0.35))) : lerp(1, 1.04, progress(t, 0, p.cutSec));
  const sh = shake(since, 22, 0.35, 5);
  const flash = after ? 1 - progress(since, 0, 0.16) : 0;
  const beforeRect = mediaRect(p.before, FRAME, p.fit);
  const afterRect = mediaRect(p.media, FRAME, p.fit);

  return (
    <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)` }}>
      <AbsoluteFill style={{ transform: `scale(${punch})` }}>
        {/* Each video starts from its second 0 in its own span. */}
        <Sequence durationInFrames={cutFrame}>
          <MediaAt
            media={p.before}
            rect={beforeRect}
            style={{ borderRadius: p.fit === 'contain' ? 24 : 0, filter: 'grayscale(0.85) brightness(0.7) contrast(1.1)' }}
          />
          <AbsoluteFill style={{ background: 'rgba(255,79,74,0.10)', mixBlendMode: 'screen' }} />
        </Sequence>
        <Sequence from={cutFrame}>
          <MediaAt media={p.media} rect={afterRect} style={{ borderRadius: p.fit === 'contain' ? 24 : 0 }} />
        </Sequence>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 300 }}>
        {after ? (
          <StampLabel text={p.afterLabel} color={colorOf(p.afterColor)} p={progress(since, 0.04, 0.3)} rotate={-3} />
        ) : (
          <StampLabel text={p.beforeLabel} color={colorOf('red')} p={progress(t, 0.05, 0.3)} rotate={3} />
        )}
      </AbsoluteFill>
      {flash > 0 && <AbsoluteFill style={{ background: '#fff', opacity: flash * 0.85 }} />}
    </AbsoluteFill>
  );
};

export const beforeAfterCut: EffectDef<Props> = {
  id: 'before-after-cut',
  name: { en: 'Before / now cut', es: 'Antes / ahora de golpe' },
  group: 'hook',
  description: {
    en: 'The dull "before" cuts hard to the "now" (your main video) with a flash and stamps.',
    es: 'El "antes" apagado cambia de golpe al "ahora" (tu video principal) con destello y sellos.',
  },
  usesMedia: true,
  defaultDurationSec: 2,
  defaults: { before: null, beforeLabel: 'BEFORE', afterLabel: 'NOW', cutSec: 0.8, afterColor: 'mint', fit: 'contain' },
  localized: { es: { beforeLabel: 'ANTES', afterLabel: 'AHORA' } },
  params: [
    { key: 'before', label: { en: '"Before" video or image', es: 'Video o imagen del "antes"' }, type: 'media' },
    { key: 'beforeLabel', label: { en: 'Before label', es: 'Rótulo del antes' }, type: 'text' },
    { key: 'afterLabel', label: { en: 'Now label', es: 'Rótulo del ahora' }, type: 'text' },
    { key: 'afterColor', label: { en: 'Now color', es: 'Color del ahora' }, type: 'color' },
    { key: 'cutSec', label: { en: 'Cut moment (s)', es: 'Momento del cambio (s)' }, type: 'number', min: 0.2, max: 3, step: 0.05 },
    {
      key: 'fit',
      label: { en: 'Framing', es: 'Encuadre' },
      type: 'select',
      options: [
        { value: 'contain', label: { en: 'Whole', es: 'Completa' } },
        { value: 'cover', label: { en: 'Fill screen', es: 'Llenar pantalla' } },
      ],
    },
  ],
  component: BeforeAfterCut,
};
