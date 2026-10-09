import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { aurora, colorOf, fonts, type PaletteColor } from '../../theme.ts';
import { MediaBackdrop } from '../../components/backdrop.tsx';
import { easeOutBack, easeOutCubic, lerp, progress, timeOf } from '../../lib/anim.ts';
import { parseList } from '../../lib/lists.ts';
import type { Fit } from '../../lib/layout.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';
import { dimParam, fitParam } from '../params.ts';

type Props = {
  title: string;
  items: string;
  color: PaletteColor;
  gapSec: number;
  countdown: boolean;
  dim: number;
  fit: Fit;
};

const MAX = 5;

/** "3 tools you need": a title and a numbered list that fills in one by one over your video. */
const TopList: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const items = parseList(p.items, MAX);
  const color = colorOf(p.color);
  const titleP = easeOutBack(progress(t, 0.05, 0.45), 1.3);
  const startOf = (i: number) => 0.45 + i * p.gapSec;
  // Which item just came in (it's highlighted until the next one).
  const current = items.reduce((c, _, i) => (t >= startOf(i) ? i : c), -1);

  return (
    <AbsoluteFill>
      <MediaBackdrop media={p.media} fit={p.fit} dim={p.dim * progress(t, 0, 0.3)} blur={p.dim * 6 * progress(t, 0, 0.3)} />
      <AbsoluteFill style={{ padding: '300px 80px 0', gap: 44, fontFamily: fonts.sans }}>
        <div
          style={{
            alignSelf: 'center',
            transform: `scale(${lerp(0.6, 1, titleP)})`,
            opacity: Math.min(1, titleP * 2),
            padding: '18px 40px',
            borderRadius: 24,
            background: color,
            color: '#0a0b0d',
            fontWeight: 900,
            fontSize: 76,
            letterSpacing: -1.5,
            textAlign: 'center',
            boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 60px ${color}55`,
          }}
        >
          {p.title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          {items.map((item, i) => {
            const k = progress(t, startOf(i), 0.4);
            if (k <= 0) return null;
            const e = easeOutCubic(k);
            const on = i === current;
            // With a countdown the numbers go 3, 2, 1 (the best one last).
            const n = p.countdown ? items.length - i : i + 1;
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 30,
                  padding: '22px 30px',
                  borderRadius: 30,
                  background: on ? 'rgba(26,29,34,0.94)' : 'rgba(19,21,25,0.82)',
                  border: `2px solid ${on ? color : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: on ? `0 18px 50px rgba(0,0,0,0.5), 0 0 40px ${color}33` : '0 10px 30px rgba(0,0,0,0.35)',
                  transform: `translateX(${lerp(-140, 0, e)}px) scale(${on ? lerp(0.96, 1.02, easeOutBack(k)) : 1})`,
                  opacity: Math.min(1, k * 3) * (on || current < 0 ? 1 : 0.72),
                }}
              >
                <div
                  style={{
                    width: 92,
                    height: 92,
                    flex: 'none',
                    borderRadius: 24,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 56,
                    fontWeight: 900,
                    color: on ? '#0a0b0d' : aurora.text,
                    background: on ? color : 'rgba(255,255,255,0.08)',
                  }}
                >
                  {n}
                </div>
                <div style={{ color: aurora.text, fontSize: 60, fontWeight: 750, lineHeight: 1.15, letterSpacing: -0.5 }}>{item}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const topList: EffectDef<Props> = {
  id: 'top-list',
  name: { en: 'Top list', es: 'Lista top' },
  group: 'support',
  description: {
    en: '"3 tools you need": a numbered list that fills in one by one over your video. Keeps people to the end.',
    es: '"3 herramientas que necesitas": una lista numerada que se llena una por una sobre tu video. Retiene hasta el final.',
  },
  usesMedia: true,
  defaultDurationSec: 4,
  thumbSec: 3.5,
  defaults: {
    title: '3 AI tools I use daily',
    items: 'Cursor: writes the boring code\nClaude: plans the whole feature\nRemotion: turns code into video',
    color: 'mint',
    gapSec: 0.9,
    countdown: false,
    dim: 0.55,
    fit: 'cover',
  },
  localized: {
    es: {
      title: '3 herramientas de IA que uso a diario',
      items: 'Cursor: escribe el código aburrido\nClaude: planea la función entera\nRemotion: convierte código en video',
    },
  },
  params: [
    { key: 'title', label: { en: 'Title', es: 'Título' }, type: 'text' },
    { key: 'items', label: { en: 'Items, one per line (up to 5)', es: 'Puntos, uno por línea (hasta 5)' }, type: 'text', multiline: true },
    { key: 'color', label: { en: 'Accent color', es: 'Color de acento' }, type: 'color' },
    { key: 'gapSec', label: { en: 'Time between items (s)', es: 'Tiempo entre puntos (s)' }, type: 'number', min: 0.2, max: 3, step: 0.05 },
    { key: 'countdown', label: { en: 'Count down (3, 2, 1)', es: 'Cuenta regresiva (3, 2, 1)' }, type: 'boolean' },
    dimParam,
    fitParam(),
  ],
  component: TopList,
};
