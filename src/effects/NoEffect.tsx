import React from 'react';
import { MediaAt, mediaRect } from '../components/media.tsx';
import { FRAME } from '../lib/frame.ts';
import type { Fit } from '../lib/layout.ts';
import type { BaseProps, EffectDef } from '../lib/types.ts';

type Props = { fit: Fit };

/** Your video (or image) as is, over the chosen background. With audio, just the background. */
const NoEffect: React.FC<Props & BaseProps> = (p) =>
  p.media ? <MediaAt media={p.media} rect={mediaRect(p.media, FRAME, p.fit)} /> : null;

/**
 * Just your video (or your audio over the background), with no effect on top.
 * Use it to export your video with captions, or the captions alone and transparent.
 */
export const noEffect: EffectDef<Props> = {
  id: 'no-effect',
  name: { en: 'No effect', es: 'Sin efecto' },
  group: 'base',
  description: {
    en: 'Just your video (or your audio over the background). Use it to add captions without any hook.',
    es: 'Solo tu video (o tu audio sobre el fondo). Úsalo para ponerle subtítulos sin ningún hook.',
  },
  usesMedia: true,
  onVideo: 'full',
  defaultDurationSec: 3,
  defaults: { fit: 'contain' },
  params: [
    {
      key: 'fit',
      label: { en: 'Video framing', es: 'Encuadre de tu video' },
      type: 'select',
      options: [
        { value: 'contain', label: { en: 'Full', es: 'Completo' } },
        { value: 'cover', label: { en: 'Fill screen', es: 'Llenar pantalla' } },
      ],
    },
  ],
  component: NoEffect,
};
