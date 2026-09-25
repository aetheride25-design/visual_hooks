import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { aurora, colorOf, fonts, type PaletteColor } from '../../theme.ts';
import { MediaBackdrop } from '../../components/backdrop.tsx';
import { cardStyle } from '../../components/media.tsx';
import { easeInOutCubic, easeOutBack, easeOutCubic, formatClock, lerp, progress, timeOf } from '../../lib/anim.ts';
import type { Fit } from '../../lib/layout.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';

type Props = {
  minutes: number;
  seconds: number;
  label: string;
  color: PaletteColor;
  countSec: number;
  position: 'top' | 'center' | 'bottom';
  showMedia: boolean;
  dim: number;
  fit: Fit;
};

const START = 0.3;

/** A stopwatch races over your screenshot and stops at the final time ("built it in 10:00"). */
const Stopwatch: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const color = colorOf(p.color);
  const target = p.minutes * 60 + p.seconds;
  const run = easeInOutCubic(progress(t, START, p.countSec));
  const elapsed = target * run;
  const finished = t >= START + p.countSec;
  const cardIn = easeOutBack(progress(t, 0, 0.35), 1.3);
  const pulse = 1 + 0.08 * Math.sin(Math.PI * progress(t, START + p.countSec, 0.25));
  const doneP = easeOutBack(progress(t, START + p.countSec, 0.3), 1.6);
  // "x60" multiplier shown while it runs: how many times faster than real time.
  const rate = Math.max(2, Math.round(target / p.countSec));
  const running = t >= START && !finished;
  const justify = p.position === 'top' ? 'flex-start' : p.position === 'bottom' ? 'flex-end' : 'center';
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
            {/* Red "recording" dot while running; a check when done. */}
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

export const stopwatch: EffectDef<Props> = {
  id: 'stopwatch',
  name: { en: 'Stopwatch', es: 'Cronómetro' },
  group: 'hook',
  description: {
    en: 'A clock races over your screenshot and stops at the final time: "built it in 10:00".',
    es: 'Un reloj corre rápido encima de tu captura y frena en el tiempo final: "lo hice en 10:00".',
  },
  usesMedia: true,
  defaultDurationSec: 3,
  defaults: {
    minutes: 10,
    seconds: 0,
    label: 'built it in',
    color: 'mint',
    countSec: 1.6,
    position: 'top',
    showMedia: true,
    dim: 0.15,
    fit: 'contain',
  },
  localized: { es: { label: 'lo hice en' } },
  params: [
    { key: 'label', label: { en: 'Text', es: 'Texto' }, type: 'text' },
    { key: 'minutes', label: { en: 'Minutes', es: 'Minutos' }, type: 'number', min: 0, max: 600, step: 1 },
    { key: 'seconds', label: { en: 'Seconds', es: 'Segundos' }, type: 'number', min: 0, max: 59, step: 1 },
    { key: 'color', label: { en: 'Color when done', es: 'Color al terminar' }, type: 'color' },
    { key: 'countSec', label: { en: 'Run time (s)', es: 'Cuánto tarda en correr (s)' }, type: 'number', min: 0.3, max: 5, step: 0.1 },
    {
      key: 'position',
      label: { en: 'Position', es: 'Posición' },
      type: 'select',
      options: [
        { value: 'top', label: { en: 'Top', es: 'Arriba' } },
        { value: 'center', label: { en: 'Center', es: 'Centro' } },
        { value: 'bottom', label: { en: 'Bottom', es: 'Abajo' } },
      ],
    },
    { key: 'showMedia', label: { en: 'Your screenshot behind', es: 'Tu captura detrás' }, type: 'boolean' },
    { key: 'dim', label: { en: 'Darken screenshot', es: 'Oscurecer captura' }, type: 'number', min: 0, max: 1, step: 0.02 },
    {
      key: 'fit',
      label: { en: 'Framing', es: 'Encuadre' },
      type: 'select',
      options: [
        { value: 'contain', label: { en: 'Whole', es: 'Completa' } },
        { value: 'cover', label: { en: 'Fill screen', es: 'Llenar pantalla' } },
      ],
    },
  ],
  component: Stopwatch,
};
