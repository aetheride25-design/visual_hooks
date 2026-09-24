import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { aurora, colorOf, fonts, type PaletteColor } from '../../brand.ts';
import { MediaBackdrop } from '../../components/backdrop.tsx';
import { cardStyle } from '../../components/brand.tsx';
import { easeInOutCubic, easeOutBack, easeOutCubic, formatClock, lerp, progress, timeOf } from '../../lib/anim.ts';
import type { Fit } from '../../lib/layout.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';

type Props = {
  minutes: number;
  seconds: number;
  label: string;
  color: PaletteColor;
  countSec: number;
  position: 'arriba' | 'centro' | 'abajo';
  showMedia: boolean;
  dim: number;
  fit: Fit;
};

const START = 0.3;

/** Un cronómetro corre rápido encima de tu captura y frena en el tiempo final ("lo hice en 10:00"). */
const Cronometro: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const color = colorOf(p.color);
  const target = p.minutes * 60 + p.seconds;
  const run = easeInOutCubic(progress(t, START, p.countSec));
  const elapsed = target * run;
  const finished = t >= START + p.countSec;
  const cardIn = easeOutBack(progress(t, 0, 0.35), 1.3);
  const pulse = 1 + 0.08 * Math.sin(Math.PI * progress(t, START + p.countSec, 0.25));
  const doneP = easeOutBack(progress(t, START + p.countSec, 0.3), 1.6);
  // Multiplicador "x60" que se ve mientras corre: cuántas veces más rápido que el tiempo real.
  const rate = Math.max(2, Math.round(target / p.countSec));
  const running = t >= START && !finished;
  const justify = p.position === 'arriba' ? 'flex-start' : p.position === 'abajo' ? 'flex-end' : 'center';
  const tint = finished ? color : aurora.text;

  return (
    <AbsoluteFill>
      {p.showMedia && <MediaBackdrop media={p.media} fit={p.fit} dim={p.dim} />}
      <AbsoluteFill style={{ justifyContent: justify, alignItems: 'center', padding: '220px 60px' }}>
        <div
          style={{
            ...cardStyle(44, finished ? color : undefined),
            padding: '40px 64px 46px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            minWidth: 700,
            transform: `translateY(${lerp(-80, 0, cardIn)}px) scale(${lerp(0.8, 1, cardIn) * pulse})`,
            opacity: Math.min(1, cardIn * 2),
            background: 'rgba(19,21,25,0.9)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: fonts.sans, fontSize: 40, fontWeight: 600, color: aurora.muted }}>
            {/* Punto rojo de "grabando" mientras corre; check cuando termina. */}
            {finished ? (
              <span style={{ color, fontWeight: 900, transform: `scale(${doneP})`, display: 'inline-block' }}>✓</span>
            ) : (
              <span style={{ width: 20, height: 20, borderRadius: 10, background: aurora.red, boxShadow: `0 0 16px ${aurora.red}`, opacity: Math.floor(t * 3) % 2 ? 0.35 : 1 }} />
            )}
            {p.label}
            {running && <span style={{ fontFamily: fonts.mono, fontSize: 30, color: aurora.text, opacity: 0.8 }}>⏩ x{rate}</span>}
          </div>
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 190,
              fontWeight: 700,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: -4,
              color: tint,
              textShadow: finished ? `0 0 60px ${color}88` : '0 8px 30px rgba(0,0,0,0.5)',
            }}
          >
            {formatClock(elapsed)}
          </div>
          <div style={{ width: '100%', height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${run * 100}%`,
                height: '100%',
                borderRadius: 6,
                background: `linear-gradient(90deg, ${aurora.blue}, ${color})`,
                boxShadow: `0 0 20px ${color}`,
                opacity: lerp(1, 0.9, easeOutCubic(progress(t, START + p.countSec, 0.3))),
              }}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const cronometro: EffectDef<Props> = {
  id: 'cronometro',
  name: 'Cronómetro',
  group: 'hook',
  description: 'Un reloj corre rápido encima de tu captura y frena en el tiempo final: "lo hice en 10:00".',
  usesMedia: true,
  defaultDurationSec: 3,
  defaults: {
    minutes: 10,
    seconds: 0,
    label: 'lo hice en',
    color: 'mint',
    countSec: 1.6,
    position: 'arriba',
    showMedia: true,
    dim: 0.15,
    fit: 'contain',
  },
  params: [
    { key: 'label', label: 'Texto', type: 'text' },
    { key: 'minutes', label: 'Minutos', type: 'number', min: 0, max: 600, step: 1 },
    { key: 'seconds', label: 'Segundos', type: 'number', min: 0, max: 59, step: 1 },
    { key: 'color', label: 'Color al terminar', type: 'color' },
    { key: 'countSec', label: 'Cuánto tarda en correr (s)', type: 'number', min: 0.3, max: 5, step: 0.1 },
    {
      key: 'position',
      label: 'Posición',
      type: 'select',
      options: [
        { value: 'arriba', label: 'Arriba' },
        { value: 'centro', label: 'Centro' },
        { value: 'abajo', label: 'Abajo' },
      ],
    },
    { key: 'showMedia', label: 'Tu captura detrás', type: 'boolean' },
    { key: 'dim', label: 'Oscurecer captura', type: 'number', min: 0, max: 1, step: 0.02 },
    {
      key: 'fit',
      label: 'Encuadre',
      type: 'select',
      options: [
        { value: 'contain', label: 'Completa' },
        { value: 'cover', label: 'Llenar pantalla' },
      ],
    },
  ],
  component: Cronometro,
};
