import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { aurora, colorOf, fonts, type PaletteColor } from '../../brand.ts';
import { cardStyle } from '../../components/brand.tsx';
import { easeInOutCubic, easeOutBack, lerp, progress, timeOf } from '../../lib/anim.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';

type Props = {
  title: string;
  items: string;
  color: PaletteColor;
  revealStart: number;
  perItem: number;
};

/** N cartas con "?" que se voltean una por una y revelan su nombre (formato "5 herramientas"). */
const ListaMisterio: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const items = p.items.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 6);
  const color = colorOf(p.color);
  const cols = items.length > 3 ? 2 : 1;
  const cardW = cols === 2 ? 440 : 760;
  const cardH = items.length > 4 ? 300 : 340;
  const titleP = easeOutBack(progress(t, 0, 0.4), 1.4);

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 60 }}>
      {p.title && (
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 800,
            fontSize: 96,
            letterSpacing: -2,
            color: aurora.text,
            transform: `scale(${titleP})`,
            textAlign: 'center',
            maxWidth: 960,
          }}
        >
          {p.title}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cardW}px)`, gap: 36, perspective: 1600 }}>
        {items.map((name, i) => {
          const enter = easeOutBack(progress(t, 0.15 + i * 0.08, 0.4), 1.3);
          const flip = easeInOutCubic(progress(t, p.revealStart + i * p.perItem, 0.45));
          const angle = flip * 180;
          const showBack = angle > 90;
          return (
            <div
              key={i}
              style={{
                width: cardW,
                height: cardH,
                transform: `translateY(${lerp(80, 0, enter)}px) rotateY(${showBack ? angle - 180 : angle}deg)`,
                opacity: Math.min(1, enter * 2),
              }}
            >
              <div
                style={{
                  ...cardStyle(34, showBack ? color : undefined),
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 14,
                  border: showBack ? `1px solid ${color}88` : '1px dashed rgba(255,255,255,0.22)',
                  fontFamily: fonts.sans,
                }}
              >
                <span style={{ fontFamily: fonts.mono, fontSize: 34, color: showBack ? color : aurora.muted }}>#{i + 1}</span>
                {showBack ? (
                  <span style={{ fontSize: cols === 2 ? 58 : 72, fontWeight: 800, color: aurora.text, textAlign: 'center', padding: '0 24px', lineHeight: 1.05 }}>
                    {name}
                  </span>
                ) : (
                  <span style={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 150, color: aurora.text, lineHeight: 1 }}>?</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const listaMisterio: EffectDef<Props> = {
  id: 'lista-misterio',
  name: 'Lista misteriosa',
  group: 'apoyo',
  description: 'Cartas con "?" que se voltean una por una (formato "4 plugins que…"). Baena lo usa como gancho.',
  usesMedia: false,
  defaultDurationSec: 4,
  defaults: { title: '4 plugins para Claude Code', items: 'Context7\nPlaywright\nSupabase\nRemotion', color: 'mint', revealStart: 1.2, perItem: 0.55 },
  params: [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'items', label: 'Una carta por línea (máx. 6)', type: 'text', multiline: true },
    { key: 'color', label: 'Color', type: 'color' },
    { key: 'revealStart', label: 'Primera revelación (s)', type: 'number', min: 0.2, max: 5, step: 0.05 },
    { key: 'perItem', label: 'Tiempo entre cartas (s)', type: 'number', min: 0.15, max: 3, step: 0.05 },
  ],
  component: ListaMisterio,
};
