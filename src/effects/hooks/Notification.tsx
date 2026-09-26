import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { aurora, colorOf, fonts, type PaletteColor } from '../../theme.ts';
import { MediaAt, mediaRect } from '../../components/media.tsx';
import { easeOutBack, easeOutCubic, lerp, progress, timeOf } from '../../lib/anim.ts';
import { FRAME } from '../../lib/frame.ts';
import type { Fit } from '../../lib/layout.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';

type Props = {
  app: string;
  icon: string;
  items: string;
  /** Timestamp shown next to the app name ("now"). */
  time: string;
  color: PaletteColor;
  gapSec: number;
  fit: Fit;
};

/** Each "Title | detail" line is one notification. */
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

/** Notifications that slide down from the top over your screenshot ("Deploy succeeded", "New payment"). */
const Notification: React.FC<Props & BaseProps> = (p) => {
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
        // Newer ones push the older ones down, like on a phone.
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
                <span>{p.time}</span>
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

export const notification: EffectDef<Props> = {
  id: 'notification',
  name: { en: 'Notification', es: 'Notificación' },
  group: 'hook',
  description: {
    en: 'Phone-style notifications sliding down over your screenshot: deploy done, new payment, new user.',
    es: 'Notificaciones tipo celular que bajan sobre tu captura: deploy listo, nuevo pago, nuevo usuario.',
  },
  usesMedia: true,
  defaultDurationSec: 2.5,
  defaults: {
    app: 'Your App',
    icon: '✓',
    items: 'Deploy succeeded | production in 38 s\nNew payment $20 | first customer 🎉',
    time: 'now',
    color: 'mint',
    gapSec: 0.6,
    fit: 'contain',
  },
  localized: {
    es: {
      items: 'Deploy exitoso | producción en 38 s\nNuevo pago $20 | primer cliente 🎉',
      app: 'Tu App',
      time: 'ahora',
    },
  },
  params: [
    { key: 'items', label: { en: 'One per line: Title | detail', es: 'Una por línea: Título | detalle' }, type: 'text', multiline: true },
    { key: 'app', label: { en: 'App name', es: 'Nombre de la app' }, type: 'text' },
    { key: 'time', label: { en: 'Time', es: 'Hora' }, type: 'text' },
    { key: 'icon', label: { en: 'Icon (emoji or letter)', es: 'Ícono (emoji o letra)' }, type: 'text' },
    { key: 'color', label: { en: 'Icon color', es: 'Color del ícono' }, type: 'color' },
    { key: 'gapSec', label: { en: 'Pause between notifications (s)', es: 'Pausa entre notificaciones (s)' }, type: 'number', min: 0.2, max: 1.5, step: 0.05 },
    {
      key: 'fit',
      label: { en: 'Framing', es: 'Encuadre' },
      type: 'select',
      options: [
        { value: 'contain', label: { en: 'Whole', es: 'Completa' } },
        { value: 'cover', label: { en: 'Fill screen', es: 'Llenar pantalla' } },
      ],
    },
  ],
  component: Notification,
};
