// Shared wrapper around every effect: background, your video with its audio, the effect's span and captions.
// The preview (Player) and the render (Composition) use it the same way.
import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { Audio } from '@remotion/media';
import { Background } from './components/backgrounds.tsx';
import { MainVideoClock, MediaAt, mediaRect } from './components/media.tsx';
import { CaptionsLayer } from './components/captions.tsx';
import { timeOf } from './lib/anim.ts';
import type { Fit } from './lib/layout.ts';
import { fadeOut, onVideoOf } from './lib/timeline.ts';
import type { BaseProps, EffectDef } from './lib/types.ts';
import { FRAME } from './lib/frame.ts';
import { effects } from './registry.ts';

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
