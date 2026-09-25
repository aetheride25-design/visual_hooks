import React from 'react';
import { aurora, fonts } from '../theme.ts';
import { fitRect } from '../lib/layout.ts';
import type { MediaRef } from '../lib/types.ts';
import { cardStyle, Media, sizeOf } from './media.tsx';

const BAR = 64;

/** Window size so your footage fits entirely inside `maxW × maxH`. */
export const windowSize = (media: MediaRef | null, maxW: number, maxH: number, bar = true) => {
  const barH = bar ? BAR : 0;
  const s = sizeOf(media);
  const r = fitRect(s.width, s.height, { x: 0, y: 0, w: maxW, h: maxH - barH }, 'contain');
  return { w: r.w, h: r.h + barH, mediaH: r.h };
};

/** Browser-like window with your footage inside: bar with 3 dots and an address. */
export const AppWindow: React.FC<{
  media: MediaRef | null;
  width: number;
  mediaHeight: number;
  address: string;
  glow: string;
  /** No bar: just the card with your footage. */
  bar?: boolean;
  style?: React.CSSProperties;
}> = ({ media, width, mediaHeight, address, glow, bar = true, style }) => (
  <div style={{ ...cardStyle(30, glow), width, height: mediaHeight + (bar ? BAR : 0), ...style }}>
    {bar && <div
      style={{
        height: BAR,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 22px',
        background: 'linear-gradient(#1b1e23, #16181c)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {[aurora.red, '#f5c451', aurora.mint].map((c) => (
        <span key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c, opacity: 0.9 }} />
      ))}
      {address && (
        <span
          style={{
            marginLeft: 18,
            padding: '6px 22px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.06)',
            color: aurora.muted,
            fontFamily: fonts.mono,
            fontSize: 24,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: width - 200,
          }}
        >
          {address}
        </span>
      )}
    </div>}
    <div style={{ position: 'relative', width, height: mediaHeight, overflow: 'hidden' }}>
      <Media media={media} width={width} />
    </div>
  </div>
);
