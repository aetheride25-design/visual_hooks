import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { aurora, colorOf, fonts, type PaletteColor } from '../../theme.ts';
import { MediaBackdrop } from '../../components/backdrop.tsx';
import { easeOutBack, easeOutCubic, easeOutExpo, lerp, progress, timeOf } from '../../lib/anim.ts';
import { parsePoll, winnerOf } from '../../lib/lists.ts';
import type { Fit } from '../../lib/layout.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';
import { dimParam, fitParam } from '../params.ts';

type Props = {
  question: string;
  options: string;
  color: PaletteColor;
  revealSec: number;
  dim: number;
  fit: Fit;
};

/** A poll card: the question, the options, then the bars fill in and the winner lights up. */
const Poll: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const options = parsePoll(p.options);
  const win = winnerOf(options);
  const color = colorOf(p.color);
  const card = easeOutBack(progress(t, 0.05, 0.5), 1.2);
  const fill = easeOutExpo(progress(t, p.revealSec, 0.9));
  const done = progress(t, p.revealSec + 0.7, 0.3);

  return (
    <AbsoluteFill>
      <MediaBackdrop media={p.media} fit={p.fit} dim={p.dim * progress(t, 0, 0.3)} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', fontFamily: fonts.sans }}>
        <div
          style={{
            width: 920,
            padding: '46px 44px 50px',
            borderRadius: 48,
            background: 'rgba(19,21,25,0.92)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 30px 90px rgba(0,0,0,0.55), 0 0 80px ${color}22`,
            transform: `translateY(${lerp(80, 0, card)}px) scale(${lerp(0.85, 1, card)})`,
            opacity: Math.min(1, card * 2),
          }}
        >
          <div style={{ color: aurora.text, fontSize: 66, fontWeight: 850, lineHeight: 1.15, letterSpacing: -1, marginBottom: 36, textAlign: 'center' }}>
            {p.question}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {options.map((o, i) => {
              const inn = easeOutCubic(progress(t, 0.25 + i * 0.12, 0.35));
              const won = i === win && done > 0;
              const pct = Math.round(o.pct * fill);
              return (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    height: 112,
                    borderRadius: 28,
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.06)',
                    border: `2px solid ${won ? color : 'rgba(255,255,255,0.08)'}`,
                    opacity: inn,
                    transform: `translateY(${lerp(30, 0, inn)}px) scale(${won ? lerp(1, 1.03, easeOutBack(done, 3)) : 1})`,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: `${o.pct * fill}%`,
                      background: i === win ? `linear-gradient(90deg, ${color}cc, ${color}88)` : 'rgba(255,255,255,0.16)',
                    }}
                  />
                  <div
                    style={{
                      position: 'relative',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 34px',
                      fontSize: 50,
                      fontWeight: 750,
                      color: aurora.text,
                      textShadow: '0 2px 10px rgba(0,0,0,0.45)',
                    }}
                  >
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {won && '✓ '}
                      {o.label}
                    </span>
                    {fill > 0 && <span style={{ fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const poll: EffectDef<Props> = {
  id: 'poll',
  name: { en: 'Poll', es: 'Encuesta' },
  group: 'support',
  description: {
    en: 'A question with options; the bars fill in and the winner lights up. Gets people commenting their pick.',
    es: 'Una pregunta con opciones; las barras se llenan y la ganadora se ilumina. Hace que comenten su elección.',
  },
  usesMedia: true,
  defaultDurationSec: 3.5,
  thumbSec: 3,
  defaults: {
    question: 'Which one would you use?',
    options: 'Cursor | 58\nVS Code + Copilot | 31\nVim, obviously | 11',
    color: 'violet',
    revealSec: 1.2,
    dim: 0.5,
    fit: 'cover',
  },
  localized: {
    es: { question: '¿Cuál usarías tú?', options: 'Cursor | 58\nVS Code + Copilot | 31\nVim, obvio | 11' },
  },
  params: [
    { key: 'question', label: { en: 'Question', es: 'Pregunta' }, type: 'text' },
    {
      key: 'options',
      label: { en: 'Options, one per line: Option | % (up to 4)', es: 'Opciones, una por línea: Opción | % (hasta 4)' },
      type: 'text',
      multiline: true,
    },
    { key: 'color', label: { en: 'Winner color', es: 'Color de la ganadora' }, type: 'color' },
    { key: 'revealSec', label: { en: 'Results at (s)', es: 'Resultados en (s)' }, type: 'number', min: 0.3, max: 3, step: 0.05 },
    dimParam,
    fitParam(),
  ],
  component: Poll,
};
