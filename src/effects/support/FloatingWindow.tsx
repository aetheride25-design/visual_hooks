import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { colorOf, type PaletteColor } from '../../theme.ts';
import { Pill } from '../../components/media.tsx';
import { AppWindow, windowSize } from '../../components/window.tsx';
import { easeOutBack, easeOutCubic, lerp, progress, timeOf } from '../../lib/anim.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';

type Props = {
  label: string;
  color: PaletteColor;
  from: 'bottom' | 'left' | 'right';
  bar: boolean;
  address: string;
  width: number;
};

const OFFSETS = { bottom: [0, 1400], left: [-1300, 0], right: [1300, 0] } as const;

/** Your footage slides in on an Aurora card, with a tag on top. */
const FloatingWindow: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const e = easeOutBack(progress(t, 0.05, 0.6), 1.05);
  const [ox, oy] = OFFSETS[p.from];
  const float = Math.sin(t * 1.4) * 8 * easeOutCubic(progress(t, 0.6, 0.8));
  const tilt = lerp(p.from === 'bottom' ? 6 : ox > 0 ? -8 : 8, 0, e);
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

export const floatingWindow: EffectDef<Props> = {
  id: 'floating-window',
  name: { en: 'Floating window', es: 'Ventana flotante' },
  group: 'support',
  description: {
    en: 'Your footage slides in on a card with a light edge and shadow, with a tag on top.',
    es: 'Tu captura entra deslizándose en una tarjeta con borde de luz y sombra, con una etiqueta arriba.',
  },
  usesMedia: true,
  defaultDurationSec: 4,
  defaults: { label: "Here's how it looks live", color: 'mint', from: 'bottom', bar: true, address: 'your-app.dev', width: 960 },
  localized: { es: { label: 'Así se ve en vivo', address: 'tu-app.dev' } },
  params: [
    { key: 'label', label: { en: 'Top tag', es: 'Etiqueta de arriba' }, type: 'text' },
    { key: 'color', label: 'Color', type: 'color' },
    {
      key: 'from',
      label: { en: 'Comes in from', es: 'Entra desde' },
      type: 'select',
      options: [
        { value: 'bottom', label: { en: 'Bottom', es: 'Abajo' } },
        { value: 'left', label: { en: 'Left', es: 'Izquierda' } },
        { value: 'right', label: { en: 'Right', es: 'Derecha' } },
      ],
    },
    { key: 'bar', label: { en: 'Browser bar', es: 'Barra de navegador' }, type: 'boolean' },
    { key: 'address', label: { en: 'Bar text', es: 'Texto de la barra' }, type: 'text' },
    { key: 'width', label: { en: 'Card width', es: 'Ancho de la tarjeta' }, type: 'number', min: 600, max: 1040, step: 10 },
  ],
  component: FloatingWindow,
};
