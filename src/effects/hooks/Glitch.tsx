import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { aurora, colorOf, fonts, type PaletteColor } from '../../brand.ts';
import { MediaAt, mediaRect } from '../../components/brand.tsx';
import { progress, timeOf } from '../../lib/anim.ts';
import { FRAME } from '../../lib/frame.ts';
import type { Fit } from '../../lib/layout.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';

type Props = {
  title: string;
  color: PaletteColor;
  intensity: number;
  glitchSec: number;
  aftershock: boolean;
  fit: Fit;
};

/** Cuánto "rompe" la imagen en el tiempo t: golpe fuerte al inicio y, si se pide, un réplica corta. */
const glitchAmount = (t: number, dur: number, aftershock: boolean): number => {
  const main = t < dur ? 1 - progress(t, dur * 0.4, dur * 0.6) : 0;
  const after = aftershock && t > dur + 0.55 && t < dur + 0.67 ? 0.6 : 0;
  return Math.max(main, after);
};

/**
 * Transición glitch: la imagen se parte en bandas desplazadas y separa los canales RGB,
 * y se recompone. Es un filtro SVG sobre un solo video, con semilla por cuadro (determinista).
 */
const Glitch: React.FC<Props & BaseProps> = (p) => {
  const frame = useCurrentFrame();
  const t = timeOf(frame, p.fps, p.speed);
  const k = glitchAmount(t, p.glitchSec, p.aftershock) * p.intensity;
  // La semilla cambia cada 2 cuadros para que el ruido "salte" como un glitch real.
  const seed = Math.floor(frame / 2) + 1;
  const id = `glitch-${seed}`;
  const split = 26 * k;
  const rect = mediaRect(p.media, FRAME, p.fit);
  const titleP = progress(t, p.glitchSec * 0.5, 0.2);

  return (
    <AbsoluteFill>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.00001 0.045" numOctaves={1} seed={seed} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={240 * k} xChannelSelector="R" yChannelSelector="B" result="bands" />
          <feColorMatrix in="bands" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feOffset in="r" dx={split} dy={0} result="r2" />
          <feColorMatrix in="bands" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
          <feColorMatrix in="bands" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
          <feOffset in="b" dx={-split} dy={0} result="b2" />
          <feBlend in="r2" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="b2" mode="screen" />
        </filter>
      </svg>
      <AbsoluteFill style={{ filter: k > 0.01 ? `url(#${id})` : undefined }}>
        <MediaAt media={p.media} rect={rect} style={{ borderRadius: p.fit === 'contain' ? 24 : 0 }} />
      </AbsoluteFill>
      {p.title && titleP > 0 && (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 280 }}>
          <div
            style={{
              fontFamily: fonts.mono,
              fontWeight: 700,
              fontSize: 120,
              letterSpacing: 2,
              color: aurora.text,
              opacity: titleP,
              transform: `translateX(${k * 30 * Math.sin(frame * 7.3)}px)`,
              textShadow: `${4 + split * 0.5}px 0 ${aurora.red}, ${-4 - split * 0.5}px 0 ${aurora.blue}, 0 0 40px ${colorOf(p.color)}88`,
            }}
          >
            {p.title}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const glitch: EffectDef<Props> = {
  id: 'glitch',
  name: 'Glitch',
  group: 'hook',
  description: 'La imagen se parte en bandas y separa los colores RGB, y se recompone. Estilo Fireship.',
  usesMedia: true,
  defaultDurationSec: 1.6,
  defaults: { title: 'BUG', color: 'violet', intensity: 1, glitchSec: 0.4, aftershock: true, fit: 'contain' },
  params: [
    { key: 'title', label: 'Palabra (vacío = sin texto)', type: 'text' },
    { key: 'color', label: 'Color del brillo', type: 'color' },
    { key: 'intensity', label: 'Intensidad', type: 'number', min: 0.2, max: 2, step: 0.05 },
    { key: 'glitchSec', label: 'Duración del glitch (s)', type: 'number', min: 0.1, max: 1.5, step: 0.05 },
    { key: 'aftershock', label: 'Réplica corta después', type: 'boolean' },
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
  component: Glitch,
};
