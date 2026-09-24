import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { aurora, colorOf, fonts, type PaletteColor } from '../../brand.ts';
import { cardStyle, MediaAt, mediaRect } from '../../components/brand.tsx';
import { KineticText } from '../../components/text.tsx';
import { easeOutBack, easeOutCubic, lerp, progress, timeOf } from '../../lib/anim.ts';
import type { Fit, Rect } from '../../lib/layout.ts';
import type { BaseProps, EffectDef, MediaRef } from '../../lib/types.ts';

type Props = {
  layout: 'mitades' | 'franja';
  kicker: string;
  title: string;
  color: PaletteColor;
  topMedia: MediaRef | null;
  loopTop: boolean;
  bandHeight: number;
  showGuide: boolean;
  fit: Fit;
};

/** Diseño "dos mitades": cada toma en su mitad de 1080×960. */
const TOP_HALF: Rect = { x: 0, y: 0, w: 1080, h: 960 };
const BOTTOM_HALF: Rect = { x: 0, y: 960, w: 1080, h: 960 };
/** Margen para que el fondo de marca se vea alrededor de tu video cuando va completo. */
const MARGIN = 36;
const BOTTOM_INSET: Rect = { x: MARGIN, y: 960 + MARGIN, w: 1080 - 2 * MARGIN, h: 960 - 2 * MARGIN };
/** Diseño "título + franja" (el original): título arriba, franja para subtítulos y tarjeta abajo. */
const TOP_H = 760;

/** Título animado que se muestra arriba cuando no hay una toma para esa mitad. */
const TopTitle: React.FC<{ box: Rect; kicker: string; title: string; color: string; t: number }> = ({ box, kicker, title, color, t }) => {
  const kickerP = progress(t, 0.15, 0.3);
  return (
    <div
      style={{
        position: 'absolute',
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 36,
        padding: '0 40px',
      }}
    >
      {kicker && (
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 38,
            color,
            letterSpacing: 6,
            textTransform: 'uppercase',
            opacity: kickerP,
            transform: `translateY(${lerp(20, 0, easeOutCubic(kickerP))}px)`,
          }}
        >
          {kicker}
        </div>
      )}
      <KineticText text={title} t={t} start={0.25} stagger={0.09} size={112} accent={color} entrance="rise" />
    </div>
  );
};

/**
 * Mitad y mitad.
 * - "mitades": arriba una toma (tu animación con fondo transparente, sobre el fondo de marca) y abajo tu video
 *   centrado y completo, cada uno en su mitad de 1080×960.
 * - "franja": arriba un título, en medio una franja libre para subtítulos y abajo tu captura en tarjeta.
 */
