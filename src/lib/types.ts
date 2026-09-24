import type React from 'react';
import type { BgProps } from './background.ts';
import type { CaptionsSettings } from '../components/captions.tsx';

export type MediaRef = {
  src: string;
  kind: 'video' | 'image' | 'audio';
  name: string;
  width: number;
  height: number;
  /** Duración en segundos (videos y audios). Un audio tiene ancho y alto 0. */
  durationSec?: number;
};

/** Props que reciben todos los hooks y efectos, además de los suyos. */
export type BaseProps = BgProps & {
  media: MediaRef | null;
  durationSec: number;
  fps: 30 | 60;
  /** Multiplica la velocidad de la animación (1 = normal). */
  speed: number;
  /** Sin fondo: para exportar con transparencia y montarlo encima en DaVinci. */
  transparent: boolean;
  /**
   * "Aplicar a mi video": el export dura lo que tu video (o audio) y el efecto ocupa solo este tramo.
   * null = "Solo el efecto": un clip suelto que dura `durationSec`.
   */
  timeline: Timeline | null;
  /** Subtítulos encima de todo (null = apagados). */
  captions: CaptionsSettings | null;
};

/** Dónde cae el efecto dentro de tu video, en segundos. */
export type Timeline = { startSec: number; effectSec: number };

/**
 * Qué hace el efecto cuando lo aplicas a un video largo:
 * - 'moment': ocupa un tramo (los hooks); antes y después sigue tu video normal.
 * - 'full': dura todo tu video (p. ej. Mitad y mitad, o "Sin efecto").
 * - 'overlay': tarjeta que no usa tu video; va encima de él en el segundo que elijas.
 * - 'none': pieza suelta, no va sobre un video.
 */
export type OnVideo = 'moment' | 'full' | 'overlay' | 'none';

export type ParamDef =
  | { key: string; label: string; type: 'text'; multiline?: boolean }
  | { key: string; label: string; type: 'color' }
  | { key: string; label: string; type: 'number'; min: number; max: number; step: number }
  | { key: string; label: string; type: 'select'; options: { value: string; label: string }[] }
  | { key: string; label: string; type: 'boolean' }
  /** Un segundo video o imagen (p. ej. el "después"). */
  | { key: string; label: string; type: 'media' };

export type EffectGroup = 'base' | 'hook' | 'apoyo' | 'pieza';

export type EffectDef<P extends Record<string, unknown> = Record<string, unknown>> = {
  /** Solo letras, números y guiones: Remotion lo usa como id de composición. */
  id: string;
  name: string;
  group: EffectGroup;
  description: string;
  /** Si usa el video o imagen subido (si no hay, muestra un marcador de posición). */
  usesMedia: boolean;
  /** Cómo se llama tu video principal en este efecto (p. ej. "Toma de abajo"); se muestra junto a sus parámetros. */
  mediaLabel?: string;
  defaultDurationSec: number;
  /** Qué hace sobre un video largo. Si no se dice: 'moment' si usa tu video, 'overlay' si no. */
  onVideo?: OnVideo;
  /** Dónde cae al aplicarlo a tu video, de entrada (p. ej. la tarjeta de cierre, al final). */
  defaultAt?: 'start' | 'end';
  defaults: P;
  params: ParamDef[];
  component: React.FC<P & BaseProps>;
  /** Tamaño del lienzo si no es el vertical 1080×1920 (puede depender de los props). */
  canvas?: (props: P) => { width: number; height: number };
};
