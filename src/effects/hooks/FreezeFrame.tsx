import React, { useContext } from 'react';
import { AbsoluteFill, Freeze, useCurrentFrame } from 'remotion';
import { colorOf, fonts, type PaletteColor } from '../../theme.ts';
import { MainVideoClock, MediaAt, mediaRect } from '../../components/media.tsx';
import { easeOutBack, easeOutCubic, lerp, progress, shake, timeOf } from '../../lib/anim.ts';
import { FRAME } from '../../lib/frame.ts';
import { pointIn, type Fit } from '../../lib/layout.ts';
import { handArrow, polylineLength, toPath } from '../../lib/sketch.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';
import { fitParam, focusParams } from '../params.ts';

type Props = {
  freezeSec: number;
  label: string;
  subtitle: string;
  focusX: number;
  focusY: number;
  color: PaletteColor;
  arrow: boolean;
  fit: Fit;
};

/**
 * "Yep, that's me": your video plays, then freezes on a frame with a flash, loses its color and gets a label
 * with an arrow pointing at you. The classic record-scratch opener.
 */
const FreezeFrame: React.FC<Props & BaseProps> = (p) => {
  const frame = useCurrentFrame();
  const t = timeOf(frame, p.fps, p.speed);
  const clock = useContext(MainVideoClock);
  // The video plays at its own speed: the freeze frame comes from real seconds, not animation time.
  const f0 = Math.max(0, Math.round((p.freezeSec / p.speed) * p.fps));
  const frozen = frame >= f0;
  // Inside "Apply to my video" your video keeps its own clock: pin it to the freeze frame too.
  const pinned = clock && frozen ? { src: clock.src, frame: clock.frame - frame + f0 } : clock;

  const rect = mediaRect(p.media, FRAME, p.fit);
  const focus = pointIn(rect, p.focusX, p.focusY);
  const k = progress(t, p.freezeSec, 0.5);
  const zoom = lerp(1, 1.07, easeOutCubic(k));
  const flash = frozen ? 0.85 * (1 - progress(t, p.freezeSec, 0.18)) : 0;
  const sh = shake(t - p.freezeSec, 16, 0.3, 5);
  const gray = frozen ? 0.75 * easeOutCubic(progress(t, p.freezeSec, 0.25)) : 0;
  const color = colorOf(p.color);

  const labelP = progress(t, p.freezeSec + 0.12, 0.35);
  const subP = progress(t, p.freezeSec + 0.4, 0.4);
  // The arrow goes from below the label down to the point you picked.
  const labelY = focus.y < 960 ? Math.min(1500, focus.y + 520) : Math.max(380, focus.y - 560);
  const from = { x: focus.x < 540 ? focus.x + 230 : focus.x - 230, y: labelY + (focus.y < 960 ? -70 : 120) };
  const arrow = handArrow(from, { x: focus.x + (from.x > focus.x ? 50 : -50), y: focus.y + (from.y > focus.y ? 70 : -70) }, 0.22);
  const arrowP = easeOutCubic(progress(t, p.freezeSec + 0.25, 0.35));
  const headP = progress(t, p.freezeSec + 0.55, 0.1);
  const stroke = (pts: { x: number; y: number }[], prog: number) => {
    const len = polylineLength(pts);
    return (
      <path
        d={toPath(pts)}
        fill="none"
        stroke="#fff"
        strokeWidth={11}
        strokeLinecap="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - prog)}
        style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.7))' }}
      />
    );
  };

  return (
    <AbsoluteFill style={{ transform: frozen ? `translate(${sh.x}px, ${sh.y}px)` : undefined }}>
      <AbsoluteFill
        style={{
          transformOrigin: `${focus.x}px ${focus.y}px`,
          transform: `scale(${zoom})`,
          filter: gray ? `grayscale(${gray}) contrast(${1 + gray * 0.25}) brightness(${1 - gray * 0.15})` : undefined,
        }}
      >
        <MainVideoClock.Provider value={pinned}>
          <Freeze frame={f0} active={frozen}>
            <MediaAt media={p.media} rect={rect} style={{ borderRadius: p.fit === 'contain' ? 24 : 0 }} />
          </Freeze>
        </MainVideoClock.Provider>
      </AbsoluteFill>
      {/* Film-like vignette once it's frozen */}
      {frozen && (
        <AbsoluteFill style={{ background: 'radial-gradient(75% 60% at 50% 50%, transparent 55%, rgba(0,0,0,0.6))', opacity: k }} />
      )}
      {flash > 0 && <AbsoluteFill style={{ background: '#fff', opacity: flash }} />}
      {p.arrow && arrowP > 0 && (
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {stroke(arrow.shaft, arrowP)}
          {headP > 0 && arrow.head.map((w, i) => <React.Fragment key={i}>{stroke(w, headP)}</React.Fragment>)}
        </svg>
      )}
      {labelP > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: labelY,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
            transform: 'translateY(-50%)',
            fontFamily: fonts.sans,
          }}
        >
          {p.label && (
            <div
              style={{
                transform: `scale(${lerp(1.9, 1, easeOutBack(labelP, 1.6))}) rotate(-3deg)`,
                opacity: Math.min(1, labelP * 4),
                padding: '16px 40px',
                background: color,
                color: '#0a0b0d',
                fontWeight: 900,
                fontSize: 92,
                letterSpacing: -1,
                borderRadius: 14,
                boxShadow: `0 18px 50px rgba(0,0,0,0.6), 0 0 60px ${color}55`,
              }}
            >
              {p.label}
            </div>
          )}
          {p.subtitle && subP > 0 && (
            <div
              style={{
                maxWidth: 900,
                textAlign: 'center',
                color: '#fff',
                fontSize: 50,
                fontWeight: 700,
                lineHeight: 1.2,
                textShadow: '0 4px 20px rgba(0,0,0,0.9)',
                opacity: subP,
                transform: `translateY(${lerp(20, 0, easeOutCubic(subP))}px)`,
              }}
            >
              {p.subtitle}
            </div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const freezeFrame: EffectDef<Props> = {
  id: 'freeze-frame',
  name: { en: 'Freeze frame', es: 'Cuadro congelado' },
  group: 'hook',
  description: {
    en: '"Yep, that\'s me." Your video freezes with a flash, goes gray and an arrow points at you. Story opener.',
    es: '"Sí, ese soy yo." Tu video se congela con un destello, pierde el color y una flecha te señala. Para abrir una historia.',
  },
  usesMedia: true,
  defaultDurationSec: 3,
  thumbSec: 2.2,
  defaults: {
    freezeSec: 0.6,
    label: "Yep, that's me.",
    subtitle: "You're probably wondering how I got here",
    focusX: 0.5,
    focusY: 0.38,
    color: 'mint',
    arrow: true,
    fit: 'cover',
  },
  localized: { es: { label: 'Sí, ese soy yo.', subtitle: 'Seguro te preguntas cómo llegué aquí' } },
  params: [
    { key: 'label', label: { en: 'Label', es: 'Rótulo' }, type: 'text' },
    { key: 'subtitle', label: { en: 'Line below (empty = none)', es: 'Frase debajo (vacía = ninguna)' }, type: 'text' },
    { key: 'color', label: { en: 'Label color', es: 'Color del rótulo' }, type: 'color' },
    { key: 'freezeSec', label: { en: 'Freezes at (s)', es: 'Se congela en (s)' }, type: 'number', min: 0, max: 3, step: 0.05 },
    { key: 'arrow', label: { en: 'Arrow pointing at you', es: 'Flecha que te señala' }, type: 'boolean' },
    ...focusParams({ en: 'Arrow points at', es: 'La flecha señala' }),
    fitParam(),
  ],
  component: FreezeFrame,
};
