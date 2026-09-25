import React from 'react';
import { FRAME } from '../lib/frame.ts';
import type { Fit } from '../lib/layout.ts';
import type { MediaRef } from '../lib/types.ts';
import { MediaAt, mediaRect } from './media.tsx';

/** Your footage as a background, optionally blurred and dimmed so the text on top stays readable. */
export const MediaBackdrop: React.FC<{ media: MediaRef | null; fit: Fit; dim: number; blur?: number }> = ({
  media,
  fit,
  dim,
  blur = 0,
}) => (
  // Dimming is a filter on the footage, not a black layer over the whole frame:
  // that way, in transparent exports, alpha stays 0 outside your footage.
  <MediaAt
    media={media}
    rect={mediaRect(media, FRAME, fit)}
    style={{
      borderRadius: fit === 'contain' ? 24 : 0,
      filter: [blur > 0 ? `blur(${blur}px)` : '', dim > 0 ? `brightness(${1 - dim})` : ''].filter(Boolean).join(' ') || undefined,
      // Scale up slightly with the blur to hide the blurry edges, without jumps.
      transform: blur > 0 ? `scale(${1 + blur * 0.004})` : undefined,
    }}
  />
);
