import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { aurora, colorOf, fonts, handle, type PaletteColor } from '../../brand.ts';
import { KineticText, wordCount, type WordEntrance } from '../../components/text.tsx';
import { progress, shake, timeOf } from '../../lib/anim.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';

type Props = {
  text: string;
  color: PaletteColor;
  entrance: WordEntrance;
  size: number;
  stagger: number;
  showHandle: boolean;
};

/** Frase grande que entra con fuerza sobre el fondo de marca. */
const TarjetaTexto: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const lastLanding = 0.1 + (wordCount(p.text) - 1) * p.stagger + 0.22;
  const sh = p.entrance === 'slam' ? shake(t - lastLanding, 18, 0.3, 7) : { x: 0, y: 0 };

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 80px', transform: `translate(${sh.x}px, ${sh.y}px)` }}>
      <KineticText text={p.text} t={t} start={0.1} stagger={p.stagger} size={p.size} accent={colorOf(p.color)} entrance={p.entrance} />
      {p.showHandle && (
        <div
          style={{
            position: 'absolute',
            bottom: 220,
            fontFamily: fonts.mono,
            fontSize: 36,
            color: aurora.muted,
            opacity: progress(t, lastLanding, 0.4),
          }}
        >
          {handle}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const tarjetaTexto: EffectDef<Props> = {
  id: 'tarjeta-texto',
  name: 'Tarjeta de texto',
  group: 'apoyo',
  description: 'Frase grande que entra con fuerza sobre el fondo de marca. *Asteriscos* para la palabra clave.',
  usesMedia: false,
  defaultDurationSec: 2.5,
  defaults: { text: 'La IA no te quita\nel trabajo.\nTe quita *excusas*.', color: 'violet', entrance: 'slam', size: 118, stagger: 0.12, showHandle: true },
  params: [
    { key: 'text', label: 'Frase (Enter = nueva línea, *acento*)', type: 'text', multiline: true },
    { key: 'color', label: 'Color de acento', type: 'color' },
    {
      key: 'entrance',
      label: 'Entrada',
      type: 'select',
      options: [
        { value: 'slam', label: 'Golpe' },
        { value: 'rise', label: 'Sube' },
        { value: 'blur', label: 'Desenfoque' },
      ],
    },
    { key: 'size', label: 'Tamaño', type: 'number', min: 60, max: 220, step: 2 },
    { key: 'stagger', label: 'Pausa entre palabras (s)', type: 'number', min: 0.03, max: 0.5, step: 0.01 },
    { key: 'showHandle', label: `Mostrar ${handle}`, type: 'boolean' },
  ],
  component: TarjetaTexto,
};
