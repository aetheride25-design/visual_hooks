import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { Audio } from '@remotion/media';
import { Background } from './components/backgrounds.tsx';
import { MainVideoClock, MediaAt, mediaRect } from './components/brand.tsx';
import { CaptionsLayer } from './components/captions.tsx';
import { bgDefaults } from './lib/background.ts';
import { timeOf } from './lib/anim.ts';
import type { Fit } from './lib/layout.ts';
import { fadeOut, onVideoOf } from './lib/timeline.ts';
import type { BaseProps, EffectDef } from './lib/types.ts';
import { FRAME, HEIGHT, WIDTH } from './lib/frame.ts';
import { sinEfecto } from './effects/SinEfecto.tsx';
import { antesDespuesGolpe } from './effects/hooks/AntesDespuesGolpe.tsx';
import { cronometro } from './effects/hooks/Cronometro.tsx';
import { promptEscribe } from './effects/hooks/PromptEscribe.tsx';
import { tachonRojo } from './effects/hooks/TachonRojo.tsx';
import { enfoqueGolpe } from './effects/hooks/EnfoqueGolpe.tsx';
import { flechaCirculo } from './effects/hooks/FlechaCirculo.tsx';
import { glitch } from './effects/hooks/Glitch.tsx';
import { notificacion } from './effects/hooks/Notificacion.tsx';
import { textoCae } from './effects/hooks/TextoCae.tsx';
import { ventana3D } from './effects/hooks/Ventana3D.tsx';
import { zoomBrusco } from './effects/hooks/ZoomBrusco.tsx';
import { antesDespues } from './effects/apoyo/AntesDespues.tsx';
import { listaMisterio } from './effects/apoyo/ListaMisterio.tsx';
import { mitadYMitad } from './effects/apoyo/MitadYMitad.tsx';
import { numeroGrande } from './effects/apoyo/NumeroGrande.tsx';
import { tarjetaCierre } from './effects/apoyo/TarjetaCierre.tsx';
import { tarjetaTexto } from './effects/apoyo/TarjetaTexto.tsx';
import { ventanaFlotante } from './effects/apoyo/VentanaFlotante.tsx';
import { ideaSinNombre } from './effects/piezas/IdeaSinNombre.tsx';

export const effects: EffectDef<any>[] = [
  // Tu video tal cual (para ponerle solo subtítulos)
  sinEfecto,
  // A. Hooks visuales (0–2 s)
  enfoqueGolpe,
  zoomBrusco,
  textoCae,
  ventana3D,
  flechaCirculo,
  antesDespuesGolpe,
  glitch,
  notificacion,
  tachonRojo,
  promptEscribe,
  cronometro,
  // B. Efectos de apoyo
  ventanaFlotante,
  mitadYMitad,
  antesDespues,
  numeroGrande,
  tarjetaTexto,
  tarjetaCierre,
  listaMisterio,
  // C. Piezas animadas (no van sobre un video)
  ideaSinNombre,
];

export const findEffect = (id: string): EffectDef<any> | undefined => effects.find((e) => e.id === id);

export { WIDTH, HEIGHT } from './lib/frame.ts';

/** Tamaño del lienzo de un efecto con estos props (vertical 1080×1920 salvo que el efecto diga otro). */
export const canvasOf = (def: EffectDef<any>, props: Record<string, unknown>) =>
  def.canvas?.(props) ?? { width: WIDTH, height: HEIGHT };

export const baseDefaults = (def: EffectDef<any>): BaseProps => ({
  media: null,
  durationSec: def.defaultDurationSec,
  fps: 30,
  speed: 1,
  transparent: false,
  timeline: null,
  captions: null,
  ...bgDefaults,
});

export const durationInFrames = (p: Pick<BaseProps, 'durationSec' | 'fps'>): number =>
  Math.max(1, Math.round(p.durationSec * p.fps));

/**
 * El tramo del efecto dentro de tu video: su fondo (o el velo de las tarjetas) y el efecto,
 * que al final se desvanece para volver a tu video limpio.
 */
