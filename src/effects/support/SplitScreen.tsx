import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { aurora, colorOf, fonts, type PaletteColor } from '../../theme.ts';
import { cardStyle, MediaAt, mediaRect } from '../../components/media.tsx';
import { KineticText } from '../../components/text.tsx';
import { easeOutBack, easeOutCubic, lerp, progress, timeOf } from '../../lib/anim.ts';
import type { Fit, Rect } from '../../lib/layout.ts';
import type { BaseProps, EffectDef, MediaRef } from '../../lib/types.ts';

type Props = {
  layout: 'halves' | 'band';
  kicker: string;
  title: string;
  color: PaletteColor;
  topMedia: MediaRef | null;
  loopTop: boolean;
  bandHeight: number;
  showGuide: boolean;
  fit: Fit;
};

/** "Two halves" layout: each shot in its own 1080×960 half. */
const TOP_HALF: Rect = { x: 0, y: 0, w: 1080, h: 960 };
const BOTTOM_HALF: Rect = { x: 0, y: 960, w: 1080, h: 960 };
/** Margin so the background shows around your video when it is shown full. */
const MARGIN = 36;
const BOTTOM_INSET: Rect = { x: MARGIN, y: 960 + MARGIN, w: 1080 - 2 * MARGIN, h: 960 - 2 * MARGIN };
/** "Title + band" layout (the original): title on top, a band for captions and a card below. */
const TOP_H = 760;

/** Animated title shown on top when there is no shot for that half. */
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
 * Split screen.
 * - "halves": a shot on top (your animation with a transparent background, over the background) and your video
 *   below, centered and full, each in its own 1080×960 half.
 * - "band": a title on top, a free band for captions in the middle and your footage in a card below.
 */
const SplitScreen: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const color = colorOf(p.color);
  const inBottom = easeOutCubic(progress(t, 0.05, 0.5));
  const inTop = easeOutBack(progress(t, 0, 0.5), 1.1);

  if (p.layout === 'halves') {
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
            // Full: 1 px light edge and layered shadow, with the background around it.
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
          captions here
        </div>
      )}
      {panel(bottomBox, 500, inBottom, local(p.media, bottomBox))}
    </AbsoluteFill>
  );
};

export const splitScreen: EffectDef<Props> = {
  id: 'split-screen',
  name: { en: 'Split screen', es: 'Mitad y mitad' },
  group: 'support',
  description: {
    en: 'Two shots, each in its own 1080×960 half: your transparent-background animation on top and your full video below, with the background around it.',
    es: 'Dos tomas, cada una en su mitad de 1080×960: arriba tu animación con fondo transparente y abajo tu video completo con el fondo de marca alrededor.',
  },
  usesMedia: true,
  mediaLabel: { en: 'Bottom shot (your 16:9 video)', es: 'Toma de abajo (tu video 16:9)' },
  // A screen format, not a hook: it lasts your whole video.
  onVideo: 'full',
  defaultDurationSec: 5,
  defaults: {
    layout: 'halves',
    kicker: 'build in public · day 12',
    title: 'My app now *exports* videos',
    color: 'mint',
    topMedia: null,
    loopTop: true,
    bandHeight: 260,
    showGuide: false,
    fit: 'contain',
  },
  localized: { es: { kicker: 'build in public · día 12', title: 'Mi app ya *exporta* videos' } },
  params: [
    {
      key: 'layout',
      label: { en: 'Layout', es: 'Diseño' },
      type: 'select',
      options: [
        { value: 'halves', label: { en: 'Two halves', es: 'Dos mitades' } },
        { value: 'band', label: { en: 'Title + band', es: 'Título + franja' } },
      ],
    },
    { key: 'topMedia', label: { en: 'Top shot (transparent animation)', es: 'Toma de arriba (animación transparente)' }, type: 'media' },
    { key: 'loopTop', label: { en: 'Loop the top shot if it is shorter', es: 'Repetir la toma de arriba si es más corta' }, type: 'boolean' },
    { key: 'kicker', label: { en: 'Small text (if no top shot)', es: 'Texto pequeño (si no hay toma arriba)' }, type: 'text' },
    { key: 'title', label: { en: 'Title (if no top shot; use *asterisks*)', es: 'Título (si no hay toma arriba; usa *asteriscos*)' }, type: 'text', multiline: true },
    { key: 'color', label: 'Color', type: 'color' },
    {
      key: 'fit',
      label: { en: 'Your bottom video', es: 'Tu video de abajo' },
      type: 'select',
      options: [
        { value: 'contain', label: { en: 'Full', es: 'Completo' } },
        { value: 'cover', label: { en: 'Fill its half', es: 'Llenar su mitad' } },
      ],
    },
    { key: 'bandHeight', label: { en: 'Band height ("Title + band" only)', es: 'Alto de la franja (solo "Título + franja")' }, type: 'number', min: 120, max: 420, step: 10 },
    { key: 'showGuide', label: { en: 'Show band guide (do not export like this)', es: 'Mostrar guía de la franja (no exportar así)' }, type: 'boolean' },
  ],
  component: SplitScreen,
};
