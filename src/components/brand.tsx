import React from 'react';
import { AbsoluteFill, Img } from 'remotion';
import { Video } from '@remotion/media';
import { aurora, fonts } from '../brand.ts';
import { fitRect, type Fit, type Rect } from '../lib/layout.ts';
import type { MediaRef } from '../lib/types.ts';

/** Fondo base con luz difuminada menta / azul / violeta que respira despacio. */
export const AuroraBackground: React.FC<{ t: number }> = ({ t }) => {
  const drift = (phase: number, amp: number) => Math.sin(t * 0.6 + phase) * amp;
  const blob = (color: string, x: number, y: number, size: number, alpha: string): React.CSSProperties => ({
    position: 'absolute',
    left: x - size / 2,
    top: y - size / 2,
    width: size,
    height: size,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${color}${alpha} 0%, ${color}00 68%)`,
    filter: 'blur(40px)',
  });
  return (
    <AbsoluteFill style={{ background: aurora.base, overflow: 'hidden' }}>
      <div style={blob(aurora.mint, 180 + drift(0, 60), 380 + drift(1, 40), 1100, '40')} />
      <div style={blob(aurora.blue, 960 + drift(2, 50), 900 + drift(3, 70), 1200, '33')} />
      <div style={blob(aurora.violet, 300 + drift(4, 70), 1650 + drift(5, 50), 1150, '38')} />
    </AbsoluteFill>
  );
};

/** Tarjeta Aurora: superficie, borde con línea de luz de 1 px y sombras en capas. */
export const cardStyle = (radius = 36, glow?: string): React.CSSProperties => ({
  background: aurora.surface,
  borderRadius: radius,
  border: '1px solid rgba(255,255,255,0.09)',
  boxShadow: [
    'inset 0 1px 0 rgba(255,255,255,0.14)',
    '0 1px 2px rgba(0,0,0,0.5)',
    '0 12px 32px rgba(0,0,0,0.45)',
    '0 40px 120px rgba(0,0,0,0.55)',
    glow ? `0 0 90px ${glow}40` : '',
  ]
    .filter(Boolean)
    .join(', '),
  overflow: 'hidden',
});

/** Etiqueta tipo píldora (p. ej. encima de la ventana flotante). */
export const Pill: React.FC<{ text: string; color: string; style?: React.CSSProperties }> = ({ text, color, style }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 16,
      padding: '14px 30px',
      borderRadius: 999,
      background: 'rgba(19,21,25,0.86)',
      border: `1px solid ${color}55`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 10px 30px rgba(0,0,0,0.45), 0 0 40px ${color}30`,
      color: aurora.text,
      fontFamily: fonts.sans,
      fontWeight: 650,
      fontSize: 40,
      letterSpacing: 0.5,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    <span style={{ width: 16, height: 16, borderRadius: 8, background: color, boxShadow: `0 0 16px ${color}` }} />
    {text}
  </div>
);

/** Pantalla falsa de editor (1920×1080) que se muestra mientras no subas tu video o imagen. */
const Placeholder: React.FC = () => {
  const rows = [
    [aurora.violet, 0.22, aurora.text, 0.38],
    [aurora.blue, 0.3, aurora.muted, 0.2],
    [aurora.mint, 0.18, aurora.text, 0.46],
    [aurora.muted, 0.52],
    [aurora.violet, 0.14, aurora.blue, 0.26, aurora.text, 0.2],
    [aurora.mint, 0.34, aurora.muted, 0.3],
    [aurora.text, 0.24, aurora.violet, 0.2],
    [aurora.blue, 0.4],
    [aurora.muted, 0.28, aurora.mint, 0.3],
  ] as (string | number)[][];
  return (
    <AbsoluteFill style={{ background: '#0f1114', padding: '90px 120px', gap: 40, fontFamily: fonts.mono }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', gap: 26, alignItems: 'center', paddingLeft: (i % 3) * 80 }}>
          <span style={{ color: '#3a3f47', fontSize: 40, width: 60 }}>{i + 1}</span>
          {Array.from({ length: row.length / 2 }, (_, j) => (
            <div
              key={j}
              style={{
                height: 40,
                width: `${(row[j * 2 + 1] as number) * 70}%`,
                borderRadius: 8,
                background: row[j * 2] as string,
                opacity: 0.75,
              }}
            />
          ))}
        </div>
      ))}
    </AbsoluteFill>
  );
};

export const PLACEHOLDER_SIZE = { width: 1920, height: 1080 };

/** Tamaño real del medio (o del marcador de posición si aún no subiste nada). */
export const sizeOf = (media: MediaRef | null) => (media ? { width: media.width, height: media.height } : PLACEHOLDER_SIZE);

/** Dónde queda tu captura dentro de `box` (en px del cuadro 1080×1920). */
export const mediaRect = (media: MediaRef | null, box: Rect, fit: Fit): Rect => {
  const s = sizeOf(media);
  return fitRect(s.width, s.height, box, fit);
};

/**
 * Tu video (silenciado, exacto al cuadro en el render) o tu imagen, del tamaño de su contenedor.
 * `width` es el ancho en px al que se dibuja: el marcador de posición lo usa para escalarse.
 */
export const Media: React.FC<{ media: MediaRef | null; width: number; loop?: boolean }> = ({ media, width, loop = false }) => {
  if (!media) {
    return (
      <div
        style={{
          position: 'absolute',
          width: PLACEHOLDER_SIZE.width,
          height: PLACEHOLDER_SIZE.height,
          transformOrigin: '0 0',
          transform: `scale(${width / PLACEHOLDER_SIZE.width})`,
        }}
      >
        <Placeholder />
      </div>
    );
  }
  const style: React.CSSProperties = { width: '100%', height: '100%', display: 'block' };
  return media.kind === 'video' ? (
    <Video src={media.src} muted loop={loop} objectFit="fill" style={style} />
  ) : (
    <Img src={media.src} style={{ ...style, objectFit: 'fill' }} />
  );
};

/** Medio ubicado en su rectángulo, en coordenadas del cuadro. */
export const MediaAt: React.FC<{ media: MediaRef | null; rect: Rect; style?: React.CSSProperties; loop?: boolean }> = ({
  media,
  rect,
  style,
  loop,
}) => (
  <div style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, overflow: 'hidden', ...style }}>
    <Media media={media} width={rect.w} loop={loop} />
  </div>
);
