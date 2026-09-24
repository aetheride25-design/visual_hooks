import type React from 'react';

export type MediaRef = { src: string; kind: 'video' | 'image'; name: string; width: number; height: number };

/** Props que reciben todos los hooks y efectos, además de los suyos. */
export type BaseProps = {
  media: MediaRef | null;
  durationSec: number;
  fps: 30 | 60;
  /** Multiplica la velocidad de la animación (1 = normal). */
  speed: number;
  /** Sin fondo de marca: para exportar con transparencia y montarlo encima en DaVinci. */
  transparent: boolean;
};

export type ParamDef =
  | { key: string; label: string; type: 'text'; multiline?: boolean }
  | { key: string; label: string; type: 'color' }
  | { key: string; label: string; type: 'number'; min: number; max: number; step: number }
  | { key: string; label: string; type: 'select'; options: { value: string; label: string }[] }
  | { key: string; label: string; type: 'boolean' }
  /** Un segundo video o imagen (p. ej. el "después"). */
  | { key: string; label: string; type: 'media' };

export type EffectGroup = 'hook' | 'apoyo' | 'pieza';

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
  defaults: P;
  params: ParamDef[];
  component: React.FC<P & BaseProps>;
  /** Tamaño del lienzo si no es el vertical 1080×1920 (puede depender de los props). */
  canvas?: (props: P) => { width: number; height: number };
};
