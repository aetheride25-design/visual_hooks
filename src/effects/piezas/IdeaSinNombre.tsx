import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { aurora, fonts } from '../../brand.ts';
import { easeInOutCubic, easeOutBack, easeOutCubic, progress, timeOf } from '../../lib/anim.ts';
import { cloudPath, hash01, spark } from '../../lib/particles.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';

type Props = {
  shape: 'bombilla' | 'nube';
  label: string;
  caption: string;
  sparks: number;
  rays: boolean;
  /** Cuánto baja todo el dibujo, para que no lo tapen las pestañas de TikTok de arriba. */
  offsetY: number;
  /** Lienzo vertical completo, o solo la mitad de arriba (1080×960) con el dibujo centrado. */
  canvas: 'vertical' | 'mitad';
};

/** La pieza vive en la franja de arriba; la de abajo queda libre para tu grabación. */
const AREA_H = 800;
/** Lienzo "mitad": la mitad de arriba del vertical. */
const HALF = { width: 1080, height: 960 };
// Centro vertical del dibujo: del rayo de arriba (y=55) al borde inferior del "???" (y≈732).
const DRAW_CENTER_Y = 394;
const HALF_SCALE = 1.15;
const COLORS = [aurora.mint, aurora.blue, aurora.violet];

// Bombilla de líneas finas: vidrio (círculo r=175 en 540,300) + cuello + rosca.
const BULB = {
  glass: 'M470 520 C462 490 448 465 439.6 443.4 A175 175 0 1 1 640.4 443.4 C632 465 618 490 610 520',
  base: ['M470 537 L610 537', 'M478 560 L602 560', 'M490 583 L590 583', 'M508 602 Q540 624 572 602'],
  center: { x: 540, y: 300 },
  sparkArea: { sx: 140, sy: 140 },
  rayRadius: [215, 245],
  labelTop: 634,
};
const CLOUD = {
  glass: cloudPath(560, 290, 250, 150, 9),
  bubbles: [
    { x: 400, y: 505, r: 26 },
    { x: 348, y: 566, r: 16 },
    { x: 315, y: 610, r: 9 },
  ],
  center: { x: 560, y: 290 },
  sparkArea: { sx: 215, sy: 120 },
  rayRadius: [0, 0],
  labelTop: 640,
};

