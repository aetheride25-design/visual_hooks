import React from 'react';
import { MediaAt, mediaRect } from '../components/brand.tsx';
import { FRAME } from '../lib/frame.ts';
import type { Fit } from '../lib/layout.ts';
import type { BaseProps, EffectDef } from '../lib/types.ts';

type Props = { fit: Fit };

/** Tu video (o imagen) tal cual, sobre el fondo elegido. Con un audio, solo el fondo. */
const SinEfecto: React.FC<Props & BaseProps> = (p) =>
  p.media ? <MediaAt media={p.media} rect={mediaRect(p.media, FRAME, p.fit)} /> : null;

/**
 * Solo tu video (o tu audio sobre el fondo), sin efecto encima.
 * Sirve para exportar tu video con subtítulos, o los subtítulos solos y transparentes.
 */
export const sinEfecto: EffectDef<Props> = {
  id: 'sin-efecto',
  name: 'Sin efecto',
  group: 'base',
  description: 'Solo tu video (o tu audio sobre el fondo). Úsalo para ponerle subtítulos sin ningún hook.',
  usesMedia: true,
  onVideo: 'full',
  defaultDurationSec: 3,
  defaults: { fit: 'contain' },
  params: [
    {
      key: 'fit',
      label: 'Encuadre de tu video',
      type: 'select',
      options: [
        { value: 'contain', label: 'Completo' },
        { value: 'cover', label: 'Llenar pantalla' },
      ],
    },
  ],
  component: SinEfecto,
};
