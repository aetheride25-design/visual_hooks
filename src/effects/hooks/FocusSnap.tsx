import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { colorOf, type PaletteColor } from '../../theme.ts';
import { MediaAt, mediaRect } from '../../components/media.tsx';
import { KineticText } from '../../components/text.tsx';
import { easeOutBack, easeOutExpo, lerp, progress, timeOf } from '../../lib/anim.ts';
import { FRAME } from '../../lib/frame.ts';
import type { Fit } from '../../lib/layout.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';

type Props = {
  title: string;
  color: PaletteColor;
  snapSec: number;
  strength: number;
  titlePos: 'top' | 'bottom';
  fit: Fit;
};

/** The whole frame starts zoomed in and blurry, then snaps sharp in one hit. */
const FocusSnap: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const snap = progress(t, 0, p.snapSec);
  const scale = lerp(p.strength, 1, easeOutBack(snap, 1.2));
  const blur = lerp(36, 0, easeOutExpo(snap));
  const rotate = lerp(-4, 0, easeOutExpo(snap));
  const rect = mediaRect(p.media, FRAME, p.fit);
  const titleTop = p.titlePos === 'top';

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${scale}) rotate(${rotate}deg)`,
        filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
      }}
    >
      <MediaAt media={p.media} rect={rect} style={{ borderRadius: p.fit === 'contain' ? 28 : 0 }} />
      {p.title && (
        <AbsoluteFill
          style={{
            justifyContent: titleTop ? 'flex-start' : 'flex-end',
            alignItems: 'center',
            padding: titleTop ? '260px 70px 0' : '0 70px 300px',
          }}
        >
          <KineticText
            text={p.title}
            t={t}
            start={p.snapSec * 0.6}
            stagger={0.07}
            size={118}
            accent={colorOf(p.color)}
            entrance="blur"
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const focusSnap: EffectDef<Props> = {
  id: 'focus-snap',
  name: { en: 'Focus snap', es: 'Enfoque de golpe' },
  group: 'hook',
  description: {
    en: 'The frame starts zoomed in and blurry, then snaps sharp in 0.3 s. A classic video opener.',
    es: 'El cuadro arranca ampliado y borroso y encaja nítido en 0.3 s. Un clásico para abrir un video.',
  },
  usesMedia: true,
  defaultDurationSec: 2,
  defaults: { title: 'I built this *with AI*', color: 'mint', snapSec: 0.32, strength: 1.35, titlePos: 'top', fit: 'contain' },
  localized: { es: { title: 'Esto lo hice *con IA*' } },
  params: [
    { key: 'title', label: { en: 'Title (use *asterisks* to highlight)', es: 'Título (usa *asteriscos* para destacar)' }, type: 'text', multiline: true },
    { key: 'color', label: { en: 'Accent color', es: 'Color de acento' }, type: 'color' },
    { key: 'snapSec', label: { en: 'Time to focus (s)', es: 'Tiempo hasta enfocar (s)' }, type: 'number', min: 0.1, max: 1, step: 0.02 },
    { key: 'strength', label: { en: 'Initial zoom', es: 'Ampliación inicial' }, type: 'number', min: 1, max: 2, step: 0.05 },
    {
      key: 'titlePos',
      label: { en: 'Title', es: 'Título' },
      type: 'select',
      options: [
        { value: 'top', label: { en: 'Top', es: 'Arriba' } },
        { value: 'bottom', label: { en: 'Bottom', es: 'Abajo' } },
      ],
    },
    {
      key: 'fit',
      label: { en: 'Screenshot framing', es: 'Encuadre de la captura' },
      type: 'select',
      options: [
        { value: 'contain', label: { en: 'Whole', es: 'Completa' } },
        { value: 'cover', label: { en: 'Fill screen', es: 'Llenar pantalla' } },
      ],
    },
  ],
  component: FocusSnap,
};
