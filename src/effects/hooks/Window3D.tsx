import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { colorOf, type PaletteColor } from '../../theme.ts';
import { AppWindow, windowSize } from '../../components/window.tsx';
import { easeOutBack, easeOutCubic, lerp, progress, timeOf } from '../../lib/anim.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';

type Props = {
  address: string;
  color: PaletteColor;
  tilt: number;
  popSec: number;
};

/** Your app window pops out of the background in perspective, bounces and keeps floating at an angle. */
const Window3D: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const pop = progress(t, 0.05, p.popSec);
  const e = easeOutBack(pop, 1.3);
  const settle = easeOutCubic(progress(t, 0.05 + p.popSec, 1.2));
  const float = Math.sin(t * 1.6) * 6 * settle;

  const rx = lerp(62, p.tilt * 0.6, e);
  const ry = lerp(-38, -p.tilt, e) + settle * p.tilt * 0.3;
  const z = lerp(-1400, 0, easeOutCubic(pop));
  const size = windowSize(p.media, 940, 1400);
  const color = colorOf(p.color);

  return (
    <AbsoluteFill style={{ perspective: 2000, justifyContent: 'center', alignItems: 'center' }}>
      {/* Color glow behind the window */}
      <div
        style={{
          position: 'absolute',
          width: size.w * 1.1,
          height: size.h * 1.1,
          borderRadius: '50%',
          background: `radial-gradient(closest-side, ${color}55, ${color}00)`,
          filter: 'blur(60px)',
          opacity: easeOutCubic(pop),
        }}
      />
      <div
        style={{
          transform: `translate3d(0, ${float}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg)`,
          opacity: Math.min(1, pop * 4),
          transformStyle: 'preserve-3d',
        }}
      >
        <AppWindow media={p.media} width={size.w} mediaHeight={size.mediaH} address={p.address} glow={color} />
      </div>
    </AbsoluteFill>
  );
};

export const window3D: EffectDef<Props> = {
  id: 'window-3d',
  name: { en: '3D window pop', es: 'Ventana que salta en 3D' },
  group: 'hook',
  description: {
    en: 'Your app pops out of the background in perspective, bounces and floats at an angle with a color glow.',
    es: 'Tu app sale del fondo en perspectiva, rebota y queda flotando inclinada con halo de color.',
  },
  usesMedia: true,
  defaultDurationSec: 2.5,
  defaults: { address: 'localhost:3000', color: 'violet', tilt: 14, popSec: 0.55 },
  params: [
    { key: 'address', label: { en: 'Address bar text', es: 'Texto de la barra' }, type: 'text' },
    { key: 'color', label: { en: 'Glow color', es: 'Color del halo' }, type: 'color' },
    { key: 'tilt', label: { en: 'Final tilt (°)', es: 'Inclinación final (°)' }, type: 'number', min: 0, max: 30, step: 1 },
    { key: 'popSec', label: { en: 'Pop duration (s)', es: 'Duración del salto (s)' }, type: 'number', min: 0.2, max: 1.2, step: 0.05 },
  ],
  component: Window3D,
};
