// "Aplicar a mi video": dónde cae cada efecto dentro de tu video y con qué medios funciona.
// Lógica pura, sin React, para poder probarla con node --test.
import type { EffectDef, MediaRef, OnVideo, Timeline } from './types.ts';

/** Qué hace el efecto sobre un video largo (ver OnVideo en types.ts). */
export const onVideoOf = (def: Pick<EffectDef, 'onVideo' | 'group' | 'usesMedia'>): OnVideo =>
  def.onVideo ?? (def.group === 'pieza' ? 'none' : def.usesMedia ? 'moment' : 'overlay');

/** Al terminar su tramo, el efecto se desvanece en este tiempo y vuelve tu video limpio. */
export const FADE_SEC = 0.3;

/**
 * Tramo del efecto dentro de tu video.
 * - 'full' ocupa todo.
 * - El resto dura `effectSec` (recortado si tu video es más corto) y empieza en `startSec`,
 *   o al inicio / al final según `defaultAt` si todavía no lo moviste.
 */
export const planTimeline = (o: {
  onVideo: OnVideo;
  totalSec: number;
  effectSec: number;
  startSec?: number;
  defaultAt?: 'start' | 'end';
}): Timeline => {
  const total = Math.max(0.1, o.totalSec);
  if (o.onVideo === 'full') return { startSec: 0, effectSec: total };
  const effectSec = Math.min(total, Math.max(0.1, o.effectSec));
  // En centésimas: el control de "Empieza en" lo muestra tal cual.
  const latest = Math.floor((total - effectSec) * 100) / 100;
  const wanted = o.startSec ?? (o.defaultAt === 'end' ? latest : 0);
  return { startSec: Math.min(latest, Math.max(0, wanted)), effectSec };
};

/** Opacidad del efecto en su cuadro `frame` de `length`: 1 y se apaga en los últimos FADE_SEC. */
export const fadeOut = (frame: number, length: number, fps: number, fadeSec = FADE_SEC): number => {
  const fade = Math.min(length, Math.max(1, Math.round(fadeSec * fps)));
  return Math.min(1, Math.max(0, (length - frame) / fade));
};

/** Etiquetas que se muestran en la lista: con qué medios funciona cada efecto. */
export const tagsOf = (onVideo: OnVideo, group: EffectDef['group']): string[] => {
  if (group === 'base') return ['🎬 Video', '🎵 Audio'];
  if (onVideo === 'none') return ['✨ Pieza suelta'];
  if (onVideo === 'overlay') return ['✨ Solo texto', 'encima de 🎬 o 🎵'];
  return ['🎬 Video', '🖼 Imagen'];
};

/** ¿Se puede usar con lo que elegiste? Si no, el motivo (se muestra en la lista). */
export const compatibility = (onVideo: OnVideo, group: EffectDef['group'], media: MediaRef | null): string | null => {
  // "Sin efecto" va con todo: con un audio es el fondo con tu voz.
  if (group === 'base') return null;
  if (media?.kind === 'audio' && (onVideo === 'moment' || onVideo === 'full'))
    return 'Necesita imagen: con un audio solo van tarjetas de texto y subtítulos.';
  return null;
};

/** ¿Este medio tiene tiempo propio (video o audio con duración)? Solo entonces hay línea de tiempo. */
export const hasTimeline = (media: MediaRef | null): media is MediaRef & { durationSec: number } =>
  (media?.kind === 'video' || media?.kind === 'audio') && !!media.durationSec;

/** Duración para mostrar en la lista: 0:07 o 1:05. */
export const formatDuration = (sec: number): string => {
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
