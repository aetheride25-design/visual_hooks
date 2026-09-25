import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { aurora, colorOf, fonts, type PaletteColor } from '../../theme.ts';
import { MediaBackdrop } from '../../components/backdrop.tsx';
import { countValue, easeOutBack, easeOutCubic, formatNumber, lerp, progress, timeOf } from '../../lib/anim.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';

type Props = {
  value: number;
  decimals: number;
  prefix: string;
  suffix: string;
  label: string;
  color: PaletteColor;
  countSec: number;
  size: number;
  showMedia: boolean;
};

/** A giant number that counts up to its value, with its label ("60 fps", "$20"). */
const BigNumber: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const countP = progress(t, 0.15, p.countSec);
  const n = countValue(p.value, countP, p.decimals);
  const pop = easeOutBack(progress(t, 0, 0.4), 1.6);
  // A short pulse on reaching the final value.
  const pulse = 1 + 0.06 * Math.sin(Math.PI * progress(t, 0.15 + p.countSec, 0.25));
  const labelP = easeOutCubic(progress(t, 0.15 + p.countSec * 0.6, 0.4));
  const color = colorOf(p.color);

  return (
    <AbsoluteFill>
      {p.showMedia && <MediaBackdrop media={p.media} fit="cover" dim={0.72} blur={14} />}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 30 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: p.size * 0.05,
            transform: `scale(${lerp(0.5, 1, pop) * pulse})`,
            opacity: Math.min(1, pop * 2),
            fontFamily: fonts.sans,
            fontWeight: 850,
            fontVariantNumeric: 'tabular-nums',
            color: aurora.text,
            letterSpacing: -p.size * 0.04,
            textShadow: `0 0 ${p.size * 0.4}px ${color}66, 0 10px 40px rgba(0,0,0,0.5)`,
          }}
        >
          {p.prefix && <span style={{ fontSize: p.size * 0.42, color }}>{p.prefix}</span>}
          <span style={{ fontSize: p.size, lineHeight: 1 }}>{formatNumber(n, p.decimals)}</span>
          {p.suffix && <span style={{ fontSize: p.size * 0.42, color }}>{p.suffix}</span>}
        </div>
        {p.label && (
          <div
            style={{
              fontFamily: fonts.sans,
              fontSize: 54,
              fontWeight: 600,
              color: aurora.muted,
              opacity: labelP,
              transform: `translateY(${lerp(30, 0, labelP)}px)`,
              textAlign: 'center',
              maxWidth: 900,
            }}
          >
            {p.label}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const bigNumber: EffectDef<Props> = {
  id: 'big-number',
  name: { en: 'Big number', es: 'Número grande' },
  group: 'support',
  description: {
    en: 'A giant number that counts up to its value, with its label. For build-in-public metrics.',
    es: 'Una cifra gigante que sube hasta su valor, con su etiqueta. Para métricas de build in public.',
  },
  usesMedia: false,
  defaultDurationSec: 2.5,
  defaults: { value: 60, decimals: 0, prefix: '', suffix: 'fps', label: 'smooth, frame by frame', color: 'mint', countSec: 1.1, size: 380, showMedia: false },
  localized: { es: { label: 'sin tirones, cuadro por cuadro' } },
  params: [
    { key: 'value', label: { en: 'Final value', es: 'Valor final' }, type: 'number', min: 0, max: 100000, step: 1 },
    { key: 'decimals', label: { en: 'Decimals', es: 'Decimales' }, type: 'number', min: 0, max: 2, step: 1 },
    { key: 'prefix', label: { en: 'Before the number (e.g. $)', es: 'Antes del número (ej. $)' }, type: 'text' },
    { key: 'suffix', label: { en: 'After the number (e.g. fps, k, %)', es: 'Después del número (ej. fps, k, %)' }, type: 'text' },
    { key: 'label', label: { en: 'Label', es: 'Etiqueta' }, type: 'text' },
    { key: 'color', label: 'Color', type: 'color' },
    { key: 'countSec', label: { en: 'Count duration (s)', es: 'Duración del conteo (s)' }, type: 'number', min: 0.2, max: 3, step: 0.05 },
    { key: 'size', label: { en: 'Size', es: 'Tamaño' }, type: 'number', min: 160, max: 520, step: 10 },
    { key: 'showMedia', label: { en: 'Your footage blurred behind', es: 'Tu captura desenfocada detrás' }, type: 'boolean' },
  ],
  component: BigNumber,
};
