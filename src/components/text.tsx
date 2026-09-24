import React from 'react';
import { aurora, fonts } from '../brand.ts';
import { easeOutBack, easeOutCubic, lerp, progress } from '../lib/anim.ts';
import { parseLines } from '../lib/text.ts';

export type WordEntrance = 'slam' | 'rise' | 'blur';

/**
 * Texto grande que entra palabra por palabra. Las palabras entre *asteriscos*
 * salen en serif itálica y color de acento (como hace Baena).
 */
export const KineticText: React.FC<{
  text: string;
  t: number;
  start: number;
  /** Segundos entre palabra y palabra. */
  stagger: number;
  size: number;
  accent: string;
  entrance: WordEntrance;
  align?: 'center' | 'left';
  color?: string;
  weight?: number;
}> = ({ text, t, start, stagger, size, accent, entrance, align = 'center', color = aurora.text, weight = 800 }) => {
  let index = 0;
  const lines = parseLines(text);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', gap: size * 0.08 }}>
      {lines.map((line, li) => (
        <div
          key={li}
          style={{ display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start', columnGap: size * 0.26 }}
        >
          {line.map((w, wi) => {
            const p = progress(t, start + index++ * stagger, entrance === 'slam' ? 0.28 : 0.4);
            const style: React.CSSProperties = {
              display: 'inline-block',
              fontFamily: w.accent ? fonts.serif : fonts.sans,
              fontStyle: w.accent ? 'italic' : 'normal',
              fontWeight: w.accent ? 400 : weight,
              fontSize: w.accent ? size * 1.08 : size,
              lineHeight: 1.05,
              letterSpacing: w.accent ? 0 : -size * 0.025,
              color: w.accent ? accent : color,
              textShadow: w.accent ? `0 0 ${size * 0.5}px ${accent}55` : '0 6px 30px rgba(0,0,0,0.45)',
              opacity: p > 0 ? Math.min(1, p * 3) : 0,
            };
            if (entrance === 'slam') {
              style.transform = `scale(${lerp(2.6, 1, easeOutBack(p, 1.4))})`;
              style.filter = p < 1 ? `blur(${(1 - easeOutCubic(p)) * 10}px)` : undefined;
            } else if (entrance === 'rise') {
              style.transform = `translateY(${lerp(size * 0.6, 0, easeOutBack(p, 1.2))}px)`;
            } else {
              style.filter = p < 1 ? `blur(${(1 - easeOutCubic(p)) * 24}px)` : undefined;
              style.transform = `scale(${lerp(1.25, 1, easeOutCubic(p))})`;
            }
            return (
              <span key={wi} style={style}>
                {w.text}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** Cuántas palabras tiene un texto con énfasis (para calcular cuándo termina de entrar). */
export const wordCount = (text: string) => parseLines(text).flat().length;
