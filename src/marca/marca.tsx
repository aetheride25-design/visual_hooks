// Imágenes fijas de marca (perfil y portada) en estilo Aurora. Se exportan en PNG con `pnpm marca`.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { aurora, fonts } from '../brand.ts';

/** Mancha de luz difuminada, en % del lienzo (así sirve para cualquier tamaño). */
const Glow: React.FC<{ color: string; x: number; y: number; w: number; h: number; alpha: number; blur: number; rotate?: number }> = ({
  color,
  x,
  y,
  w,
  h,
  alpha,
  blur,
  rotate = 0,
}) => (
  <div
    style={{
      position: 'absolute',
      left: `${x - w / 2}%`,
      top: `${y - h / 2}%`,
      width: `${w}%`,
      height: `${h}%`,
      borderRadius: '50%',
      background: `radial-gradient(closest-side, ${color}, transparent)`,
      opacity: alpha,
      filter: `blur(${blur}px)`,
      transform: `rotate(${rotate}deg)`,
    }}
  />
);

/* ---------- Foto de perfil 400×400 ---------- */

/** Aurora de perfil: menta fuerte al centro, toques azul y violeta a los costados. */
const ProfileAurora: React.FC = () => (
  <AbsoluteFill style={{ background: aurora.base, overflow: 'hidden' }}>
    <Glow color={aurora.violet} x={80} y={78} w={70} h={60} alpha={0.55} blur={30} />
    <Glow color={aurora.blue} x={18} y={30} w={60} h={55} alpha={0.5} blur={30} />
    <Glow color={aurora.mint} x={50} y={50} w={92} h={70} alpha={0.75} blur={24} rotate={-20} />
  </AbsoluteFill>
);

/** "c" de texto, gruesa (el trazo extra la engorda para que se lea en chico). */
const TextC: React.FC<{ fill: string; stroke: string; gradient?: boolean }> = ({ fill, stroke, gradient }) => (
  <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
    <span
      style={{
        fontFamily: fonts.sans,
        fontWeight: 700,
        fontSize: 340,
        lineHeight: 1,
        // La "c" minúscula queda baja dentro de su caja: la subo para centrarla a la vista.
        transform: 'translateY(-22px)',
        WebkitTextStroke: `16px ${stroke}`,
        paintOrder: 'stroke fill',
        ...(gradient
          ? {
              background: `linear-gradient(135deg, ${aurora.mint} 20%, ${aurora.blue} 60%, ${aurora.violet} 95%)`,
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }
          : { color: fill }),
        filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.55))',
      }}
    >
      c
    </span>
  </AbsoluteFill>
);

/** Opción A: "c" blanca sobre la aurora. La más legible. */
export const PerfilA: React.FC = () => (
  <AbsoluteFill>
    <ProfileAurora />
    <TextC fill={aurora.text} stroke={aurora.text} />
  </AbsoluteFill>
);

/** Opción B: "c" oscura con borde de degradé menta→azul→violeta, que "recorta" la aurora. */
export const PerfilB: React.FC = () => (
  <AbsoluteFill>
    <ProfileAurora />
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: 300,
          height: 300,
          borderRadius: 84,
          background: 'rgba(10,11,13,0.72)',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 20px 50px rgba(0,0,0,0.5)',
        }}
      />
    </AbsoluteFill>
    <TextC fill={aurora.mint} stroke="transparent" gradient />
  </AbsoluteFill>
);

/** Opción C: "c" geométrica, un arco grueso con puntas redondas y degradé de la paleta. */
export const PerfilC: React.FC = () => {
  const r = 108;
  const gap = 58; // grados de abertura a la derecha
  const a0 = ((gap / 2) * Math.PI) / 180;
  const start = { x: 200 + r * Math.cos(a0), y: 200 - r * Math.sin(a0) };
  const end = { x: 200 + r * Math.cos(a0), y: 200 + r * Math.sin(a0) };
  return (
    <AbsoluteFill>
      <ProfileAurora />
      <svg width={400} height={400} viewBox="0 0 400 400" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="c-arc" x1="80" y1="80" x2="320" y2="320" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={aurora.text} />
            <stop offset="0.55" stopColor={aurora.text} />
            <stop offset="1" stopColor="#d9fff2" />
          </linearGradient>
        </defs>
        <path
          d={`M${start.x} ${start.y} A${r} ${r} 0 1 0 ${end.x} ${end.y}`}
          fill="none"
          stroke="url(#c-arc)"
          strokeWidth={64}
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 8px 22px rgba(0,0,0,0.55))' }}
        />
      </svg>
    </AbsoluteFill>
  );
};

/* ---------- Portada de X 1500×500 ---------- */

export const PortadaX: React.FC<{ phrase: string; accent: string; name: string }> = ({ phrase, accent, name }) => (
  <AbsoluteFill style={{ background: aurora.base, overflow: 'hidden' }}>
    {/* Cortinas de aurora en diagonal, más intensas arriba y hacia el centro-derecha */}
    <Glow color={aurora.mint} x={34} y={18} w={70} h={70} alpha={0.55} blur={50} rotate={-12} />
    <Glow color={aurora.mint} x={58} y={40} w={48} h={34} alpha={0.35} blur={40} rotate={-18} />
    <Glow color={aurora.blue} x={74} y={20} w={40} h={60} alpha={0.4} blur={50} />
    <Glow color={aurora.violet} x={92} y={78} w={38} h={80} alpha={0.45} blur={50} />
    {/* Esquina inferior izquierda más oscura y limpia: ahí X pone la foto de perfil */}
    <div
      style={{
        position: 'absolute',
        left: 0,
        bottom: 0,
        width: 620,
        height: 330,
        background: `radial-gradient(ellipse at 0% 100%, ${aurora.base} 35%, transparent 75%)`,
      }}
    />
    {/* Línea de luz de 1 px arriba */}
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)' }} />
    <div
      style={{
        position: 'absolute',
        left: 560,
        right: 70,
        top: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 26,
      }}
    >
      <div
        style={{
          fontFamily: fonts.sans,
          fontWeight: 700,
          fontSize: 64,
          lineHeight: 1.08,
          letterSpacing: -1.5,
          color: aurora.text,
          textShadow: '0 6px 30px rgba(0,0,0,0.45)',
        }}
      >
        {phrase}{' '}
        <span style={{ fontFamily: fonts.serif, fontStyle: 'italic', fontWeight: 400, fontSize: 72, color: aurora.mint, textShadow: `0 0 36px ${aurora.mint}66` }}>
          {accent}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: fonts.mono, fontSize: 30, color: aurora.muted, letterSpacing: 2 }}>
        <span style={{ width: 14, height: 14, borderRadius: 7, background: aurora.mint, boxShadow: `0 0 14px ${aurora.mint}` }} />
        {name}
      </div>
    </div>
  </AbsoluteFill>
);