const MitadYMitad: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const color = colorOf(p.color);
  const inBottom = easeOutCubic(progress(t, 0.05, 0.5));
  const inTop = easeOutBack(progress(t, 0, 0.5), 1.1);

  if (p.layout === 'mitades') {
    const contained = p.fit === 'contain';
    const bottom = mediaRect(p.media, contained ? BOTTOM_INSET : BOTTOM_HALF, p.fit);
    return (
      <AbsoluteFill>
        {p.topMedia ? (
          <MediaAt media={p.topMedia} rect={mediaRect(p.topMedia, TOP_HALF, 'contain')} loop={p.loopTop} />
        ) : (
          <TopTitle box={TOP_HALF} kicker={p.kicker} title={p.title} color={color} t={t} />
        )}
        <MediaAt
          media={p.media}
          rect={bottom}
          style={{
            // Completo: borde de luz de 1 px y sombra en capas, con el fondo de marca alrededor.
            ...(contained
              ? {
                  borderRadius: 18,
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: `0 1px 2px rgba(0,0,0,0.5), 0 14px 40px rgba(0,0,0,0.45), 0 0 80px ${color}22`,
                }
              : {}),
            transform: `translateY(${lerp(60, 0, inBottom)}px)`,
            opacity: Math.min(1, inBottom * 2),
          }}
        />
      </AbsoluteFill>
    );
  }

  const bottomTop = TOP_H + p.bandHeight;
  const bottomBox: Rect = { x: 40, y: bottomTop, w: 1000, h: 1920 - bottomTop - 60 };
  const topBox: Rect = { x: 40, y: 80, w: 1000, h: TOP_H - 100 };
  const panel = (box: Rect, dy: number, e: number, children: React.ReactNode) => (
    <div
      style={{
        position: 'absolute',
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        ...cardStyle(36, color),
        transform: `translateY(${lerp(dy, 0, e)}px)`,
        opacity: Math.min(1, e * 2),
      }}
    >
      {children}
    </div>
  );
  const local = (m: MediaRef | null, box: Rect, loop = false) => (
    <MediaAt media={m} rect={mediaRect(m, { x: 0, y: 0, w: box.w, h: box.h }, p.fit)} loop={loop} />
  );

  return (
    <AbsoluteFill>
      {p.topMedia ? (
        panel(topBox, -300, inTop, local(p.topMedia, topBox, p.loopTop))
      ) : (
        <TopTitle box={topBox} kicker={p.kicker} title={p.title} color={color} t={t} />
      )}
      {p.showGuide && (
        <div
          style={{
            position: 'absolute',
            left: 60,
            right: 60,
            top: TOP_H + 16,
            height: p.bandHeight - 32,
            borderRadius: 24,
            border: `2px dashed ${aurora.muted}66`,
            display: 'grid',
            placeItems: 'center',
            color: aurora.muted,
            fontFamily: fonts.sans,
            fontSize: 34,
          }}
        >
          subtítulos aquí
        </div>
      )}
      {panel(bottomBox, 500, inBottom, local(p.media, bottomBox))}
    </AbsoluteFill>
  );
};

export const mitadYMitad: EffectDef<Props> = {
  id: 'mitad-y-mitad',
  name: 'Mitad y mitad',
  group: 'apoyo',
  description:
    'Dos tomas, cada una en su mitad de 1080×960: arriba tu animación con fondo transparente y abajo tu video completo con el fondo de marca alrededor.',
  usesMedia: true,
  mediaLabel: 'Toma de abajo (tu video 16:9)',
  // Es un formato de pantalla, no un hook: dura todo tu video.
  onVideo: 'full',
  defaultDurationSec: 5,
  defaults: {
    layout: 'mitades',
    kicker: 'build in public · día 12',
    title: 'Mi app ya *exporta* videos',
    color: 'mint',
    topMedia: null,
    loopTop: true,
    bandHeight: 260,
    showGuide: false,
    fit: 'contain',
  },
  params: [
    {
      key: 'layout',
      label: 'Diseño',
      type: 'select',
      options: [
        { value: 'mitades', label: 'Dos mitades' },
        { value: 'franja', label: 'Título + franja' },
      ],
    },
    { key: 'topMedia', label: 'Toma de arriba (animación transparente)', type: 'media' },
    { key: 'loopTop', label: 'Repetir la toma de arriba si es más corta', type: 'boolean' },
    { key: 'kicker', label: 'Texto pequeño (si no hay toma arriba)', type: 'text' },
    { key: 'title', label: 'Título (si no hay toma arriba; usa *asteriscos*)', type: 'text', multiline: true },
    { key: 'color', label: 'Color', type: 'color' },
    {
      key: 'fit',
      label: 'Tu video de abajo',
      type: 'select',
      options: [
        { value: 'contain', label: 'Completo' },
        { value: 'cover', label: 'Llenar su mitad' },
      ],
    },
    { key: 'bandHeight', label: 'Alto de la franja (solo "Título + franja")', type: 'number', min: 120, max: 420, step: 10 },
    { key: 'showGuide', label: 'Mostrar guía de la franja (no exportar así)', type: 'boolean' },
  ],
  component: MitadYMitad,
};
