import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { colorOf, type PaletteColor } from '../../brand.ts';
import { MediaAt, mediaRect } from '../../components/brand.tsx';
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
  titlePos: 'arriba' | 'abajo';
  fit: Fit;
};

/** Todo el cuadro arranca ampliado y borroso y "encaja" nítido de golpe (firma de Baena). */
const EnfoqueGolpe: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const snap = progress(t, 0, p.snapSec);
  const scale = lerp(p.strength, 1, easeOutBack(snap, 1.2));
  const blur = lerp(36, 0, easeOutExpo(snap));
  const rotate = lerp(-4, 0, easeOutExpo(snap));
  const rect = mediaRect(p.media, FRAME, p.fit);
  const titleTop = p.titlePos === 'arriba';

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

export const enfoqueGolpe: EffectDef<Props> = {
  id: 'enfoque-golpe',
  name: 'Enfoque de golpe',
  group: 'hook',
  description: 'El cuadro arranca ampliado y borroso y encaja nítido en 0.3 s. Baena lo usa al inicio de sus videos.',
  usesMedia: true,
  defaultDurationSec: 2,
  defaults: { title: 'Esto lo hice *con IA*', color: 'mint', snapSec: 0.32, strength: 1.35, titlePos: 'arriba', fit: 'contain' },
  params: [
    { key: 'title', label: 'Título (usa *asteriscos* para destacar)', type: 'text', multiline: true },
    { key: 'color', label: 'Color de acento', type: 'color' },
    { key: 'snapSec', label: 'Tiempo hasta enfocar (s)', type: 'number', min: 0.1, max: 1, step: 0.02 },
    { key: 'strength', label: 'Ampliación inicial', type: 'number', min: 1, max: 2, step: 0.05 },
    {
      key: 'titlePos',
      label: 'Título',
      type: 'select',
      options: [
        { value: 'arriba', label: 'Arriba' },
        { value: 'abajo', label: 'Abajo' },
      ],
    },
    {
      key: 'fit',
      label: 'Encuadre de la captura',
      type: 'select',
      options: [
        { value: 'contain', label: 'Completa' },
        { value: 'cover', label: 'Llenar pantalla' },
      ],
    },
  ],
  component: EnfoqueGolpe,
};