const EffectSpan: React.FC<{ length: number; fps: number; fade: boolean; fadeIn: boolean; children: React.ReactNode }> = ({
  length,
  fps,
  fade,
  fadeIn,
  children,
}) => {
  const frame = useCurrentFrame();
  const out = fade ? fadeOut(frame, length, fps) : 1;
  const inn = fadeIn ? Math.min(1, frame / Math.max(1, Math.round(0.15 * fps))) : 1;
  return <AbsoluteFill style={{ opacity: Math.min(out, inn) }}>{children}</AbsoluteFill>;
};

/** Velo oscuro detrás de una tarjeta de texto puesta encima de tu video, para que se lea. */
const Scrim: React.FC = () => <AbsoluteFill style={{ background: 'rgba(10,11,13,0.62)', backdropFilter: 'blur(8px)' }} />;

/**
 * Envoltura común. La usan igual la vista previa (Player) y el render (Composition).
 * - "Solo el efecto" (timeline = null): fondo elegido (salvo transparente) + el efecto.
 * - "Aplicar a mi video": tu video completo con su audio de fondo y el efecto solo en su tramo.
 *   En transparente (ProRes/PNG) salen solo el efecto en su tramo y los subtítulos, para DaVinci.
 * Los subtítulos, si están activos, van encima de todo.
 */
export const shellFor = (def: EffectDef<any>): React.FC<Record<string, unknown>> => {
  const Inner = def.component;
  const onVideo = onVideoOf(def);
  const Shell: React.FC<Record<string, unknown>> = (props) => {
    const p = props as unknown as BaseProps & { fit?: unknown };
    const frame = useCurrentFrame();
    const background = !p.transparent && (
      <Background t={timeOf(frame, p.fps, p.speed)} bg={p.bg} bgTint={p.bgTint} bgBase={p.bgBase} bgColors={p.bgColors} />
    );
    const captions = p.captions && <CaptionsLayer captions={p.captions} fps={p.fps} />;

    if (!p.timeline) {
      return (
        <AbsoluteFill>
          {background}
          <Inner {...(props as any)} />
          {captions}
        </AbsoluteFill>
      );
    }

    const main = p.media;
    const video = main?.kind === 'video' ? main : null;
    const from = Math.round(p.timeline.startSec * p.fps);
    const length = Math.max(1, Math.round(p.timeline.effectSec * p.fps));
    // Fuera del efecto, tu video con el mismo encuadre que usa el efecto (si lo tiene).
    const fit: Fit = p.fit === 'cover' ? 'cover' : 'contain';
    const innerProps = { ...props, media: video, durationSec: p.timeline.effectSec, timeline: null, captions: null };

    return (
      <MainVideoClock.Provider value={video ? { src: video.src, frame } : null}>
        <AbsoluteFill>
          {!p.transparent && (
            <>
              {background}
              {video && onVideo !== 'full' && <MediaAt media={video} rect={mediaRect(video, FRAME, fit)} />}
              {/* El audio va aparte: así suena igual dentro y fuera del efecto. */}
              {main && <Audio src={main.src} />}
            </>
          )}
          {onVideo !== 'none' && (
            <Sequence from={from} durationInFrames={length} name={def.name}>
              <EffectSpan length={length} fps={p.fps} fade={onVideo !== 'full'} fadeIn={onVideo === 'overlay'}>
                {onVideo === 'overlay' ? !p.transparent && <Scrim /> : background}
                <Inner {...(innerProps as any)} />
              </EffectSpan>
            </Sequence>
          )}
          {captions}
        </AbsoluteFill>
      </MainVideoClock.Provider>
    );
  };
  Shell.displayName = `Shell(${def.id})`;
  return Shell;
};

export const shells: Record<string, React.FC<Record<string, unknown>>> = Object.fromEntries(
  effects.map((e) => [e.id, shellFor(e)]),
);

