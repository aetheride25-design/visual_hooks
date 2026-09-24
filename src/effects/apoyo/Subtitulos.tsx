import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/fonts';
import bangersUrl from '../../../assets/fonts/bangers-latin.woff2';
import montserratUrl from '../../../assets/fonts/montserrat-latin.woff2';
import { aurora, fonts } from '../../brand.ts';
import { MediaAt, mediaRect } from '../../components/brand.tsx';
import { clamp01, easeOutBack, easeOutCubic, lerp } from '../../lib/anim.ts';
import { activeWordIndex, displayText, pageAt, paginate, type CaptionWord } from '../../lib/captions.ts';
import { FRAME } from '../../lib/frame.ts';
import type { Fit } from '../../lib/layout.ts';
import type { BaseProps, EffectDef } from '../../lib/types.ts';

// Las fuentes de los estilos virales no vienen con Windows: van en assets/fonts (sin internet, siempre iguales).
// La vista previa y el render esperan a que carguen antes de dibujar.
const montserrat = 'Montserrat';
const bangers = 'Bangers';
loadFont({ family: montserrat, url: montserratUrl, weight: '100 900' });
loadFont({ family: bangers, url: bangersUrl, weight: '400' });

export type CaptionStyle = 'hormozi' | 'beast' | 'karaoke' | 'pop' | 'limpio' | 'editorial';
type Highlight = 'estilo' | 'amarillo' | 'verde' | 'mint' | 'violet' | 'blue' | 'red';

type Props = {
  words: CaptionWord[];
  /** De qué video salió la transcripción (para avisar si cambias de video). */
  wordsFor: string;
  captionStyle: CaptionStyle;
  perPage: 'auto' | '1' | '2' | '3' | '4' | '5';
  highlight: Highlight;
  heightPct: number;
  size: number;
  offsetMs: number;
  fit: Fit;
};

const COLORS: Record<Exclude<Highlight, 'estilo'>, string> = {
  amarillo: '#ffd93d',
  verde: '#39e67a',
  mint: aurora.mint,
  violet: aurora.violet,
  blue: aurora.blue,
  red: aurora.red,
};

type StyleDef = {
  perPage: number;
  color: string;
  upper: boolean;
  font: string;
  weight: number;
  size: number;
};

const STYLES: Record<CaptionStyle, StyleDef> = {
  hormozi: { perPage: 3, color: COLORS.amarillo, upper: true, font: montserrat, weight: 900, size: 92 },
  beast: { perPage: 2, color: COLORS.verde, upper: true, font: bangers, weight: 400, size: 124 },
  karaoke: { perPage: 4, color: aurora.violet, upper: true, font: montserrat, weight: 800, size: 76 },
  pop: { perPage: 1, color: COLORS.amarillo, upper: true, font: montserrat, weight: 900, size: 140 },
  limpio: { perPage: 5, color: aurora.text, upper: false, font: fonts.sans, weight: 700, size: 70 },
  editorial: { perPage: 3, color: aurora.mint, upper: false, font: fonts.sans, weight: 750, size: 84 },
};

/** Borde negro grueso por fuera de la letra (paint-order evita que se coma el relleno). */
const stroke = (px: number): React.CSSProperties => ({
  WebkitTextStroke: `${px}px #000`,
  paintOrder: 'stroke fill',
});

