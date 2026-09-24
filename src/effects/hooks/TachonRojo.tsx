import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { aurora, colorOf, fonts, type PaletteColor } from '../../brand.ts';
import { MediaBackdrop } from '../../components/backdrop.tsx';
import { easeOutBack, easeOutCubic, lerp, progress, shake, timeOf } from '../../lib/anim.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';

type Props = {
  kicker: string;
  oldText: string;
  newKicker: string;
  newText: string;
  color: PaletteColor;
  strikeSec: number;
  size: number;
  showMedia: boolean;
  dim: number;
};

/** Trazo a mano, levemente subido, que cruza el texto viejo de lado a lado. */
const STRIKE = 'M -4 62 C 20 55, 45 52, 70 46 S 98 38, 104 36';

/** Lo viejo aparece, una línea roja lo tacha y lo nuevo cae debajo con fuerza ("3 horas" → "10 min"). */
const TachonRojo: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const color = colorOf(p.color);
  const oldIn = easeOutBack(progress(t, 0.05, 0.3), 1.4);
  const strike = easeOutCubic(progress(t, p.strikeSec, 0.22));
  const after = progress(t, p.strikeSec + 0.3, 0.35);
  const newIn = progress(t, p.strikeSec + 0.35, 0.3);
  const sh = shake(t - (p.strikeSec + 0.55), 22, 0.35, 11);
  const small = p.size * 0.3;

  return (
    <AbsoluteFill>
      {p.showMedia && <MediaBackdrop media={p.media} fit="cover" dim={p.dim} blur={8} />}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 30,
          fontFamily: fonts.sans,
          transform: `translate(${sh.x}px, ${sh.y}px)`,
        }}
      >
        {p.kicker && (
          <div style={{ fontFamily: fonts.mono, fontSize: small, color: aurora.muted, letterSpacing: 4, opacity: Math.min(1, oldIn) }}>
            {p.kicker}
          </div>
        )}
        {/* Lo viejo: se achica y se apaga después del tachón. */}
        <div
          style={{
            position: 'relative',
            display: 'inline-block',
            fontSize: lerp(p.size, p.size * 0.72, easeOutCubic(after)),
            fontWeight: 800,
            letterSpacing: -p.size * 0.03,
            lineHeight: 1.05,
            color: aurora.text,
            opacity: lerp(1, 0.5, after) * Math.min(1, oldIn * 2),
            transform: `scale(${lerp(0.6, 1, oldIn)})`,
            textAlign: 'center',
            maxWidth: 960,
          }}
        >
          {p.oldText}
          {strike > 0 && (
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                left: '-4%',
                top: 0,
                width: '108%',
                height: '100%',
                overflow: 'visible',
                // La línea completa se destapa de izquierda a derecha, como un plumón.
                // (Con dasharray + non-scaling-stroke Chrome la partía en pedazos.)
                clipPath: `inset(-50% ${(1 - strike) * 100}% -50% -10%)`,
              }}
            >
              <path
                d={STRIKE}
                fill="none"
                stroke={aurora.red}
                strokeWidth={p.size * 0.12}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                style={{ filter: `drop-shadow(0 0 14px ${aurora.red}aa)` }}
              />
            </svg>
          )}
        </div>
        {/* Lo nuevo: cae con golpe y brillo. */}
        {newIn > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              marginTop: 20,
              opacity: Math.min(1, newIn * 3),
              transform: `scale(${lerp(2.2, 1, easeOutBack(newIn, 1.4))})`,
            }}
          >
            {p.newKicker && <div style={{ fontFamily: fonts.mono, fontSize: small, color, letterSpacing: 4 }}>{p.newKicker}</div>}
            <div
              style={{
                fontSize: p.size * 1.1,
                fontWeight: 850,
                letterSpacing: -p.size * 0.035,
                lineHeight: 1.05,
                color,
                textShadow: `0 0 ${p.size * 0.5}px ${color}77, 0 10px 40px rgba(0,0,0,0.5)`,
                textAlign: 'center',
                maxWidth: 1000,
              }}
            >
              {p.newText}
            </div>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const tachonRojo: EffectDef<Props> = {
  id: 'tachon-rojo',
  name: 'Tachón rojo',
  group: 'hook',
  description: 'Lo viejo aparece, una línea roja lo tacha y lo nuevo cae debajo con fuerza: "3 horas" → "10 min".',
  usesMedia: true,
  defaultDurationSec: 2.2,
  defaults: {
    kicker: 'antes me tomaba',
    oldText: '3 horas',
    newKicker: 'ahora',
    newText: '10 min',
    color: 'mint',
    strikeSec: 0.45,
    size: 170,
    showMedia: false,
    dim: 0.75,
  },
  params: [
    { key: 'kicker', label: 'Texto pequeño de arriba', type: 'text' },
    { key: 'oldText', label: 'Lo viejo (se tacha)', type: 'text' },
    { key: 'newKicker', label: 'Texto pequeño de lo nuevo', type: 'text' },
    { key: 'newText', label: 'Lo nuevo', type: 'text' },
    { key: 'color', label: 'Color de lo nuevo', type: 'color' },
    { key: 'strikeSec', label: 'Momento del tachón (s)', type: 'number', min: 0.2, max: 2, step: 0.05 },
    { key: 'size', label: 'Tamaño', type: 'number', min: 80, max: 260, step: 5 },
    { key: 'showMedia', label: 'Tu captura detrás', type: 'boolean' },
    { key: 'dim', label: 'Oscurecer captura', type: 'number', min: 0, max: 1, step: 0.02 },
  ],
  component: TachonRojo,
};
