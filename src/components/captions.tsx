// Word-by-word captions: a layer that goes on top of any effect (or of your video or audio alone),
// synced to your voice. The transcript comes from Whisper (server/transcribe.ts).
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/fonts';
import bangersUrl from '../../assets/fonts/bangers-latin.woff2';
import montserratUrl from '../../assets/fonts/montserrat-latin.woff2';
import { aurora, fonts } from '../theme.ts';
import { clamp01, easeOutBack, easeOutCubic, lerp } from '../lib/anim.ts';
import { activeWordIndex, displayText, pageAt, paginate, type CaptionWord } from '../lib/captions.ts';
import { FRAME } from '../lib/frame.ts';
import type { Lang } from '../lib/i18n.ts';
import type { ParamDef } from '../lib/types.ts';

// The fonts of the viral styles don't ship with Windows: they live in assets/fonts (offline, always the same).
// The preview and the render wait for them to load before drawing.
const montserrat = 'Montserrat';
const bangers = 'Bangers';
loadFont({ family: montserrat, url: montserratUrl, weight: '100 900' });
loadFont({ family: bangers, url: bangersUrl, weight: '400' });

export type CaptionStyle = 'bold' | 'comic' | 'karaoke' | 'pop' | 'clean' | 'editorial';
type Highlight = 'style' | 'yellow' | 'green' | 'mint' | 'violet' | 'blue' | 'red';

export type CaptionsSettings = {
  words: CaptionWord[];
  /** Which file the transcript came from (to warn you if you switch video or audio). */
  wordsFor: string;
  captionStyle: CaptionStyle;
  perPage: 'auto' | '1' | '2' | '3' | '4' | '5';
  highlight: Highlight;
  heightPct: number;
  size: number;
  offsetMs: number;
};

const COLORS: Record<Exclude<Highlight, 'style'>, string> = {
  yellow: '#ffd93d',
  green: '#39e67a',
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
  bold: { perPage: 3, color: COLORS.yellow, upper: true, font: montserrat, weight: 900, size: 92 },
  comic: { perPage: 2, color: COLORS.green, upper: true, font: bangers, weight: 400, size: 124 },
  karaoke: { perPage: 4, color: aurora.violet, upper: true, font: montserrat, weight: 800, size: 76 },
  pop: { perPage: 1, color: COLORS.yellow, upper: true, font: montserrat, weight: 900, size: 140 },
  clean: { perPage: 5, color: aurora.text, upper: false, font: fonts.sans, weight: 700, size: 70 },
  editorial: { perPage: 3, color: aurora.mint, upper: false, font: fonts.sans, weight: 750, size: 84 },
};

/** Thick black outline outside the letters (paint-order keeps it from eating the fill). */
const stroke = (px: number): React.CSSProperties => ({
  WebkitTextStroke: `${px}px #000`,
  paintOrder: 'stroke fill',
});

