import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { colorOf, type PaletteColor } from '../../theme.ts';
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

/** A short phrase that slams in word by word with a shake, over your dimmed screenshot or the background. */
const TextDrop: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const n = wordCount(p.text);
  // A small shake for every word that lands.
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

export const textDrop: EffectDef<Props> = {
  id: 'text-drop',
  name: { en: 'Text drop', es: 'Texto que cae' },
  group: 'hook',
  description: {
    en: '2 to 5 words that slam in one by one, with a shake. Tech-explainer style.',
    es: '2 a 5 palabras que caen de golpe, una por una, con temblor. Estilo divulgador tech.',
  },
  usesMedia: true,
  defaultDurationSec: 2,
  defaults: { text: 'Nobody tells you\n*this*', color: 'mint', stagger: 0.16, size: 150, showMedia: true, dim: 0.72 },
  localized: { es: { text: 'Nadie te dice\n*esto*' } },
  params: [
    { key: 'text', label: { en: 'Phrase (Enter = new line, *accent*)', es: 'Frase (Enter = nueva línea, *acento*)' }, type: 'text', multiline: true },
    { key: 'color', label: { en: 'Accent color', es: 'Color de acento' }, type: 'color' },
    { key: 'size', label: { en: 'Size', es: 'Tamaño' }, type: 'number', min: 70, max: 240, step: 2 },
    { key: 'stagger', label: { en: 'Pause between words (s)', es: 'Pausa entre palabras (s)' }, type: 'number', min: 0.04, max: 0.5, step: 0.01 },
    { key: 'showMedia', label: { en: 'Your screenshot behind', es: 'Tu captura detrás' }, type: 'boolean' },
    { key: 'dim', label: { en: 'Darken screenshot', es: 'Oscurecer captura' }, type: 'number', min: 0, max: 1, step: 0.02 },
  ],
  component: TextDrop,
};
