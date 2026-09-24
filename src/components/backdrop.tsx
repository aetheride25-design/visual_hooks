import React from 'react';
import { FRAME } from '../lib/frame.ts';
import type { Fit } from '../lib/layout.ts';
import type { MediaRef } from '../lib/types.ts';
import { MediaAt, mediaRect } from './brand.tsx';

/** Tu captura de fondo, opcionalmente desenfocada y oscurecida para que el texto de encima se lea. */
export const MediaBackdrop: React.FC<{ media: MediaRef | null; fit: Fit; dim: number; blur?: number }> = ({
  media,
  fit,
  dim,
  blur = 0,
}) => (
  // El oscurecido va como filtro sobre la captura, no como capa negra encima de todo el cuadro:
  // así, en los exports transparentes, fuera de tu captura el alfa sigue en 0.
  <MediaAt
    media={media}
    rect={mediaRect(media, FRAME, fit)}
    style={{
      borderRadius: fit === 'contain' ? 24 : 0,
      filter: [blur > 0 ? `blur(${blur}px)` : '', dim > 0 ? `brightness(${1 - dim})` : ''].filter(Boolean).join(' ') || undefined,
      // Agranda un poco según el desenfoque para ocultar los bordes borrosos, sin saltos.
      transform: blur > 0 ? `scale(${1 + blur * 0.004})` : undefined,
    }}
  />
);
