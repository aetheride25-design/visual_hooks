import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { aurora, colorOf, fonts, type PaletteColor } from '../../brand.ts';
import { MediaBackdrop } from '../../components/backdrop.tsx';
import { cardStyle } from '../../components/brand.tsx';
import { cursorOn, easeOutBack, lerp, progress, timeOf, typedText, typingEnd } from '../../lib/anim.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';

type Props = {
  text: string;
  style: 'chat' | 'terminal';
  label: string;
  result: string;
  color: PaletteColor;
  cps: number;
  position: 'arriba' | 'centro' | 'abajo';
  showMedia: boolean;
  dim: number;
};

const START = 0.35;

/** Un prompt o comando que se escribe letra por letra con cursor, se "envía" y muestra el resultado. */
const PromptEscribe: React.FC<Props & BaseProps> = (p) => {
  const t = timeOf(useCurrentFrame(), p.fps, p.speed);
  const color = colorOf(p.color);
  const typed = typedText(p.text, t, START, p.cps);
  const done = typingEnd(p.text, START, p.cps);
  const sent = progress(t, done + 0.15, 0.25);
  const resultP = easeOutBack(progress(t, done + 0.35, 0.35), 1.3);
  // Mientras escribe, el cursor queda fijo; al terminar vuelve a parpadear.
  const cursor = t < done + 0.1 ? true : cursorOn(t);
  const cardIn = easeOutBack(progress(t, 0, 0.35), 1.2);
  const terminal = p.style === 'terminal';
  const justify = p.position === 'arriba' ? 'flex-start' : p.position === 'abajo' ? 'flex-end' : 'center';

  const caret = (
    <span
      style={{
        display: 'inline-block',
        width: terminal ? '0.6em' : '0.12em',
        height: '1.05em',
        marginLeft: 4,
        verticalAlign: '-0.15em',
        background: color,
        opacity: cursor ? 1 : 0,
        boxShadow: `0 0 16px ${color}`,
      }}
    />
  );

  return (
    <AbsoluteFill>
      {p.showMedia && <MediaBackdrop media={p.media} fit="cover" dim={p.dim} blur={6} />}
      <AbsoluteFill style={{ justifyContent: justify, alignItems: 'center', padding: '240px 50px', gap: 36 }}>
        <div
          style={{
            ...cardStyle(terminal ? 26 : 40, color),
            width: 980,
            // Al "enviar", la tarjeta se hunde un poco y vuelve.
            transform: `translateY(${lerp(60, 0, cardIn)}px) scale(${lerp(0.9, 1, cardIn) * (1 - 0.02 * Math.sin(Math.PI * sent))})`,
            opacity: Math.min(1, cardIn * 2),
            background: terminal ? '#0c0e11' : aurora.surface,
          }}
        >
          {terminal ? (
            <div style={{ display: 'flex', gap: 12, padding: '22px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {[aurora.red, '#f5c451', aurora.mint].map((c) => (
                <span key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c, opacity: 0.9 }} />
              ))}
              {p.label && <span style={{ marginLeft: 16, fontFamily: fonts.mono, fontSize: 26, color: aurora.muted }}>{p.label}</span>}
            </div>
          ) : (
            p.label && (
              <div style={{ padding: '30px 44px 0', fontFamily: fonts.sans, fontSize: 30, fontWeight: 600, color: aurora.muted }}>{p.label}</div>
            )
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 24,
              padding: terminal ? '34px 40px 40px' : '22px 44px 36px',
              minHeight: terminal ? 200 : 180,
            }}
          >
            <div
              style={{
                flex: 1,
                fontFamily: terminal ? fonts.mono : fonts.sans,
                fontSize: terminal ? 46 : 54,
                fontWeight: terminal ? 500 : 550,
                lineHeight: 1.3,
                color: aurora.text,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {terminal && <span style={{ color }}>$ </span>}
              {typed}
              {caret}
              {terminal && p.result && resultP > 0 && (
                <div style={{ marginTop: 18, color, opacity: Math.min(1, resultP * 2) }}>✓ {p.result}</div>
              )}
            </div>
            {!terminal && (
              <div
                style={{
                  width: 92,
                  height: 92,
                  flex: 'none',
                  borderRadius: 46,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 50,
                  fontWeight: 800,
                  color: '#0a0b0d',
                  background: t >= done ? color : 'rgba(255,255,255,0.12)',
                  transform: `scale(${1 - 0.18 * Math.sin(Math.PI * sent)})`,
                  boxShadow: t >= done ? `0 0 ${30 + 50 * sent}px ${color}` : 'none',
                }}
              >
                ↑
              </div>
            )}
          </div>
        </div>
        {!terminal && p.result && resultP > 0 && (
          <div
            style={{
              padding: '20px 40px',
              borderRadius: 999,
              background: color,
              color: '#0a0b0d',
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 50,
              transform: `scale(${resultP})`,
              boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 60px ${color}66`,
            }}
          >
            {p.result}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const promptEscribe: EffectDef<Props> = {
  id: 'prompt-escribe',
  name: 'Prompt que se escribe',
  group: 'hook',
  description: 'Un prompt o comando se escribe solo, letra por letra con cursor, se envía y muestra el resultado.',
  usesMedia: true,
  defaultDurationSec: 3.5,
  defaults: {
    text: 'Hazme una app que convierta mis videos en shorts',
    style: 'chat',
    label: 'Prompt',
    result: 'Listo en 40 s',
    color: 'mint',
    cps: 26,
    position: 'centro',
    showMedia: false,
    dim: 0.7,
  },
  params: [
    { key: 'text', label: 'Texto que se escribe', type: 'text', multiline: true },
    {
      key: 'style',
      label: 'Estilo',
      type: 'select',
      options: [
        { value: 'chat', label: 'Chat con IA' },
        { value: 'terminal', label: 'Terminal' },
      ],
    },
    { key: 'label', label: 'Etiqueta de la ventana', type: 'text' },
    { key: 'result', label: 'Resultado al enviar (vacío = nada)', type: 'text' },
    { key: 'color', label: 'Color', type: 'color' },
    { key: 'cps', label: 'Letras por segundo', type: 'number', min: 5, max: 80, step: 1 },
    {
      key: 'position',
      label: 'Posición',
      type: 'select',
      options: [
        { value: 'arriba', label: 'Arriba' },
        { value: 'centro', label: 'Centro' },
        { value: 'abajo', label: 'Abajo' },
      ],
    },
    { key: 'showMedia', label: 'Tu captura detrás', type: 'boolean' },
    { key: 'dim', label: 'Oscurecer captura', type: 'number', min: 0, max: 1, step: 0.02 },
  ],
  component: PromptEscribe,
};