/** How a word looks given the style, whether it was said, whether it's the active one and how long ago it started (ms). */
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
    case 'bold': {
      // The whole phrase comes in and the spoken word turns yellow, with a small scale punch.
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
    case 'comic': {
      // Each word pops when said (0.6 → 1.15 → 1) and the active one glows green.
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
      // The whole phrase is visible; a colored box sits behind the word being said.
      const box = active ? easeOutCubic(clamp01(age / 80)) : 0;
      return {
        ...base,
        ...stroke(size * 0.06),
        padding: `${size * 0.06}px ${size * 0.16}px`,
        // The negative margin offsets the padding: the box doesn't push the words apart.
        margin: `0 ${-size * 0.16}px`,
        borderRadius: size * 0.18,
        background: box > 0 ? color : 'transparent',
        boxShadow: box > 0 ? `0 8px 24px ${color}66` : undefined,
        transform: `scale(${lerp(1, 1.06, box)})`,
        opacity: pageAge < 0 ? 0 : clamp01(pageAge / 80),
      };
    }
    case 'pop': {
      // A single huge word that bounces in.
      return {
        ...base,
        ...stroke(size * 0.1),
        textShadow: '0 8px 20px rgba(0,0,0,0.5)',
        color: active ? color : aurora.text,
        transform: `scale(${pop(0.5, 220, 2.2)})`,
        opacity: clamp01(age / 60),
      };
    }
    case 'clean': {
      // Minimal: what's still to be said is dim and what was said stays white. No outline.
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
      // Words come in blurred and the active one switches to a colored italic serif.
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

/**
 * The captions layer. It always runs at normal speed and counts from frame 0 of your video:
 * it has to follow your voice, wherever the effect is.
 */
export const CaptionsLayer: React.FC<{ captions: CaptionsSettings; fps: number }> = ({ captions: p, fps }) => {
  const frame = useCurrentFrame();
  const ms = (frame / fps) * 1000 - p.offsetMs;
  const def = STYLES[p.captionStyle] ?? STYLES.bold;
  const perPage = p.perPage === 'auto' ? def.perPage : Number(p.perPage);
  const color = p.highlight === 'style' ? def.color : COLORS[p.highlight];
  const size = def.size * p.size;
  const pages = React.useMemo(() => paginate(p.words ?? [], perPage), [p.words, perPage]);
  const page = pageAt(pages, ms);
  const active = page ? activeWordIndex(page, ms) : -1;
  if (!page) return null;

  return (
    <AbsoluteFill>
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
    </AbsoluteFill>
  );
};

const DEMO_PHRASE: Record<Lang, string> = {
  en: 'I built this with AI in ten minutes and today I show you how.',
  es: 'Esto lo hice con IA en diez minutos y hoy te enseño cómo.',
};

/** Sample phrase (until you transcribe your voice): one word every 0.32 s. */
export const demoWords = (lang: Lang): CaptionWord[] =>
  DEMO_PHRASE[lang].split(' ').map((text, i) => ({ text, startMs: 200 + i * 320, endMs: 200 + i * 320 + 300 }));

export const captionDefaults: CaptionsSettings = {
  words: demoWords('en'),
  wordsFor: '',
  captionStyle: 'bold',
  perPage: 'auto',
  highlight: 'style',
  heightPct: 66,
  size: 1,
  offsetMs: 0,
};

/** Style controls (the transcript has its own editor in the app). */
export const captionParams: ParamDef[] = [
  {
    key: 'captionStyle',
    label: { en: 'Style', es: 'Estilo' },
    type: 'select',
    options: [
      { value: 'bold', label: { en: 'Bold yellow', es: 'Amarillo grueso' } },
      { value: 'comic', label: { en: 'Comic', es: 'Cómic' } },
      { value: 'karaoke', label: 'Karaoke' },
      { value: 'pop', label: 'Pop' },
      { value: 'clean', label: { en: 'Clean', es: 'Limpio' } },
      { value: 'editorial', label: 'Editorial' },
    ],
  },
  {
    key: 'perPage',
    label: { en: 'Words at a time', es: 'Palabras a la vez' },
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
    label: { en: 'Active word color', es: 'Color de la palabra activa' },
    type: 'select',
    options: [
      { value: 'style', label: { en: 'From style', es: 'Del estilo' } },
      { value: 'yellow', label: { en: 'Yellow', es: 'Amarillo' } },
      { value: 'green', label: { en: 'Green', es: 'Verde' } },
      { value: 'mint', label: { en: 'Mint', es: 'Menta' } },
      { value: 'violet', label: { en: 'Violet', es: 'Violeta' } },
      { value: 'blue', label: { en: 'Blue', es: 'Azul' } },
      { value: 'red', label: { en: 'Red', es: 'Rojo' } },
    ],
  },
  { key: 'heightPct', label: { en: 'Height on screen (%)', es: 'Altura en pantalla (%)' }, type: 'number', min: 15, max: 82, step: 1 },
  { key: 'size', label: { en: 'Size', es: 'Tamaño' }, type: 'number', min: 0.5, max: 1.6, step: 0.05 },
  { key: 'offsetMs', label: { en: 'Shift earlier / later (ms)', es: 'Adelantar / atrasar (ms)' }, type: 'number', min: -600, max: 600, step: 10 },
];
