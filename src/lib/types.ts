import type React from 'react';
import type { BgProps } from './background.ts';
import type { CaptionsSettings } from '../components/captions.tsx';
import type { Label, Lang, Text } from './i18n.ts';

export type MediaRef = {
  src: string;
  kind: 'video' | 'image' | 'audio';
  name: string;
  width: number;
  height: number;
  /** Length in seconds (videos and audio). Audio has width and height 0. */
  durationSec?: number;
};

/** Props every hook and effect receives on top of its own. */
export type BaseProps = BgProps & {
  media: MediaRef | null;
  durationSec: number;
  fps: 30 | 60;
  /** Multiplies the animation speed (1 = normal). */
  speed: number;
  /** No background: to export with transparency and lay it over your footage in an editor. */
  transparent: boolean;
  /**
   * "Apply to my video": the export lasts as long as your video (or audio) and the effect only covers this span.
   * null = "Effect only": a standalone clip that lasts `durationSec`.
   */
  timeline: Timeline | null;
  /** Captions on top of everything (null = off). */
  captions: CaptionsSettings | null;
};

/** Where the effect lands inside your video, in seconds. */
export type Timeline = { startSec: number; effectSec: number };

/**
 * What the effect does when you apply it to a long video:
 * - 'moment': covers one span (the hooks); before and after it your video plays as is.
 * - 'full': lasts your whole video (e.g. Split screen, or "No effect").
 * - 'overlay': a card that doesn't use your video; it goes on top of it at the second you pick.
 * - 'none': a standalone piece, it doesn't go over a video.
 */
export type OnVideo = 'moment' | 'full' | 'overlay' | 'none';

export type ParamDef =
  | { key: string; label: Label; type: 'text'; multiline?: boolean }
  | { key: string; label: Label; type: 'color' }
  | { key: string; label: Label; type: 'number'; min: number; max: number; step: number }
  | { key: string; label: Label; type: 'select'; options: { value: string; label: Label }[] }
  | { key: string; label: Label; type: 'boolean' }
  /** A second video or image (e.g. the "after"). */
  | { key: string; label: Label; type: 'media' };

export type EffectGroup = 'base' | 'hook' | 'support' | 'piece';

export type EffectDef<P extends Record<string, unknown> = Record<string, unknown>> = {
  /** Letters, digits and dashes only: Remotion uses it as the composition id. */
  id: string;
  name: Text;
  group: EffectGroup;
  description: Text;
  /** Whether it uses the uploaded video or image (without one it shows a placeholder screen). */
  usesMedia: boolean;
  /** What your main video is called in this effect (e.g. "Bottom shot"); shown next to its params. */
  mediaLabel?: Text;
  defaultDurationSec: number;
  /** What it does on a long video. If omitted: 'moment' if it uses your video, 'overlay' if not. */
  onVideo?: OnVideo;
  /** Where it lands by default when applied to your video (e.g. the end card, at the end). */
  defaultAt?: 'start' | 'end';
  /** Default props. The texts are in English; `localized` swaps them for other languages. */
  defaults: P;
  /** Default texts in other languages, on top of `defaults` (e.g. the Spanish sample copy). */
  localized?: Partial<Record<Lang, Partial<P>>>;
  params: ParamDef[];
  component: React.FC<P & BaseProps>;
  /** Second shown on its card in the effect gallery (default: 70 % of its duration, when it's fully in). */
  thumbSec?: number;
  /** Who made it. Mods show it on their card. */
  author?: string;
  /** Set by the registry: 'mod' if it was loaded from the mods/ folder. */
  source?: 'core' | 'mod';
  /** Canvas size when it isn't the vertical 1080×1920 (may depend on the props). */
  canvas?: (props: P) => { width: number; height: number };
};
