import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { AuroraBackground } from './components/brand.tsx';
import { timeOf } from './lib/anim.ts';
import type { BaseProps, EffectDef } from './lib/types.ts';
import { HEIGHT, WIDTH } from './lib/frame.ts';
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
import { subtitulos } from './effects/apoyo/Subtitulos.tsx';
import { numeroGrande } from './effects/apoyo/NumeroGrande.tsx';
import { tarjetaCierre } from './effects/apoyo/TarjetaCierre.tsx';
import { tarjetaTexto } from './effects/apoyo/TarjetaTexto.tsx';
import { ventanaFlotante } from './effects/apoyo/VentanaFlotante.tsx';
import { ideaSinNombre } from './effects/piezas/IdeaSinNombre.tsx';

export const effects: EffectDef<any>[] = [
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
  subtitulos,
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
});

export const durationInFrames = (p: Pick<BaseProps, 'durationSec' | 'fps'>): number =>
  Math.max(1, Math.round(p.durationSec * p.fps));

/**
 * Envoltura común: pone el fondo de marca salvo en modo transparente.
 * La usan igual la vista previa (Player) y el render (Composition).
 */
export const shellFor = (def: EffectDef<any>): React.FC<Record<string, unknown>> => {
  const Inner = def.component;
  const Shell: React.FC<Record<string, unknown>> = (props) => {
    const p = props as unknown as BaseProps;
    const t = timeOf(useCurrentFrame(), p.fps, p.speed);
    return (
      <AbsoluteFill>
        {!p.transparent && <AuroraBackground t={t} />}
        <Inner {...(props as any)} />
      </AbsoluteFill>
    );
  };
  Shell.displayName = `Shell(${def.id})`;
  return Shell;
};

export const shells: Record<string, React.FC<Record<string, unknown>>> = Object.fromEntries(
  effects.map((e) => [e.id, shellFor(e)]),
);