/** Una idea que todavía no tiene nombre: contorno fino, destellos que no forman nada y "???" que parpadea. */
const IdeaSinNombre: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const bulb = p.shape === 'bombilla';
  const g = bulb ? BULB : CLOUD;
  const draw = easeInOutCubic(progress(t, 0.05, 0.7));
  const sparksIn = easeOutCubic(progress(t, 0.35, 0.6));
  const labelIn = easeOutBack(progress(t, 0.75, 0.4), 1.5);
  const float = Math.sin(t * 1.5) * 5;

  const pts = Array.from({ length: p.sparks }, (_, i) => {
    const s = spark(i, t, 0, 0, 1);
    return { ...s, x: g.center.x + s.x * g.sparkArea.sx, y: g.center.y + s.y * g.sparkArea.sy };
  });
  // Líneas que casi conectan destellos cercanos y se deshacen: algo que aún no toma forma.
  const links: { a: (typeof pts)[number]; b: (typeof pts)[number]; o: number }[] = [];
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d < 95) links.push({ a: pts[i], b: pts[j], o: (1 - d / 95) * 0.45 * Math.min(pts[i].alpha, pts[j].alpha) });
    }
  }

  const stroke = (d: string, key: string | number, width = 3.5) => (
    <path
      key={key}
      d={d}
      fill="none"
      stroke="url(#idea-line)"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={`${draw} 2`}
    />
  );

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1080,
          height: AREA_H,
          transformOrigin: '0 0',
          // En "mitad", el dibujo va centrado en 1080×960 y un 15 % más grande.
          transform:
            p.canvas === 'mitad'
              ? `translate(${540 - 540 * HALF_SCALE}px, ${HALF.height / 2 - DRAW_CENTER_Y * HALF_SCALE + float}px) scale(${HALF_SCALE})`
              : `translateY(${p.offsetY + float}px)`,
        }}
      >
        <svg width={1080} height={AREA_H} viewBox={`0 0 1080 ${AREA_H}`} style={{ overflow: 'visible' }}>
          <defs>
            {/* En coordenadas de la escena: con las del objeto, las líneas horizontales (alto 0) quedarían invisibles. */}
            <linearGradient id="idea-line" gradientUnits="userSpaceOnUse" x1="300" y1="120" x2="800" y2="640">
              <stop offset="0%" stopColor={aurora.mint} />
              <stop offset="50%" stopColor={aurora.text} />
              <stop offset="100%" stopColor={aurora.violet} />
            </linearGradient>
            <radialGradient id="idea-glow">
              <stop offset="0%" stopColor={aurora.blue} stopOpacity={0.28} />
              <stop offset="60%" stopColor={aurora.violet} stopOpacity={0.08} />
              <stop offset="100%" stopColor={aurora.violet} stopOpacity={0} />
            </radialGradient>
            <filter id="idea-soft" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>

          {/* Halo tenue detrás */}
          <ellipse cx={g.center.x} cy={g.center.y} rx={g.sparkArea.sx * 1.9} ry={g.sparkArea.sy * 1.9} fill="url(#idea-glow)" opacity={sparksIn} />

          {/* Contorno: una copia borrosa hace de "línea de luz" y otra nítida encima */}
          <g filter="url(#idea-soft)" opacity={0.55}>
            {stroke(g.glass, 'glow', 7)}
          </g>
          {stroke(g.glass, 'glass')}
          {bulb && BULB.base.map((d, i) => stroke(d, `base${i}`, 3))}
          {!bulb &&
            CLOUD.bubbles.map((c, i) => (
              <circle
                key={i}
                cx={c.x}
                cy={c.y}
                r={c.r}
                fill="none"
                stroke="url(#idea-line)"
                strokeWidth={3}
                opacity={progress(t, 0.5 + i * 0.12, 0.2)}
              />
            ))}

          {/* Rayitos que titilan alrededor: la idea "casi" se enciende, pero no */}
          {bulb &&
            p.rays &&
            Array.from({ length: 9 }, (_, k) => {
              const ang = -Math.PI * 0.95 + (k / 8) * Math.PI * 0.9;
              const on = hash01(k * 17 + Math.floor(t * 7)) > 0.55;
              const [r0, r1] = g.rayRadius;
              return (
                <line
                  key={k}
                  x1={g.center.x + Math.cos(ang) * r0}
                  y1={g.center.y + Math.sin(ang) * r0}
                  x2={g.center.x + Math.cos(ang) * r1}
                  y2={g.center.y + Math.sin(ang) * r1}
                  stroke={COLORS[k % 3]}
                  strokeWidth={3}
                  strokeLinecap="round"
                  opacity={on ? 0.8 * sparksIn : 0.08 * sparksIn}
                />
              );
            })}

          {/* Conexiones que aparecen y se deshacen */}
          {links.map((l, i) => (
            <line
              key={i}
              x1={l.a.x}
              y1={l.a.y}
              x2={l.b.x}
              y2={l.b.y}
              stroke={COLORS[l.a.color]}
              strokeWidth={1.5}
              opacity={l.o * sparksIn}
            />
          ))}

          {/* Destellos */}
          {pts.map((s, i) => {
            const c = COLORS[s.color];
            const star = i % 4 === 0;
            return (
              <g key={i} transform={`translate(${s.x} ${s.y})`} opacity={s.alpha * sparksIn}>
                <circle r={s.size * 1.8} fill={c} opacity={0.18} />
                {star ? (
                  <path
                    d={`M0 ${-s.size * 1.4} L${s.size * 0.3} 0 L0 ${s.size * 1.4} L${-s.size * 0.3} 0 Z M${-s.size * 1.4} 0 L0 ${s.size * 0.3} L${s.size * 1.4} 0 L0 ${-s.size * 0.3} Z`}
                    fill={c}
                    transform={`rotate(${t * 60 + i * 20})`}
                  />
                ) : (
                  <circle r={s.size * 0.45} fill={c} />
                )}
              </g>
            );
          })}
        </svg>

        {/* Etiqueta "???" que parpadea, con borde de luz de 1 px */}
        {p.label && labelIn > 0 && (
          <div
            style={{
              position: 'absolute',
              top: g.labelTop,
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              transform: `scale(${labelIn})`,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 10,
                padding: '10px 34px',
                borderRadius: 999,
                background: 'rgba(19,21,25,0.88)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.16), 0 12px 32px rgba(0,0,0,0.45), 0 0 50px ${aurora.violet}33`,
                fontFamily: fonts.mono,
                fontSize: 52,
                fontWeight: 700,
                color: aurora.text,
                letterSpacing: 6,
              }}
            >
              {Array.from(p.label).map((ch, k) => {
                // Parpadeo tipo cursor, desfasado letra por letra.
                const on = (((t * 2.2 - k * 0.22) % 1) + 1) % 1 < 0.6;
                return (
                  <span key={k} style={{ opacity: on ? 1 : 0.25, color: ch === '?' ? COLORS[k % 3] : aurora.text }}>
                    {ch}
                  </span>
                );
              })}
            </div>
            {p.caption && (
              <div style={{ fontFamily: fonts.mono, fontSize: 30, letterSpacing: 4, color: aurora.muted }}>{p.caption}</div>
            )}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export const ideaSinNombre: EffectDef<Props> = {
  id: 'idea-sin-nombre',
  name: 'Una idea sin nombre',
  group: 'pieza',
  description: 'Bombilla o nube de líneas finas con destellos que no forman nada y "???" que parpadea. Ocupa los 800 px de arriba.',
  usesMedia: false,
  defaultDurationSec: 3,
  defaults: { shape: 'bombilla', label: '???', caption: '', sparks: 16, rays: true, offsetY: 80, canvas: 'vertical' },
  params: [
    {
      key: 'shape',
      label: 'Forma',
      type: 'select',
      options: [
        { value: 'bombilla', label: 'Bombilla' },
        { value: 'nube', label: 'Nube de pensamiento' },
      ],
    },
    { key: 'label', label: 'Etiqueta', type: 'text' },
    { key: 'caption', label: 'Texto pequeño debajo (vacío = nada)', type: 'text' },
    { key: 'sparks', label: 'Destellos', type: 'number', min: 4, max: 30, step: 1 },
    { key: 'rays', label: 'Rayitos que titilan (bombilla)', type: 'boolean' },
    {
      key: 'canvas',
      label: 'Lienzo',
      type: 'select',
      options: [
        { value: 'vertical', label: '1080×1920 (arriba)' },
        { value: 'mitad', label: '1080×960 (centrada)' },
      ],
    },
    { key: 'offsetY', label: 'Bajar el dibujo (px, solo 1080×1920)', type: 'number', min: 0, max: 200, step: 5 },
  ],
  component: IdeaSinNombre,
  canvas: (p) => (p.canvas === 'mitad' ? HALF : { width: 1080, height: 1920 }),
};
