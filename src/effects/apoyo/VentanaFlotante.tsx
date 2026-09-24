import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { colorOf, type PaletteColor } from '../../brand.ts';
import { Pill } from '../../components/brand.tsx';
import { AppWindow, windowSize } from '../../components/window.tsx';
import { easeOutBack, easeOutCubic, lerp, progress, timeOf } from '../../lib/anim.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';

type Props = {
  label: string;
  color: PaletteColor;
  from: 'abajo' | 'izquierda' | 'derecha';
  bar: boolean;
  address: string;
  width: number;
};

const OFFSETS = { abajo: [0, 1400], izquierda: [-1300, 0], derecha: [1300, 0] } as const;

/** Tu captura entra deslizándose en una tarjeta Aurora, con una etiqueta arriba. */
const VentanaFlotante: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const e = easeOutBack(progress(t, 0.05, 0.6), 1.05);
  const [ox, oy] = OFFSETS[p.from];
  const float = Math.sin(t * 1.4) * 8 * easeOutCubic(progress(t, 0.6, 0.8));
  const tilt = lerp(p.from === 'abajo' ? 6 : ox > 0 ? -8 : 8, 0, e);
  const size = windowSize(p.media, p.width, 1300, p.bar);
  const labelP = easeOutBack(progress(t, 0.35, 0.4), 1.6);
  const color = colorOf(p.color);

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
        {p.label && (
          <Pill
            text={p.label}
            color={color}
            style={{ transform: `translateY(${lerp(-40, 0, labelP)}px) scale(${lerp(0.6, 1, labelP)})`, opacity: Math.min(1, labelP * 2) }}
          />
        )}
        <div
          style={{
            transform: `translate(${lerp(ox, 0, e)}px, ${lerp(oy, 0, e) + float}px) rotate(${tilt}deg)`,
          }}
        >
          <AppWindow media={p.media} width={size.w} mediaHeight={size.mediaH} address={p.address} glow={color} bar={p.bar} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ventanaFlotante: EffectDef<Props> = {
  id: 'ventana-flotante',
  name: 'Ventana flotante',
  group: 'apoyo',
  description: 'Tu captura entra deslizándose en una tarjeta con borde de luz y sombra, con una etiqueta arriba.',
  usesMedia: true,
  defaultDurationSec: 4,
  defaults: { label: 'Así se ve en vivo', color: 'mint', from: 'abajo', bar: true, address: 'chito.dev', width: 960 },
  params: [
    { key: 'label', label: 'Etiqueta de arriba', type: 'text' },
    { key: 'color', label: 'Color', type: 'color' },
    {
      key: 'from',
      label: 'Entra desde',
      type: 'select',
      options: [
        { value: 'abajo', label: 'Abajo' },
        { value: 'izquierda', label: 'Izquierda' },
        { value: 'derecha', label: 'Derecha' },
      ],
    },
    { key: 'bar', label: 'Barra de navegador', type: 'boolean' },
    { key: 'address', label: 'Texto de la barra', type: 'text' },
    { key: 'width', label: 'Ancho de la tarjeta', type: 'number', min: 600, max: 1040, step: 10 },
  ],
  component: VentanaFlotante,
};