/** Cómo se ve una palabra según el estilo, si ya se dijo, si es la activa y cuánto hace que empezó (ms). */
const wordStyle = (
  style: CaptionStyle,
  def: StyleDef,
  color: string,
  size: number,
  spoken: boolean,
  active: boolean,
  age: number,
  pageAge: number,
): React.CSSProperties => {
  const base: React.CSSProperties = {
    display: 'inline-block',
    fontFamily: def.font,
    fontWeight: def.weight,
    fontSize: size,
    lineHeight: 1.08,
    color: aurora.text,
    whiteSpace: 'pre',
  };
  const pop = (from: number, ms: number, overshoot: number) => lerp(from, 1, easeOutBack(clamp01(age / ms), overshoot));

  switch (style) {
    case 'hormozi': {
      // La frase entra entera y la palabra dicha se pinta de amarillo, con un golpecito de escala.
      const enter = clamp01(pageAge / 90);
      return {
        ...base,
        ...stroke(size * 0.11),
        textShadow: '0 6px 14px rgba(0,0,0,0.55)',
        letterSpacing: -size * 0.01,
        color: active ? color : aurora.text,
        transform: `scale(${(active ? lerp(1.12, 1.05, clamp01(age / 120)) : 1) * lerp(0.9, 1, enter)})`,
        opacity: enter,
      };
    }
    case 'beast': {
      // Cada palabra salta al decirla (0.6 → 1.15 → 1) y la activa brilla en verde.
      if (!spoken) return { ...base, opacity: 0 };
      return {
        ...base,
        ...stroke(size * 0.12),
        fontStyle: 'italic',
        letterSpacing: size * 0.02,
        textShadow: `0 ${size * 0.07}px 0 #000${active ? `, 0 0 ${size * 0.3}px ${color}aa` : ''}`,
        color: active ? color : aurora.text,
        transform: `scale(${pop(0.6, 170, 2.6)}) rotate(${active ? -2 : 0}deg)`,
      };
    }
    case 'karaoke': {
      // Toda la frase visible; una caja de color va detrás de la palabra que se dice.
      const box = active ? easeOutCubic(clamp01(age / 80)) : 0;
      return {
        ...base,
        ...stroke(size * 0.06),
        padding: `${size * 0.06}px ${size * 0.16}px`,
        // El margen negativo compensa el relleno: la caja no separa más las palabras.
        margin: `0 ${-size * 0.16}px`,
        borderRadius: size * 0.18,
        background: box > 0 ? color : 'transparent',
        boxShadow: box > 0 ? `0 8px 24px ${color}66` : undefined,
        transform: `scale(${lerp(1, 1.06, box)})`,
        opacity: pageAge < 0 ? 0 : clamp01(pageAge / 80),
      };
    }
    case 'pop': {
      // Una sola palabra enorme que rebota al entrar.
      return {
        ...base,
        ...stroke(size * 0.1),
        textShadow: '0 8px 20px rgba(0,0,0,0.5)',
        color: active ? color : aurora.text,
        transform: `scale(${pop(0.5, 220, 2.2)})`,
        opacity: clamp01(age / 60),
      };
    }
    case 'limpio': {
      // Minimalista: lo que falta decir va tenue y lo dicho queda blanco. Sin borde.
      const enter = easeOutCubic(clamp01(pageAge / 200));
      return {
        ...base,
        textShadow: '0 4px 20px rgba(0,0,0,0.65)',
        color: active ? color : aurora.text,
        opacity: (spoken ? 1 : 0.5) * enter,
        transform: `translateY(${lerp(12, 0, enter)}px)`,
      };
    }
    case 'editorial': {
      // Como Baena: las palabras entran desenfocadas y la activa pasa a serif itálica de color.
      if (!spoken) return { ...base, opacity: 0 };
      const p = easeOutCubic(clamp01(age / 200));
      return {
        ...base,
        ...(active
          ? { fontFamily: fonts.serif, fontStyle: 'italic', fontWeight: 400, fontSize: size * 1.15, color, textShadow: `0 0 ${size * 0.5}px ${color}55` }
          : { textShadow: '0 6px 24px rgba(0,0,0,0.6)', letterSpacing: -size * 0.02 }),
        opacity: p,
        filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined,
      };
    }
  }
};

