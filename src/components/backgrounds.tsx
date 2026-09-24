import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { fonts } from '../brand.ts';
import { bgPalette, grainSeed, type BgPalette, type BgProps } from '../lib/background.ts';

type BgFC = React.FC<{ t: number; pal: BgPalette }>;

/** Luz difuminada que respira despacio (el fondo Aurora de siempre, ahora con cualquier color). */
const Aurora: BgFC = ({ t, pal }) => {
  const [a, b, c] = pal.colors;
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
    <>
      <div style={blob(a, 180 + drift(0, 60), 380 + drift(1, 40), 1100, '40')} />
      <div style={blob(b, 960 + drift(2, 50), 900 + drift(3, 70), 1200, '33')} />
      <div style={blob(c, 300 + drift(4, 70), 1650 + drift(5, 50), 1150, '38')} />
    </>
  );
};

/** Malla de puntos finos; un foco de luz la recorre y enciende los puntos que toca. */
const Puntos: BgFC = ({ t, pal }) => {
  const { width, height } = useVideoConfig();
  const [a, b] = pal.colors;
  const dots = (color: string, r: number): React.CSSProperties => ({
    backgroundImage: `radial-gradient(circle, ${color} ${r}px, transparent ${r + 0.8}px)`,
    backgroundSize: '44px 44px',
    backgroundPosition: '22px 22px',
  });
  // El foco dibuja un ocho lento por el cuadro.
  const fx = width * (0.5 + 0.34 * Math.sin(t * 0.7));
  const fy = height * (0.5 + 0.3 * Math.sin(t * 1.4 + 1));
  const spot = `radial-gradient(circle 680px at ${fx}px ${fy}px, #000 0%, transparent 100%)`;
  return (
    <>
      <AbsoluteFill style={{ ...dots('#ffffff', 1.8), opacity: 0.14 }} />
      <AbsoluteFill style={{ background: `radial-gradient(circle 700px at ${fx}px ${fy}px, ${b}22, transparent 70%)` }} />
      <AbsoluteFill style={{ ...dots(a, 2.6), maskImage: spot, WebkitMaskImage: spot }} />
    </>
  );
};

/** Degradado cónico enorme que gira despacio, difuminado y con viñeta. */
const Gradiente: BgFC = ({ t, pal }) => {
  const [a, b, c] = pal.colors;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: '-40%',
          background: `conic-gradient(from ${t * 24}deg at 50% 50%, ${a}, ${b}, ${c}, ${a})`,
          filter: 'blur(120px)',
          opacity: 0.55,
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, transparent 20%, ${pal.base}d0 85%)` }} />
    </>
  );
};

/** Piso de rejilla en perspectiva que avanza hacia el horizonte, con un sol de luz detrás. */
const Rejilla: BgFC = ({ t, pal }) => {
  const [a, b, c] = pal.colors;
  const cell = 120;
  // En la rejilla, arriba es lo lejano: se desvanece hacia el horizonte.
  const fade = 'linear-gradient(to bottom, transparent 0%, #000 55%)';
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '44%',
          width: 900,
          height: 900,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${c}66 0%, ${b}22 45%, transparent 70%)`,
          filter: 'blur(30px)',
        }}
      />
      <div style={{ position: 'absolute', left: 0, right: 0, top: '52%', height: 2, background: a, boxShadow: `0 0 40px 6px ${a}88`, opacity: 0.8 }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: '52%', bottom: 0, perspective: 480, perspectiveOrigin: '50% 0%', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            left: '-100%',
            right: '-100%',
            bottom: 0,
            height: '300%',
            transformOrigin: 'bottom center',
            transform: 'rotateX(76deg)',
            backgroundImage: `linear-gradient(${a}aa 2px, transparent 2px), linear-gradient(90deg, ${a}aa 2px, transparent 2px)`,
            backgroundSize: `${cell}px ${cell}px`,
            backgroundPosition: `center ${(t * 90) % cell}px`,
            maskImage: fade,
            WebkitMaskImage: fade,
          }}
        />
      </div>
    </>
  );
};

/** Grano de película que cambia 24 veces por segundo, con viñeta y un brillo de color. */
const Grano: BgFC = ({ t, pal }) => {
  const [a, b] = pal.colors;
  const seed = grainSeed(t);
  const id = `grano-${seed}`;
  return (
    <>
      <AbsoluteFill
        style={{ background: `radial-gradient(ellipse at 30% 25%, ${a}30, transparent 60%), radial-gradient(ellipse at 75% 80%, ${b}26, transparent 60%)` }}
      />
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.16, mixBlendMode: 'screen' }}>
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,0.7) 100%)' }} />
    </>
  );
};

const CODE = [
  'const hook = await claude.run({ prompt })',
  'export default function App() {',
  '  return <Video fps={60} hook="zoom" />',
  'git commit -m "construyo en público"',
  'for (const idea of ideas) ship(idea)',
  'npx remotion render --codec prores',
  'if (views > 1_000_000) celebrate()',
  'const [frame] = useCurrentFrame()',
  'await deploy({ prod: true })',
  'pnpm dev  # localhost:3210',
  'type Hook = "glitch" | "zoom" | "tachón"',
  'while (!done) { iterate() }',
];

/** Líneas de código tenues que suben en diagonal; algunas palabras en color. */
const Codigo: BgFC = ({ t, pal }) => {
  const line = 64;
  const rows = 44;
  const shift = (t * 40) % (line * CODE.length);
  const fade = 'linear-gradient(to bottom, transparent 0%, #000 25%, #000 75%, transparent 100%)';
  return (
    <AbsoluteFill style={{ maskImage: fade, WebkitMaskImage: fade }}>
      <div
        style={{
          position: 'absolute',
          left: '-30%',
          top: '-20%',
          width: '160%',
          transform: `rotate(-14deg) translateY(${-shift}px)`,
          fontFamily: fonts.mono,
          fontSize: 34,
          lineHeight: `${line}px`,
          whiteSpace: 'pre',
          color: '#ffffff',
          opacity: 0.13,
        }}
      >
        {Array.from({ length: rows }, (_, i) => {
          const text = CODE[i % CODE.length];
          const color = pal.colors[i % 3];
          const [head, ...rest] = text.split(' ');
          return (
            <div key={i} style={{ paddingLeft: (i * 137) % 260 }}>
              <span style={{ color, opacity: 1 }}>{head}</span> {rest.join(' ')}
              {'      '}
              {CODE[(i + 5) % CODE.length]}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const STYLES: Record<BgProps['bg'], BgFC | null> = {
  aurora: Aurora,
  puntos: Puntos,
  gradiente: Gradiente,
  rejilla: Rejilla,
  grano: Grano,
  codigo: Codigo,
  solido: null,
};

/** El fondo elegido, con los colores elegidos. Lo pone la envoltura común de todos los efectos. */
export const Background: React.FC<{ t: number } & Partial<BgProps>> = ({ t, ...p }) => {
  const pal = bgPalette(p);
  const Style = STYLES[p.bg ?? 'aurora'] ?? null;
  return (
    <AbsoluteFill style={{ background: pal.base, overflow: 'hidden' }}>
      {Style && <Style t={t} pal={pal} />}
    </AbsoluteFill>
  );
};
