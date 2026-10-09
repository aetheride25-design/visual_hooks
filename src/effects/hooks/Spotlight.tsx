import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { colorOf, fonts, type PaletteColor } from '../../theme.ts';
import { MediaAt, mediaRect } from '../../components/media.tsx';
import { easeInOutCubic, easeOutBack, easeOutCubic, lerp, progress, timeOf } from '../../lib/anim.ts';
import { FRAME } from '../../lib/frame.ts';
import { cameraTransform, pointIn, type Fit } from '../../lib/layout.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';
import { fitParam, focusParams } from '../params.ts';

type Props = {
  focusX: number;
  focusY: number;
  radius: number;
  darkness: number;
  zoom: number;
  label: string;
  color: PaletteColor;
  fit: Fit;
};

/** The lights go down around one detail: a spotlight closes in on it, with a ring that pulses and a label. */
const Spotlight: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const rect = mediaRect(p.media, FRAME, p.fit);
  const focus = pointIn(rect, p.focusX, p.focusY);
  const close = easeInOutCubic(progress(t, 0.1, 0.55));
  const zoom = lerp(1, p.zoom, easeInOutCubic(progress(t, 0.1, 0.9)));
  // The detail stays where it is on screen while the camera pushes in around it.
  const camera = cameraTransform(focus, zoom, 0, FRAME);
  const r = lerp(1400, p.radius, close);
  const feather = Math.max(24, r * 0.18);
  const color = colorOf(p.color);
  const ringP = progress(t, 0.6, 0.9);
  const labelP = progress(t, 0.55, 0.35);
  const below = focus.y < 1300;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transformOrigin: '0 0', transform: camera }}>
        <MediaAt media={p.media} rect={rect} style={{ borderRadius: p.fit === 'contain' ? 24 : 0 }} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${focus.x}px ${focus.y}px, transparent ${r}px, rgba(4,5,7,${p.darkness}) ${r + feather}px)`,
        }}
      />
      {close > 0.9 && (
        <>
          <div
            style={{
              position: 'absolute',
              left: focus.x - p.radius,
              top: focus.y - p.radius,
              width: p.radius * 2,
              height: p.radius * 2,
              borderRadius: '50%',
              border: `6px solid ${color}`,
              boxShadow: `0 0 40px ${color}88, inset 0 0 30px ${color}44`,
            }}
          />
          {/* A soft ring that keeps pulsing outward while the effect lasts */}
          {[0, 0.5].map((d) => {
            const k = ((ringP + d) % 1 + 1) % 1;
            return (
              <div
                key={d}
                style={{
                  position: 'absolute',
                  left: focus.x,
                  top: focus.y,
                  width: p.radius * 2,
                  height: p.radius * 2,
                  marginLeft: -p.radius,
                  marginTop: -p.radius,
                  borderRadius: '50%',
                  border: `4px solid ${color}`,
                  transform: `scale(${lerp(1, 1.45, easeOutCubic(k))})`,
                  opacity: t > 0.6 ? 0.6 * (1 - k) : 0,
                }}
              />
            );
          })}
        </>
      )}
      {p.label && labelP > 0 && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(860, Math.max(220, focus.x)),
            top: below ? focus.y + p.radius + 50 : focus.y - p.radius - 170,
            transform: `translateX(-50%) scale(${easeOutBack(labelP)})`,
            padding: '16px 36px',
            borderRadius: 999,
            background: 'rgba(19,21,25,0.9)',
            border: `2px solid ${color}`,
            color: '#fff',
            fontFamily: fonts.sans,
            fontWeight: 800,
            fontSize: 60,
            whiteSpace: 'nowrap',
            boxShadow: `0 16px 40px rgba(0,0,0,0.55), 0 0 40px ${color}44`,
          }}
        >
          {p.label}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const spotlight: EffectDef<Props> = {
  id: 'spotlight',
  name: { en: 'Spotlight', es: 'Reflector' },
  group: 'hook',
  description: {
    en: 'Everything goes dark except one detail: a spotlight closes in on it with a pulsing ring and a label.',
    es: 'Todo se oscurece menos un detalle: un reflector se cierra sobre él con un anillo que late y un rótulo.',
  },
  usesMedia: true,
  defaultDurationSec: 2.2,
  defaults: {
    focusX: 0.62,
    focusY: 0.45,
    radius: 170,
    darkness: 0.82,
    zoom: 1.25,
    label: 'This changes everything',
    color: 'mint',
    fit: 'contain',
  },
  localized: { es: { label: 'Esto lo cambia todo' } },
  params: [
    { key: 'label', label: { en: 'Label (empty = none)', es: 'Rótulo (vacío = ninguno)' }, type: 'text' },
    { key: 'color', label: { en: 'Ring color', es: 'Color del anillo' }, type: 'color' },
    ...focusParams({ en: 'Spotlight on', es: 'Reflector en' }),
    { key: 'radius', label: { en: 'Spotlight size', es: 'Tamaño del reflector' }, type: 'number', min: 60, max: 450, step: 5 },
    { key: 'darkness', label: { en: 'How dark around it', es: 'Cuánto se oscurece alrededor' }, type: 'number', min: 0.3, max: 0.95, step: 0.01 },
    { key: 'zoom', label: { en: 'Zoom in', es: 'Acercamiento' }, type: 'number', min: 1, max: 2.5, step: 0.05 },
    fitParam(),
  ],
  component: Spotlight,
};
