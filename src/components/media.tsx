import React, { createContext, useContext } from 'react';
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { Video } from '@remotion/media';
import { aurora, fonts } from '../theme.ts';
import { fitRect, type Fit, type Rect } from '../lib/layout.ts';
import type { MediaRef } from '../lib/types.ts';

/** Aurora card: surface, border with a 1 px light line and layered shadows. */
export const cardStyle = (radius = 36, glow?: string): React.CSSProperties => ({
  background: aurora.surface,
  borderRadius: radius,
  border: '1px solid rgba(255,255,255,0.09)',
  boxShadow: [
    'inset 0 1px 0 rgba(255,255,255,0.14)',
    '0 1px 2px rgba(0,0,0,0.5)',
    '0 12px 32px rgba(0,0,0,0.45)',
    '0 40px 120px rgba(0,0,0,0.55)',
    glow ? `0 0 90px ${glow}40` : '',
  ]
    .filter(Boolean)
    .join(', '),
  overflow: 'hidden',
});

/** Pill-shaped tag (e.g. above the floating window). */
export const Pill: React.FC<{ text: string; color: string; style?: React.CSSProperties }> = ({ text, color, style }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 16,
      padding: '14px 30px',
      borderRadius: 999,
      background: 'rgba(19,21,25,0.86)',
      border: `1px solid ${color}55`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 10px 30px rgba(0,0,0,0.45), 0 0 40px ${color}30`,
      color: aurora.text,
      fontFamily: fonts.sans,
      fontWeight: 650,
      fontSize: 40,
      letterSpacing: 0.5,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    <span style={{ width: 16, height: 16, borderRadius: 8, background: color, boxShadow: `0 0 16px ${color}` }} />
    {text}
  </div>
);

/** Fake editor screen (1920×1080) shown until you upload your video or image. */
const Placeholder: React.FC = () => {
  const rows = [
    [aurora.violet, 0.22, aurora.text, 0.38],
    [aurora.blue, 0.3, aurora.muted, 0.2],
    [aurora.mint, 0.18, aurora.text, 0.46],
    [aurora.muted, 0.52],
    [aurora.violet, 0.14, aurora.blue, 0.26, aurora.text, 0.2],
    [aurora.mint, 0.34, aurora.muted, 0.3],
    [aurora.text, 0.24, aurora.violet, 0.2],
    [aurora.blue, 0.4],
    [aurora.muted, 0.28, aurora.mint, 0.3],
  ] as (string | number)[][];
  return (
    <AbsoluteFill style={{ background: '#0f1114', padding: '90px 120px', gap: 40, fontFamily: fonts.mono }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', gap: 26, alignItems: 'center', paddingLeft: (i % 3) * 80 }}>
          <span style={{ color: '#3a3f47', fontSize: 40, width: 60 }}>{i + 1}</span>
          {Array.from({ length: row.length / 2 }, (_, j) => (
            <div
              key={j}
              style={{
                height: 40,
                width: `${(row[j * 2 + 1] as number) * 70}%`,
                borderRadius: 8,
                background: row[j * 2] as string,
                opacity: 0.75,
              }}
            />
          ))}
        </div>
      ))}
    </AbsoluteFill>
  );
};

export const PLACEHOLDER_SIZE = { width: 1920, height: 1080 };

/** Actual media size (or the placeholder's if nothing is uploaded yet). */
export const sizeOf = (media: MediaRef | null) =>
  media && media.kind !== 'audio' ? { width: media.width, height: media.height } : PLACEHOLDER_SIZE;

/** Where your footage lands inside `box` (in px of the 1080×1920 frame). */
export const mediaRect = (media: MediaRef | null, box: Rect, fit: Fit): Rect => {
  const s = sizeOf(media);
  return fitRect(s.width, s.height, box, fit);
};

/**
 * Your video (muted unless `muted={false}`, frame-accurate in the render) or your image, sized to its container.
 * `width` is the px width it's drawn at: the placeholder uses it to scale itself.
 */
export const Media: React.FC<{ media: MediaRef | null; width: number; loop?: boolean; muted?: boolean }> = ({
  media,
  width,
  loop = false,
  muted = true,
}) => {
  // Inside an effect applied to your video, your video keeps playing where it was (it doesn't restart).
  const clock = useContext(MainVideoClock);
  const localFrame = useCurrentFrame();
  const trimBefore = clock && media?.src === clock.src ? Math.max(0, clock.frame - localFrame) : undefined;

  // Audio has no picture: show the sample screen.
  if (!media || media.kind === 'audio') {
    return (
      <div
        style={{
          position: 'absolute',
          width: PLACEHOLDER_SIZE.width,
          height: PLACEHOLDER_SIZE.height,
          transformOrigin: '0 0',
          transform: `scale(${width / PLACEHOLDER_SIZE.width})`,
        }}
      >
        <Placeholder />
      </div>
    );
  }
  const style: React.CSSProperties = { width: '100%', height: '100%', display: 'block' };
  return media.kind === 'video' ? (
    <Video src={media.src} muted={muted} loop={loop} trimBefore={trimBefore} objectFit="fill" style={style} />
  ) : (
    <Img src={media.src} style={{ ...style, objectFit: 'fill' }} />
  );
};

/**
 * Clock of your main video when the effect is applied to a span of it: its file and the frame of your video
 * being drawn. With it, every <Video> of that file inside a <Sequence> is trimmed at the start (trimBefore)
 * by exactly how much later that Sequence began, so it stays on the same second as your background video.
 */
export const MainVideoClock = createContext<{ src: string; frame: number } | null>(null);

/** Media placed in its rectangle, in frame coordinates. */
export const MediaAt: React.FC<{ media: MediaRef | null; rect: Rect; style?: React.CSSProperties; loop?: boolean; muted?: boolean }> = ({
  media,
  rect,
  style,
  loop,
  muted,
}) => (
  <div style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, overflow: 'hidden', ...style }}>
    <Media media={media} width={rect.w} loop={loop} muted={muted} />
  </div>
);
