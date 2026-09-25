// "Apply to my video": where each effect lands inside your video and which media it works with.
// Pure logic, no React, so it can be tested with node --test.
import type { Label, Text } from './i18n.ts';
import type { EffectDef, MediaRef, OnVideo, Timeline } from './types.ts';

/** What the effect does on a long video (see OnVideo in types.ts). */
export const onVideoOf = (def: Pick<EffectDef, 'onVideo' | 'group' | 'usesMedia'>): OnVideo =>
  def.onVideo ?? (def.group === 'piece' ? 'none' : def.usesMedia ? 'moment' : 'overlay');

/** When its span ends, the effect fades out over this time and your clean video comes back. */
export const FADE_SEC = 0.3;

/**
 * The effect's span inside your video.
 * - 'full' covers everything.
 * - The rest lasts `effectSec` (trimmed if your video is shorter) and starts at `startSec`,
 *   or at the start / end depending on `defaultAt` if you haven't moved it yet.
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
  // In hundredths: the "Starts at" control shows it as is.
  const latest = Math.floor((total - effectSec) * 100) / 100;
  const wanted = o.startSec ?? (o.defaultAt === 'end' ? latest : 0);
  return { startSec: Math.min(latest, Math.max(0, wanted)), effectSec };
};

/** Effect opacity at `frame` of `length`: 1, fading to 0 over the last FADE_SEC. */
export const fadeOut = (frame: number, length: number, fps: number, fadeSec = FADE_SEC): number => {
  const fade = Math.min(length, Math.max(1, Math.round(fadeSec * fps)));
  return Math.min(1, Math.max(0, (length - frame) / fade));
};

const VIDEO: Text = { en: '🎬 Video', es: '🎬 Video' };
const AUDIO: Text = { en: '🎵 Audio', es: '🎵 Audio' };
const IMAGE: Text = { en: '🖼 Image', es: '🖼 Imagen' };

/** Tags shown in the effect list: which media each effect works with. */
export const tagsOf = (onVideo: OnVideo, group: EffectDef['group']): Label[] => {
  if (group === 'base') return [VIDEO, AUDIO];
  if (onVideo === 'none') return [{ en: '✨ Standalone piece', es: '✨ Pieza suelta' }];
  if (onVideo === 'overlay') return [{ en: '✨ Text only', es: '✨ Solo texto' }, { en: 'over 🎬 or 🎵', es: 'encima de 🎬 o 🎵' }];
  return [VIDEO, IMAGE];
};

/** Can it be used with what you picked? If not, the reason (shown in the list). */
export const compatibility = (onVideo: OnVideo, group: EffectDef['group'], media: MediaRef | null): Text | null => {
  // "No effect" goes with everything: with an audio file it's the background with your voice.
  if (group === 'base') return null;
  if (media?.kind === 'audio' && (onVideo === 'moment' || onVideo === 'full'))
    return {
      en: 'Needs an image: with audio only, text cards and captions work.',
      es: 'Necesita imagen: con un audio solo van tarjetas de texto y subtítulos.',
    };
  return null;
};

/** Does this media have its own time (video or audio with a duration)? Only then is there a timeline. */
export const hasTimeline = (media: MediaRef | null): media is MediaRef & { durationSec: number } =>
  (media?.kind === 'video' || media?.kind === 'audio') && !!media.durationSec;

/** Duration shown in the list: 0:07 or 1:05. */
export const formatDuration = (sec: number): string => {
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