/** Subtítulos palabra por palabra sobre tu video, sincronizados con tu voz. */
const Subtitulos: React.FC<Props & BaseProps> = (p) => {
  // Siempre a velocidad normal: los subtítulos tienen que ir con tu voz.
  const ms = (useCurrentFrame() / p.fps) * 1000 - p.offsetMs;
  const def = STYLES[p.captionStyle] ?? STYLES.hormozi;
  const perPage = p.perPage === 'auto' ? def.perPage : Number(p.perPage);
  const color = p.highlight === 'estilo' ? def.color : COLORS[p.highlight];
  const size = def.size * p.size;
  const pages = React.useMemo(() => paginate(p.words ?? [], perPage), [p.words, perPage]);
  const page = pageAt(pages, ms);
  const active = page ? activeWordIndex(page, ms) : -1;

  return (
    <AbsoluteFill>
      {/* En transparente (para DaVinci) salen solo los subtítulos. */}
      {!p.transparent && <MediaAt media={p.media} rect={mediaRect(p.media, FRAME, p.fit)} muted={false} />}
      {page && (
        <div
          style={{
            position: 'absolute',
            left: FRAME.w * 0.08,
            width: FRAME.w * 0.84,
            top: (FRAME.h * p.heightPct) / 100,
            transform: 'translateY(-50%)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'baseline',
            columnGap: size * 0.28,
            rowGap: size * 0.1,
          }}
        >
          {page.words.map((w, i) => (
            <span key={`${page.startMs}-${i}`} style={wordStyle(p.captionStyle, def, color, size, i <= active, i === active, ms - w.startMs, ms - page.startMs)}>
              {displayText(w.text, def.upper, def.upper)}
            </span>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};

/** Frase de ejemplo (mientras no transcribas tu video): una palabra cada 0.32 s. */
const demoWords: CaptionWord[] = 'Esto lo hice con IA en diez minutos y hoy te enseño cómo.'
  .split(' ')
  .map((text, i) => ({ text, startMs: 200 + i * 320, endMs: 200 + i * 320 + 300 }));

export const subtitulos: EffectDef<Props> = {
  id: 'subtitulos',
  name: 'Subtítulos',
  group: 'apoyo',
  description: 'Transcribe tu voz con Whisper y pone subtítulos palabra por palabra, al tiempo exacto. 6 estilos virales.',
  usesMedia: true,
  mediaLabel: 'Tu video con voz',
  fullLength: true,
  defaultDurationSec: 4.5,
  defaults: {
    words: demoWords,
    wordsFor: '',
    captionStyle: 'hormozi',
    perPage: 'auto',
    highlight: 'estilo',
    heightPct: 66,
    size: 1,
    offsetMs: 0,
    fit: 'cover',
  },
  params: [
    { key: 'words', label: 'Transcripción', type: 'captions' },
    {
      key: 'captionStyle',
      label: 'Estilo',
      type: 'select',
      options: [
        { value: 'hormozi', label: 'Hormozi' },
        { value: 'beast', label: 'MrBeast' },
        { value: 'karaoke', label: 'Karaoke' },
        { value: 'pop', label: 'Pop' },
        { value: 'limpio', label: 'Limpio' },
        { value: 'editorial', label: 'Editorial' },
      ],
    },
    {
      key: 'perPage',
      label: 'Palabras a la vez',
      type: 'select',
      options: [
        { value: 'auto', label: 'Auto' },
        { value: '1', label: '1' },
        { value: '2', label: '2' },
        { value: '3', label: '3' },
        { value: '4', label: '4' },
        { value: '5', label: '5' },
      ],
    },
    {
      key: 'highlight',
      label: 'Color de la palabra activa',
      type: 'select',
      options: [
        { value: 'estilo', label: 'Del estilo' },
        { value: 'amarillo', label: 'Amarillo' },
        { value: 'verde', label: 'Verde' },
        { value: 'mint', label: 'Menta' },
        { value: 'violet', label: 'Violeta' },
        { value: 'blue', label: 'Azul' },
        { value: 'red', label: 'Rojo' },
      ],
    },
    { key: 'heightPct', label: 'Altura en pantalla (%)', type: 'number', min: 15, max: 82, step: 1 },
    { key: 'size', label: 'Tamaño', type: 'number', min: 0.5, max: 1.6, step: 0.05 },
    { key: 'offsetMs', label: 'Adelantar / atrasar (ms)', type: 'number', min: -600, max: 600, step: 10 },
    {
      key: 'fit',
      label: 'Encuadre del video',
      type: 'select',
      options: [
        { value: 'cover', label: 'Llenar pantalla' },
        { value: 'contain', label: 'Completo' },
      ],
    },
  ],
  component: Subtitulos,
};
