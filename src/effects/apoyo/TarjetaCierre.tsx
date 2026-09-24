import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { aurora, colorOf, fonts, type PaletteColor } from '../../brand.ts';
import { cardStyle } from '../../components/brand.tsx';
import { easeOutBack, easeOutCubic, lerp, progress, timeOf } from '../../lib/anim.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';

type Props = {
  kicker: string;
  next: string;
  handle: string;
  cta: string;
  color: PaletteColor;
};

/** Cierre: "Próximo: … →" y tu @usuario, todo editable. */
const TarjetaCierre: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const color = colorOf(p.color);
  const card = easeOutBack(progress(t, 0.05, 0.55), 1.2);
  const kickerP = easeOutCubic(progress(t, 0.25, 0.35));
  const nextP = easeOutCubic(progress(t, 0.35, 0.45));
  const handleP = easeOutBack(progress(t, 0.7, 0.45), 1.6);
  const ctaP = easeOutCubic(progress(t, 0.95, 0.4));
  // La flecha "empuja" hacia la derecha cada segundo para invitar a seguir.
  const nudge = Math.max(0, Math.sin((t - 1) * Math.PI * 2)) * 18 * (t > 1 ? 1 : 0);

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', gap: 70, flexDirection: 'column' }}>
      <div
        style={{
          ...cardStyle(44, color),
          width: 940,
          padding: '70px 70px 76px',
          transform: `translateY(${lerp(200, 0, card)}px) scale(${lerp(0.9, 1, card)})`,
          opacity: Math.min(1, card * 2),
        }}
      >
        <div style={{ fontFamily: fonts.mono, fontSize: 40, letterSpacing: 6, color, textTransform: 'uppercase', opacity: kickerP }}>
          {p.kicker}
        </div>
        <div
          style={{
            marginTop: 26,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 26,
            fontFamily: fonts.sans,
            fontWeight: 800,
            fontSize: 96,
            lineHeight: 1.05,
            letterSpacing: -2,
            color: aurora.text,
            opacity: nextP,
            transform: `translateY(${lerp(40, 0, nextP)}px)`,
          }}
        >
          <span style={{ flex: 1 }}>{p.next}</span>
          <span style={{ color, transform: `translateX(${nudge}px)`, textShadow: `0 0 40px ${color}` }}>→</span>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          padding: '22px 46px',
          borderRadius: 999,
          background: 'rgba(19,21,25,0.9)',
          border: `1px solid ${color}66`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 16px 40px rgba(0,0,0,0.5), 0 0 60px ${color}33`,
          transform: `scale(${handleP})`,
          fontFamily: fonts.sans,
          fontWeight: 700,
          fontSize: 58,
          color: aurora.text,
        }}
      >
        <span style={{ width: 22, height: 22, borderRadius: 11, background: color, boxShadow: `0 0 20px ${color}` }} />
        {p.handle}
      </div>
      {p.cta && (
        <div style={{ fontFamily: fonts.sans, fontSize: 44, color: aurora.muted, opacity: ctaP, marginTop: -30 }}>{p.cta}</div>
      )}
    </AbsoluteFill>
  );
};

export const tarjetaCierre: EffectDef<Props> = {
  id: 'tarjeta-cierre',
  name: 'Tarjeta de cierre',
  group: 'apoyo',
  description: '"Próximo: … →" más tu @usuario. Todo el texto es editable.',
  usesMedia: false,
  defaultDurationSec: 3,
  defaultAt: 'end',
  defaults: {
    kicker: 'Próximo',
    next: 'Le pongo subtítulos automáticos',
    handle: '@chito.dev',
    cta: 'sígueme para no perdértelo',
    color: 'mint',
  },
  params: [
    { key: 'kicker', label: 'Texto pequeño', type: 'text' },
    { key: 'next', label: 'Lo que viene', type: 'text', multiline: true },
    { key: 'handle', label: 'Tu usuario', type: 'text' },
    { key: 'cta', label: 'Llamado a la acción (vacío = nada)', type: 'text' },
    { key: 'color', label: 'Color', type: 'color' },
  ],
  component: TarjetaCierre,
};
