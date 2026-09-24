import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { aurora, colorOf, fonts, type PaletteColor } from '../../brand.ts';
import { MediaAt, mediaRect } from '../../components/brand.tsx';
import { easeOutBack, easeOutCubic, lerp, progress, timeOf } from '../../lib/anim.ts';
import { FRAME } from '../../lib/frame.ts';
import type { Fit } from '../../lib/layout.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';

type Props = {
  app: string;
  icon: string;
  items: string;
  color: PaletteColor;
  gapSec: number;
  fit: Fit;
};

/** Cada línea "Título | detalle" es una notificación. */
const parseItems = (raw: string) =>
  raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((l) => {
      const [title, ...rest] = l.split('|');
      return { title: title.trim(), body: rest.join('|').trim() };
    });

/** Notificaciones que bajan desde arriba sobre tu captura ("Deploy exitoso", "Nuevo pago"). */
const Notificacion: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const items = parseItems(p.items);
  const rect = mediaRect(p.media, FRAME, p.fit);
  const color = colorOf(p.color);
  const H = 190;

  return (
    <AbsoluteFill>
      <MediaAt media={p.media} rect={rect} style={{ borderRadius: p.fit === 'contain' ? 24 : 0 }} />
      {items.map((it, i) => {
        const start = 0.15 + i * p.gapSec;
        const e = easeOutBack(progress(t, start, 0.45), 1.1);
        // Las nuevas empujan a las anteriores hacia abajo, como en el celular.
        const newer = items.slice(i + 1).reduce((acc, _, j) => acc + easeOutCubic(progress(t, 0.15 + (i + 1 + j) * p.gapSec, 0.35)), 0);
        const y = lerp(-260, 150, e) + newer * (H + 22);
        if (t < start) return null;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 60,
              right: 60,
              top: y,
              height: H,
              display: 'flex',
              alignItems: 'center',
              gap: 28,
              padding: '0 34px',
              borderRadius: 44,
              background: 'rgba(26,29,34,0.82)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.16), 0 20px 60px rgba(0,0,0,0.55), 0 0 60px ${color}22`,
              opacity: Math.min(1, e * 2),
              fontFamily: fonts.sans,
            }}
          >
            <div
              style={{
                width: 104,
                height: 104,
                flex: 'none',
                borderRadius: 26,
                display: 'grid',
                placeItems: 'center',
                fontSize: 58,
                background: `linear-gradient(145deg, ${color}, ${color}88)`,
                boxShadow: `0 0 30px ${color}66`,
              }}
            >
              {p.icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: aurora.muted, fontSize: 30 }}>
                <span>{p.app}</span>
                <span>ahora</span>
              </div>
              <div style={{ color: aurora.text, fontSize: 44, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {it.title}
              </div>
              {it.body && (
                <div style={{ color: '#c4c9d0', fontSize: 34, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {it.body}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const notificacion: EffectDef<Props> = {
  id: 'notificacion',
  name: 'Notificación',
  group: 'hook',
  description: 'Notificaciones tipo celular que bajan sobre tu captura: deploy listo, nuevo pago, nuevo usuario.',
  usesMedia: true,
  defaultDurationSec: 2.5,
  defaults: {
    app: 'Director',
    icon: '✓',
    items: 'Deploy exitoso | producción en 38 s\nNuevo pago S/ 20 | primer cliente 🎉',
    color: 'mint',
    gapSec: 0.6,
    fit: 'contain',
  },
  params: [
    { key: 'items', label: 'Una por línea: Título | detalle', type: 'text', multiline: true },
    { key: 'app', label: 'Nombre de la app', type: 'text' },
    { key: 'icon', label: 'Ícono (emoji o letra)', type: 'text' },
    { key: 'color', label: 'Color del ícono', type: 'color' },
    { key: 'gapSec', label: 'Pausa entre notificaciones (s)', type: 'number', min: 0.2, max: 1.5, step: 0.05 },
    {
      key: 'fit',
      label: 'Encuadre',
      type: 'select',
      options: [
        { value: 'contain', label: 'Completa' },
        { value: 'cover', label: 'Llenar pantalla' },
      ],
    },
  ],
  component: Notificacion,
};
