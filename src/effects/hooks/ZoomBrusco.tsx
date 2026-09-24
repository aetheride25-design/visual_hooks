import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { colorOf, fonts, type PaletteColor } from '../../brand.ts';
import { MediaAt, mediaRect } from '../../components/brand.tsx';
import { easeOutBack, easeOutExpo, lerp, progress, shake, timeOf } from '../../lib/anim.ts';
import { cameraTransform, pointIn, type Fit } from '../../lib/layout.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';
import { FRAME } from '../../lib/frame.ts';

type Props = {
  focusX: number;
  focusY: number;
  zoom: number;
  impactSec: number;
  label: string;
  color: PaletteColor;
  fit: Fit;
  flash: boolean;
};

const ZOOM_DUR = 0.18;

const ZoomBrusco: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const rect = mediaRect(p.media, FRAME, p.fit);
  const focus = pointIn(rect, p.focusX, p.focusY);

  const move = easeOutExpo(progress(t, p.impactSec, ZOOM_DUR));
  // Antes del golpe, un empujón lento para que la toma no se sienta congelada.
  const pre = lerp(1, 1.05, progress(t, 0, p.impactSec));
  const zoom = lerp(pre, p.zoom, move);
  const traveling = t >= p.impactSec && t < p.impactSec + ZOOM_DUR;
  const blur = traveling ? 3 + 14 * (1 - move) : 0;
  const hit = p.impactSec + ZOOM_DUR * 0.6;
  const sh = shake(t - hit, 26, 0.45, 3);
  const flash = p.flash && t >= hit ? 0.45 * (1 - progress(t, hit, 0.14)) : 0;
  const labelP = progress(t, p.impactSec + ZOOM_DUR, 0.32);
  const color = colorOf(p.color);

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          transformOrigin: '0 0',
          transform: `translate(${sh.x}px, ${sh.y}px) ${cameraTransform(focus, zoom, move, FRAME)}`,
          filter: blur ? `blur(${blur}px)` : undefined,
        }}
      >
        <MediaAt media={p.media} rect={rect} />
      </AbsoluteFill>
      {flash > 0 && <AbsoluteFill style={{ background: '#fff', opacity: flash }} />}
      {p.label && labelP > 0 && (
        <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 380 }}>
          <div
            style={{
              transform: `scale(${lerp(2.4, 1, easeOutBack(labelP))}) rotate(${lerp(-6, -2, labelP)}deg)`,
              opacity: Math.min(1, labelP * 4),
              padding: '22px 46px',
              borderRadius: 28,
              background: color,
              color: '#0a0b0d',
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 96,
              letterSpacing: -1,
              boxShadow: `0 20px 60px rgba(0,0,0,0.55), 0 0 80px ${color}66`,
            }}
          >
            {p.label}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const zoomBrusco: EffectDef<Props> = {
  id: 'zoom-brusco',
  name: 'Zoom brusco',
  group: 'hook',
  description: 'La cámara se lanza al resultado con desenfoque de movimiento, temblor y un rótulo que cae.',
  usesMedia: true,
  defaultDurationSec: 2,
  defaults: {
    focusX: 0.62,
    focusY: 0.48,
    zoom: 2.6,
    impactSec: 0.3,
    label: '¡60 fps!',
    color: 'mint',
    fit: 'contain',
    flash: true,
  },
  params: [
    { key: 'label', label: 'Rótulo', type: 'text' },
    { key: 'color', label: 'Color del rótulo', type: 'color' },
    { key: 'focusX', label: 'Punto de zoom ↔ (sobre tu captura)', type: 'number', min: 0, max: 1, step: 0.01 },
    { key: 'focusY', label: 'Punto de zoom ↕ (sobre tu captura)', type: 'number', min: 0, max: 1, step: 0.01 },
    { key: 'zoom', label: 'Cuánto acerca', type: 'number', min: 1.2, max: 6, step: 0.1 },
    { key: 'impactSec', label: 'Momento del golpe (s)', type: 'number', min: 0, max: 1.5, step: 0.05 },
    { key: 'flash', label: 'Destello al golpear', type: 'boolean' },
    {
      key: 'fit',
      label: 'Encuadre de la captura',
      type: 'select',
      options: [
        { value: 'contain', label: 'Completa' },
        { value: 'cover', label: 'Llenar pantalla' },
      ],
    },
  ],
  component: ZoomBrusco,
};
