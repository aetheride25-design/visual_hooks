import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { colorOf, type PaletteColor } from '../../brand.ts';
import { MediaBackdrop } from '../../components/backdrop.tsx';
import { KineticText, wordCount } from '../../components/text.tsx';
import { progress, shake, timeOf } from '../../lib/anim.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';

type Props = {
  text: string;
  color: PaletteColor;
  stagger: number;
  size: number;
  showMedia: boolean;
  dim: number;
};

/** Frase corta que cae palabra por palabra con golpe y temblor, sobre tu captura atenuada o el fondo. */
const TextoCae: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const n = wordCount(p.text);
  // Un temblorcito por cada palabra que aterriza.
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i++) {
    const s = shake(t - (0.1 + i * p.stagger + 0.2), 14, 0.25, i + 1);
    sx += s.x;
    sy += s.y;
  }
  const dimIn = progress(t, 0, 0.25) * p.dim;

  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
      {p.showMedia && <MediaBackdrop media={p.media} fit="cover" dim={dimIn} blur={dimIn * 10} />}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 70px' }}>
        <KineticText
          text={p.text}
          t={t}
          start={0.1}
          stagger={p.stagger}
          size={p.size}
          accent={colorOf(p.color)}
          entrance="slam"
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const textoCae: EffectDef<Props> = {
  id: 'texto-cae',
  name: 'Texto que cae',
  group: 'hook',
  description: '2 a 5 palabras que caen de golpe, una por una, con temblor. Estilo Fireship y DotCSV.',
  usesMedia: true,
  defaultDurationSec: 2,
  defaults: { text: 'Nadie te dice\n*esto*', color: 'mint', stagger: 0.16, size: 150, showMedia: true, dim: 0.72 },
  params: [
    { key: 'text', label: 'Frase (Enter = nueva línea, *acento*)', type: 'text', multiline: true },
    { key: 'color', label: 'Color de acento', type: 'color' },
    { key: 'size', label: 'Tamaño', type: 'number', min: 70, max: 240, step: 2 },
    { key: 'stagger', label: 'Pausa entre palabras (s)', type: 'number', min: 0.04, max: 0.5, step: 0.01 },
    { key: 'showMedia', label: 'Tu captura detrás', type: 'boolean' },
    { key: 'dim', label: 'Oscurecer captura', type: 'number', min: 0, max: 1, step: 0.02 },
  ],
  component: TextoCae,
};
