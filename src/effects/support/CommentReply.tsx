import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { colorOf, fonts, type PaletteColor } from '../../theme.ts';
import { MediaBackdrop } from '../../components/backdrop.tsx';
import { easeOutBack, easeOutCubic, lerp, progress, timeOf, typedText } from '../../lib/anim.ts';
import type { Fit } from '../../lib/layout.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';
import { dimParam, fitParam } from '../params.ts';

type Props = {
  header: string;
  user: string;
  comment: string;
  likes: string;
  color: PaletteColor;
  theme: 'light' | 'dark';
  position: 'top' | 'middle';
  typing: boolean;
  dim: number;
  fit: Fit;
};

/** "Replying to @user": a viewer's comment pops up as a sticker over your video, to answer it on camera. */
const CommentReply: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const color = colorOf(p.color);
  const light = p.theme === 'light';
  const pop = easeOutBack(progress(t, 0.1, 0.5), 1.4);
  const shown = p.typing ? typedText(p.comment, t, 0.45, 38) : p.comment;
  const heart = progress(t, 0.45 + (p.typing ? Array.from(p.comment).length / 38 : 0.1), 0.35);
  const user = p.user.replace(/^@?/, '@');
  const initial = Array.from(user.slice(1))[0]?.toUpperCase() ?? '?';

  return (
    <AbsoluteFill>
      <MediaBackdrop media={p.media} fit={p.fit} dim={p.dim * progress(t, 0, 0.3)} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: p.position === 'top' ? 'flex-start' : 'center', paddingTop: p.position === 'top' ? 330 : 0 }}>
        <div
          style={{
            width: 900,
            transform: `scale(${lerp(0.4, 1, pop)}) rotate(${lerp(-6, -1.5, pop)}deg)`,
            opacity: Math.min(1, progress(t, 0.1, 0.12)),
            borderRadius: 40,
            padding: '34px 40px 38px',
            background: light ? '#ffffff' : 'rgba(22,24,29,0.94)',
            color: light ? '#111' : '#f2f4f6',
            fontFamily: fonts.sans,
            boxShadow: `0 30px 80px rgba(0,0,0,0.45), 0 0 0 ${light ? 0 : 1}px rgba(255,255,255,0.1)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginBottom: 18 }}>
            <div
              style={{
                width: 84,
                height: 84,
                flex: 'none',
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontSize: 44,
                fontWeight: 800,
                color: '#0a0b0d',
                background: `linear-gradient(145deg, ${color}, ${color}99)`,
              }}
            >
              {initial}
            </div>
            <div style={{ fontSize: 36, color: light ? '#666' : '#9aa1ab', fontWeight: 600, lineHeight: 1.2 }}>
              {p.header && <div>↩ {p.header}</div>}
              <div style={{ color: light ? '#111' : '#fff', fontWeight: 800 }}>{user}</div>
            </div>
          </div>
          <div style={{ fontSize: 58, fontWeight: 750, lineHeight: 1.2, letterSpacing: -0.5, minHeight: 70 }}>
            {shown}
            {p.typing && shown.length < p.comment.length && <span style={{ opacity: 0.4 }}>|</span>}
          </div>
          {p.likes && (
            <div
              style={{
                marginTop: 22,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 34,
                fontWeight: 700,
                color: light ? '#555' : '#aab1ba',
                opacity: heart,
              }}
            >
              <span style={{ display: 'inline-block', color: '#ff4f6d', transform: `scale(${lerp(0.3, 1, easeOutBack(heart, 3))})`, fontSize: 40 }}>♥</span>
              {p.likes}
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const commentReply: EffectDef<Props> = {
  id: 'comment-reply',
  name: { en: 'Comment reply', es: 'Responder comentario' },
  group: 'support',
  description: {
    en: 'A viewer\'s comment pops up over your video, so you can answer it on camera. Great for series.',
    es: 'El comentario de alguien aparece sobre tu video para responderlo a cámara. Ideal para series.',
  },
  usesMedia: true,
  defaultDurationSec: 3,
  defaults: {
    header: 'Replying to',
    user: '@maria.codes',
    comment: 'Can you show how you made this?',
    likes: '2,481',
    color: 'violet',
    theme: 'light',
    position: 'top',
    typing: true,
    dim: 0.15,
    fit: 'cover',
  },
  localized: { es: { header: 'Respondiendo a', comment: '¿Puedes enseñar cómo lo hiciste?' } },
  params: [
    { key: 'comment', label: { en: 'Comment', es: 'Comentario' }, type: 'text', multiline: true },
    { key: 'user', label: { en: 'Who wrote it', es: 'Quién lo escribió' }, type: 'text' },
    { key: 'header', label: { en: 'Header (empty = none)', es: 'Encabezado (vacío = ninguno)' }, type: 'text' },
    { key: 'likes', label: { en: 'Likes (empty = hidden)', es: 'Me gusta (vacío = oculto)' }, type: 'text' },
    { key: 'color', label: { en: 'Accent color', es: 'Color de acento' }, type: 'color' },
    {
      key: 'theme',
      label: { en: 'Bubble', es: 'Burbuja' },
      type: 'select',
      options: [
        { value: 'light', label: { en: 'Light', es: 'Clara' } },
        { value: 'dark', label: { en: 'Dark', es: 'Oscura' } },
      ],
    },
    {
      key: 'position',
      label: { en: 'Position', es: 'Posición' },
      type: 'select',
      options: [
        { value: 'top', label: { en: 'Top', es: 'Arriba' } },
        { value: 'middle', label: { en: 'Middle', es: 'Centro' } },
      ],
    },
    { key: 'typing', label: { en: 'Types itself', es: 'Se escribe solo' }, type: 'boolean' },
    dimParam,
    fitParam(),
  ],
  component: CommentReply,
};
