import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { colorOf, fonts, type PaletteColor } from '../../theme.ts';
import { MediaAt, mediaRect } from '../../components/media.tsx';
import { easeInOutCubic, easeOutBack, easeOutCubic, lerp, progress, timeOf } from '../../lib/anim.ts';
import { FRAME } from '../../lib/frame.ts';
import { cameraTransform, pointIn, type Fit } from '../../lib/layout.ts';
import { curvePoint } from '../../lib/sketch.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';
import { fitParam, focusParams } from '../params.ts';

type Props = {
  focusX: number;
  focusY: number;
  clickSec: number;
  zoom: number;
  label: string;
  color: PaletteColor;
  fit: Fit;
};

/** A mouse pointer: white arrow with a dark outline, its tip at (0, 0). */
const Pointer: React.FC<{ scale: number }> = ({ scale }) => (
  <svg width={90} height={120} viewBox="0 0 18 24" style={{ transform: `scale(${scale})`, transformOrigin: '0 0', overflow: 'visible' }}>
    <path
      d="M1 1 L1 19 L5.6 14.8 L8.6 21.6 L11.6 20.3 L8.7 13.6 L14.8 13.6 Z"
      fill="#fff"
      stroke="#0a0b0d"
      strokeWidth={1.4}
      strokeLinejoin="round"
      style={{ filter: 'drop-shadow(0 1.5px 2px rgba(0,0,0,0.55))' }}
    />
  </svg>
);

/** A cursor glides to the button, clicks with a ripple, and the camera dives into what you clicked. */
const CursorClick: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const rect = mediaRect(p.media, FRAME, p.fit);
  const target = pointIn(rect, p.focusX, p.focusY);
  const color = colorOf(p.color);

  // The cursor comes in from the opposite lower corner along a slight curve.
  const start = { x: target.x < 540 ? 1000 : 80, y: Math.min(1860, target.y + 700) };
  const travel = Math.max(0.1, p.clickSec - 0.1);
  const move = easeInOutCubic(progress(t, 0.05, travel));
  const at = curvePoint(start, target, target.x < 540 ? -0.18 : 0.18, move);
  // Press and release.
  const press = progress(t, p.clickSec, 0.08) - progress(t, p.clickSec + 0.1, 0.1);
  // After the click the camera dives toward the target.
  const dive = easeInOutCubic(progress(t, p.clickSec + 0.15, 0.6));
  const zoom = lerp(1, p.zoom, dive);
  const camera = cameraTransform(target, zoom, dive, FRAME);
  const ripple = progress(t, p.clickSec + 0.04, 0.55);
  const labelP = progress(t, p.clickSec + 0.25, 0.35);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transformOrigin: '0 0', transform: camera }}>
        <MediaAt media={p.media} rect={rect} style={{ borderRadius: p.fit === 'contain' ? 24 : 0 }} />
        {/* The ripple and the cursor ride along with the zoom, on top of what you clicked */}
        {ripple > 0 && ripple < 1 && (
          <div
            style={{
              position: 'absolute',
              left: target.x,
              top: target.y,
              width: 160,
              height: 160,
              margin: -80,
              borderRadius: '50%',
              border: `8px solid ${color}`,
              background: `${color}33`,
              transform: `scale(${lerp(0.2, 1.6, easeOutCubic(ripple))})`,
              opacity: 1 - ripple,
            }}
          />
        )}
        <div style={{ position: 'absolute', left: at.x, top: at.y, opacity: Math.min(1, t * 8) }}>
          <Pointer scale={(1 - 0.18 * Math.max(0, press)) / Math.max(1, zoom * 0.85)} />
        </div>
      </AbsoluteFill>
      {p.label && labelP > 0 && (
        <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 300 }}>
          <div
            style={{
              transform: `translateY(${lerp(40, 0, easeOutCubic(labelP))}px) scale(${lerp(0.8, 1, easeOutBack(labelP))})`,
              opacity: labelP,
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: '20px 40px',
              borderRadius: 26,
              background: 'rgba(19,21,25,0.92)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 50px ${color}33`,
              color: '#fff',
              fontFamily: fonts.sans,
              fontWeight: 750,
              fontSize: 62,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ width: 22, height: 22, borderRadius: 11, background: color, boxShadow: `0 0 18px ${color}` }} />
            {p.label}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const cursorClick: EffectDef<Props> = {
  id: 'cursor-click',
  name: { en: 'Cursor click', es: 'Clic del cursor' },
  group: 'hook',
  description: {
    en: 'A cursor glides to the button, clicks with a ripple and the camera dives in. For tutorials and demos.',
    es: 'Un cursor llega al botón, hace clic con una onda y la cámara se mete. Para tutoriales y demos.',
  },
  usesMedia: true,
  defaultDurationSec: 2.4,
  thumbSec: 0.85,
  defaults: {
    focusX: 0.7,
    focusY: 0.3,
    clickSec: 0.8,
    zoom: 1.8,
    label: 'One click. Done.',
    color: 'blue',
    fit: 'contain',
  },
  localized: { es: { label: 'Un clic. Listo.' } },
  params: [
    { key: 'label', label: { en: 'Label (empty = none)', es: 'Rótulo (vacío = ninguno)' }, type: 'text' },
    { key: 'color', label: { en: 'Click color', es: 'Color del clic' }, type: 'color' },
    ...focusParams({ en: 'Clicks on', es: 'Hace clic en' }),
    { key: 'clickSec', label: { en: 'Click moment (s)', es: 'Momento del clic (s)' }, type: 'number', min: 0.3, max: 2, step: 0.05 },
    { key: 'zoom', label: { en: 'Zoom after the click', es: 'Acercamiento después del clic' }, type: 'number', min: 1, max: 4, step: 0.1 },
    fitParam({ en: 'Screenshot framing', es: 'Encuadre de la captura' }),
  ],
  component: CursorClick,
};
