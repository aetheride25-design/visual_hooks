// Sticker slap: the example mod. A die-cut sticker slaps onto your video with a shake, like on a laptop lid.
// Copy this folder (or run `pnpm new-mod "my effect"`) to make your own. Docs: docs/mods.md
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import {
  colorOf,
  easeOutBack,
  fonts,
  lerp,
  MediaBackdrop,
  pointIn,
  progress,
  shake,
  timeOf,
  FRAME,
  type BaseProps,
  type EffectDef,
  type PaletteColor,
} from '../../src/sdk.ts';

type Props = {
  text: string;
  emoji: string;
  color: PaletteColor;
  /** Where the sticker lands, 0–1 across and down the frame. */
  x: number;
  y: number;
  tilt: number;
  dim: number;
};

const SLAP = 0.2;

const StickerSlap: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const hit = progress(t, SLAP, 0.22);
  const land = easeOutBack(hit, 2.2);
  // The whole frame shakes a little when it lands.
  const s = shake(t - SLAP - 0.18, 18, 0.35, 3);
  const at = pointIn(FRAME, p.x, p.y);
  const color = colorOf(p.color);
  // From big and up close (towards the camera) down onto the screen.
  const scale = lerp(2.6, 1, land);
  const lift = lerp(26, 6, Math.min(1, hit * 1.4));

  return (
    <AbsoluteFill style={{ transform: `translate(${s.x}px, ${s.y}px)` }}>
      <MediaBackdrop media={p.media} fit="cover" dim={p.dim * progress(t, 0, 0.3)} />
      {t >= SLAP && (
        <div
          style={{
            position: 'absolute',
            left: at.x,
            top: at.y,
            transform: `translate(-50%, -50%) rotate(${p.tilt + (1 - land) * 14}deg) scale(${scale})`,
            opacity: Math.min(1, hit * 5),
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            padding: '26px 46px',
            borderRadius: 40,
            background: color,
            // The white die-cut edge, and the shadow that tightens as it lands.
            boxShadow: `0 0 0 12px #fff, 0 ${lift}px ${lift * 2}px rgba(0,0,0,0.45)`,
            color: '#0a0b0d',
            fontFamily: fonts.sans,
            fontWeight: 900,
            fontSize: 104,
            letterSpacing: -2,
            whiteSpace: 'nowrap',
          }}
        >
          {p.emoji && <span style={{ fontSize: 112 }}>{p.emoji}</span>}
          {p.text}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const stickerSlap: EffectDef<Props> = {
  id: 'sticker-slap',
  name: { en: 'Sticker slap', es: 'Sticker pegado' },
  group: 'hook',
  description: {
    en: 'A die-cut sticker slaps onto your video with a shake. The example mod: copy it to make yours.',
    es: 'Un sticker troquelado se pega de golpe sobre tu video, con temblor. El mod de ejemplo: cópialo para hacer el tuyo.',
  },
  author: '@chitodev',
  usesMedia: true,
  defaultDurationSec: 2,
  defaults: { text: 'Shipped', emoji: '🚀', color: 'mint', x: 0.5, y: 0.42, tilt: -6, dim: 0.35 },
  localized: { es: { text: 'Lanzado' } },
  params: [
    { key: 'text', label: { en: 'Text', es: 'Texto' }, type: 'text' },
    { key: 'emoji', label: { en: 'Emoji (optional)', es: 'Emoji (opcional)' }, type: 'text' },
    { key: 'color', label: { en: 'Color', es: 'Color' }, type: 'color' },
    { key: 'x', label: { en: 'Position ↔', es: 'Posición ↔' }, type: 'number', min: 0.1, max: 0.9, step: 0.01 },
    { key: 'y', label: { en: 'Position ↕', es: 'Posición ↕' }, type: 'number', min: 0.1, max: 0.9, step: 0.01 },
    { key: 'tilt', label: { en: 'Tilt (°)', es: 'Inclinación (°)' }, type: 'number', min: -25, max: 25, step: 1 },
    { key: 'dim', label: { en: 'Darken your video', es: 'Oscurecer tu video' }, type: 'number', min: 0, max: 1, step: 0.05 },
  ],
  component: StickerSlap,
};

export default stickerSlap;
