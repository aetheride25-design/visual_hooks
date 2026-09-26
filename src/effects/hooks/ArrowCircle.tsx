import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { colorOf, fonts, type PaletteColor } from '../../theme.ts';
import { MediaAt, mediaRect } from '../../components/media.tsx';
import { easeInOutCubic, easeOutBack, easeOutCubic, lerp, progress, timeOf } from '../../lib/anim.ts';
import { FRAME } from '../../lib/frame.ts';
import { cameraTransform, pointIn, type Fit } from '../../lib/layout.ts';
import { handArrow, handEllipse, polylineLength, toPath } from '../../lib/sketch.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';

type Props = {
  shape: 'circle' | 'arrow' | 'both';
  focusX: number;
  focusY: number;
  size: number;
  label: string;
  color: PaletteColor;
  drawSec: number;
  punch: number;
  fit: Fit;
};

/** Shows the result from frame 0 and hand-draws a circle or arrow over the key detail. */
const ArrowCircle: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const rect = mediaRect(p.media, FRAME, p.fit);
  const focus = pointIn(rect, p.focusX, p.focusY);
  const zoom = lerp(1, p.punch, easeInOutCubic(progress(t, 0, 0.9)));
  const camera = cameraTransform(focus, zoom, 0, FRAME);
  // The zoom is around the detail (without centering it), so the detail stays put
  // and the stroke, drawn outside the zoom, stays on top with a constant width.
  const target = focus;
  const color = colorOf(p.color);

  const rx = p.size;
  const ry = p.size * 0.55;
  const ellipse = handEllipse(target, rx, ry, 2);
  const from = { x: target.x < 540 ? target.x + 330 : target.x - 330, y: target.y + (target.y < 1200 ? 520 : -520) };
  const arrow = handArrow(from, { x: target.x + (from.x > target.x ? rx * 0.75 : -rx * 0.75), y: target.y + (from.y > target.y ? ry * 0.9 : -ry * 0.9) });

  const drawCircle = p.shape !== 'arrow';
  const drawArrow = p.shape !== 'circle';
  const d0 = 0.15;
  const circleP = easeOutCubic(progress(t, d0, p.drawSec));
  const arrowStart = drawCircle ? d0 + p.drawSec * 0.7 : d0;
  const arrowP = easeOutCubic(progress(t, arrowStart, p.drawSec * 0.8));
  const headP = progress(t, arrowStart + p.drawSec * 0.75, 0.12);
  const labelP = progress(t, arrowStart + p.drawSec * 0.5, 0.35);

  const stroke = (pts: { x: number; y: number }[], prog: number, width: number) => {
    const len = polylineLength(pts);
    return (
      <path
        d={toPath(pts)}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - prog)}
        style={{ filter: `drop-shadow(0 0 12px ${color}88) drop-shadow(0 4px 10px rgba(0,0,0,0.6))` }}
      />
    );
  };

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transformOrigin: '0 0', transform: camera }}>
        <MediaAt media={p.media} rect={rect} style={{ borderRadius: p.fit === 'contain' ? 24 : 0 }} />
      </AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {drawCircle && circleP > 0 && stroke(ellipse, circleP, 12)}
        {drawArrow && arrowP > 0 && stroke(arrow.shaft, arrowP, 12)}
        {drawArrow && headP > 0 && arrow.head.map((w, i) => <React.Fragment key={i}>{stroke(w, headP, 12)}</React.Fragment>)}
      </svg>
      {p.label && labelP > 0 && (
        <div
          style={{
            position: 'absolute',
            left: drawArrow ? from.x : target.x,
            top: drawArrow ? from.y + (from.y > target.y ? 30 : -150) : target.y + ry + 40,
            transform: `translateX(-50%) scale(${easeOutBack(labelP)}) rotate(-3deg)`,
            padding: '14px 32px',
            borderRadius: 20,
            background: color,
            color: '#0a0b0d',
            fontFamily: fonts.sans,
            fontWeight: 800,
            fontSize: 64,
            whiteSpace: 'nowrap',
            boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 50px ${color}55`,
          }}
        >
          {p.label}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const arrowCircle: EffectDef<Props> = {
  id: 'arrow-circle',
  name: { en: 'Hand-drawn arrow or circle', es: 'Flecha o círculo a mano' },
  group: 'hook',
  description: {
    en: 'The result from frame 0 and a hand-drawn stroke pointing at the key detail.',
    es: 'Resultado desde el cuadro 0 y un trazo a mano que señala el dato clave.',
  },
  usesMedia: true,
  defaultDurationSec: 2.2,
  defaults: {
    shape: 'both',
    focusX: 0.5,
    focusY: 0.5,
    size: 190,
    label: 'look at this',
    color: 'red',
    drawSec: 0.45,
    punch: 1.12,
    fit: 'contain',
  },
  localized: { es: { label: 'mira esto' } },
  params: [
    {
      key: 'shape',
      label: { en: 'Stroke', es: 'Trazo' },
      type: 'select',
      options: [
        { value: 'circle', label: { en: 'Circle', es: 'Círculo' } },
        { value: 'arrow', label: { en: 'Arrow', es: 'Flecha' } },
        { value: 'both', label: { en: 'Both', es: 'Ambos' } },
      ],
    },
    { key: 'label', label: { en: 'Label (empty = no label)', es: 'Rótulo (vacío = sin rótulo)' }, type: 'text' },
    { key: 'color', label: { en: 'Stroke color', es: 'Color del trazo' }, type: 'color' },
    { key: 'focusX', label: { en: 'Key detail ↔ (on your screenshot)', es: 'Dato clave ↔ (sobre tu captura)' }, type: 'number', min: 0, max: 1, step: 0.01 },
    { key: 'focusY', label: { en: 'Key detail ↕ (on your screenshot)', es: 'Dato clave ↕ (sobre tu captura)' }, type: 'number', min: 0, max: 1, step: 0.01 },
    { key: 'size', label: { en: 'Circle size', es: 'Tamaño del círculo' }, type: 'number', min: 60, max: 450, step: 5 },
    { key: 'drawSec', label: { en: 'Stroke speed (s)', es: 'Velocidad del trazo (s)' }, type: 'number', min: 0.15, max: 1.5, step: 0.05 },
    { key: 'punch', label: { en: 'Zoom in', es: 'Acercamiento' }, type: 'number', min: 1, max: 2, step: 0.02 },
    {
      key: 'fit',
      label: { en: 'Screenshot framing', es: 'Encuadre de la captura' },
      type: 'select',
      options: [
        { value: 'contain', label: { en: 'Whole', es: 'Completa' } },
        { value: 'cover', label: { en: 'Fill screen', es: 'Llenar pantalla' } },
      ],
    },
  ],
  component: ArrowCircle,
};
