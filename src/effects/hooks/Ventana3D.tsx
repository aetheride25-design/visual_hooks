import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { colorOf, type PaletteColor } from '../../brand.ts';
import { AppWindow, windowSize } from '../../components/window.tsx';
import { easeOutBack, easeOutCubic, lerp, progress, timeOf } from '../../lib/anim.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';

type Props = {
  address: string;
  color: PaletteColor;
  tilt: number;
  popSec: number;
};

/** La ventana de tu app sale del fondo con perspectiva, rebota y queda flotando inclinada. */
const Ventana3D: React.FC<Props & BaseProps> = (p) => {
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
      {/* Halo de color detrás de la ventana */}
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

export const ventana3D: EffectDef<Props> = {
  id: 'ventana-3d',
  name: 'Ventana que salta en 3D',
  group: 'hook',
  description: 'Tu app sale del fondo en perspectiva, rebota y queda flotando inclinada con halo de color.',
  usesMedia: true,
  defaultDurationSec: 2.5,
  defaults: { address: 'localhost:3000', color: 'violet', tilt: 14, popSec: 0.55 },
  params: [
    { key: 'address', label: 'Texto de la barra', type: 'text' },
    { key: 'color', label: 'Color del halo', type: 'color' },
    { key: 'tilt', label: 'Inclinación final (°)', type: 'number', min: 0, max: 30, step: 1 },
    { key: 'popSec', label: 'Duración del salto (s)', type: 'number', min: 0.2, max: 1.2, step: 0.05 },
  ],
  component: Ventana3D,
};
