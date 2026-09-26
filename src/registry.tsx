import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { Audio } from '@remotion/media';
import { Background } from './components/backgrounds.tsx';
import { MainVideoClock, MediaAt, mediaRect } from './components/media.tsx';
import { CaptionsLayer } from './components/captions.tsx';
import { bgDefaults } from './lib/background.ts';
import { timeOf } from './lib/anim.ts';
import type { Lang } from './lib/i18n.ts';
import type { Fit } from './lib/layout.ts';
import { fadeOut, onVideoOf } from './lib/timeline.ts';
import type { BaseProps, EffectDef } from './lib/types.ts';
import { FRAME, HEIGHT, WIDTH } from './lib/frame.ts';
import { noEffect } from './effects/NoEffect.tsx';
import { arrowCircle } from './effects/hooks/ArrowCircle.tsx';
import { beforeAfterCut } from './effects/hooks/BeforeAfterCut.tsx';
import { focusSnap } from './effects/hooks/FocusSnap.tsx';
import { glitch } from './effects/hooks/Glitch.tsx';
import { notification } from './effects/hooks/Notification.tsx';
import { promptTyping } from './effects/hooks/PromptTyping.tsx';
import { punchZoom } from './effects/hooks/PunchZoom.tsx';
import { redStrike } from './effects/hooks/RedStrike.tsx';
import { stopwatch } from './effects/hooks/Stopwatch.tsx';
import { textDrop } from './effects/hooks/TextDrop.tsx';
import { window3D } from './effects/hooks/Window3D.tsx';
import { beforeAfterWipe } from './effects/support/BeforeAfterWipe.tsx';
import { bigNumber } from './effects/support/BigNumber.tsx';
import { endCard } from './effects/support/EndCard.tsx';
import { floatingWindow } from './effects/support/FloatingWindow.tsx';
import { mysteryCards } from './effects/support/MysteryCards.tsx';
import { splitScreen } from './effects/support/SplitScreen.tsx';
import { textCard } from './effects/support/TextCard.tsx';
import { namelessIdea } from './effects/pieces/NamelessIdea.tsx';

export const effects: EffectDef<any>[] = [
  // Your video as is (to add captions only)
  noEffect,
  // A. Visual hooks (0–2 s)
  focusSnap,
  punchZoom,
  textDrop,
  window3D,
  arrowCircle,
  beforeAfterCut,
  glitch,
  notification,
  redStrike,
  promptTyping,
  stopwatch,
  // B. Support effects
  floatingWindow,
  splitScreen,
  beforeAfterWipe,
  bigNumber,
  textCard,
  endCard,
  mysteryCards,
  // C. Animated pieces (they don't go over a video)
  namelessIdea,
];

export const findEffect = (id: string): EffectDef<any> | undefined => effects.find((e) => e.id === id);

export { WIDTH, HEIGHT } from './lib/frame.ts';

/** Canvas size of an effect with these props (vertical 1080×1920 unless the effect says otherwise). */
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

/** The effect's own defaults, with the sample texts in `lang`. */
export const defaultsFor = (def: EffectDef<any>, lang: Lang): Record<string, unknown> => ({
  ...def.defaults,
  ...def.localized?.[lang],
});

export const durationInFrames = (p: Pick<BaseProps, 'durationSec' | 'fps'>): number =>
  Math.max(1, Math.round(p.durationSec * p.fps));

/**
 * The effect's span inside your video: its background (or the scrim behind cards) and the effect,
 * which fades out at the end to go back to your clean video.
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

/** Dark scrim behind a text card laid over your video, so it stays readable. */
const Scrim: React.FC = () => <AbsoluteFill style={{ background: 'rgba(10,11,13,0.62)', backdropFilter: 'blur(8px)' }} />;

/**
 * Shared wrapper. The preview (Player) and the render (Composition) use it the same way.
 * - "Effect only" (timeline = null): chosen background (unless transparent) + the effect.
 * - "Apply to my video": your whole video with its audio underneath and the effect only in its span.
 *   When transparent (ProRes/PNG) only the effect in its span and the captions come out, for your editor.
 * Captions, when on, go on top of everything.
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
    // Outside the effect, your video with the same framing the effect uses (if it has one).
    const fit: Fit = p.fit === 'cover' ? 'cover' : 'contain';
    const innerProps = { ...props, media: video, durationSec: p.timeline.effectSec, timeline: null, captions: null };

    return (
      <MainVideoClock.Provider value={video ? { src: video.src, frame } : null}>
        <AbsoluteFill>
          {!p.transparent && (
            <>
              {background}
              {video && onVideo !== 'full' && <MediaAt media={video} rect={mediaRect(video, FRAME, fit)} />}
              {/* The audio is separate so it sounds the same inside and outside the effect. */}
              {main && <Audio src={main.src} />}
            </>
          )}
          {onVideo !== 'none' && (
            <Sequence from={from} durationInFrames={length} name={def.name.en}>
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
