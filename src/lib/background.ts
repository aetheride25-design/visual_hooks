// Animated backgrounds: which styles exist and which colors paint them. Pure logic, no React,
// so it can be tested with node --test.
import { aurora } from '../theme.ts';
import type { Text } from './i18n.ts';

export type BgStyle = 'aurora' | 'dots' | 'gradient' | 'grid' | 'grain' | 'code' | 'solid';
export type BgTint = 'brand' | 'mint' | 'blue' | 'violet' | 'red' | 'custom';

export const bgStyles: { value: BgStyle; label: Text }[] = [
  { value: 'aurora', label: { en: 'Aurora', es: 'Aurora' } },
  { value: 'dots', label: { en: 'Dots', es: 'Puntos' } },
  { value: 'gradient', label: { en: 'Gradient', es: 'Gradiente' } },
  { value: 'grid', label: { en: 'Grid', es: 'Rejilla' } },
  { value: 'grain', label: { en: 'Grain', es: 'Grano' } },
  { value: 'code', label: { en: 'Code', es: 'Código' } },
  { value: 'solid', label: { en: 'Solid', es: 'Sólido' } },
];

export const bgTints: { value: BgTint; label: Text }[] = [
  { value: 'brand', label: { en: 'Aurora', es: 'Aurora' } },
  { value: 'mint', label: { en: 'Mint', es: 'Menta' } },
  { value: 'blue', label: { en: 'Blue', es: 'Azul' } },
  { value: 'violet', label: { en: 'Violet', es: 'Violeta' } },
  { value: 'red', label: { en: 'Red', es: 'Rojo' } },
  { value: 'custom', label: { en: 'Custom', es: 'Personalizado' } },
];

/** Background props that travel with every effect (preview and export). */
export type BgProps = {
  bg: BgStyle;
  bgTint: BgTint;
  /** Only with bgTint = 'custom': background color and the three light colors. */
  bgBase: string;
  bgColors: [string, string, string];
};

export const bgDefaults: BgProps = {
  bg: 'aurora',
  bgTint: 'brand',
  bgBase: aurora.base,
  bgColors: [aurora.mint, aurora.blue, aurora.violet],
};

export type BgPalette = { base: string; colors: [string, string, string] };

const HEX = /^#[0-9a-f]{6}$/i;
/** Backgrounds append alpha at the end (`${color}40`), so only #rrggbb is accepted. */
const hexOr = (value: unknown, fallback: string): string =>
  typeof value === 'string' && HEX.test(value) ? value.toLowerCase() : fallback;

export const bgPalette = (p: Partial<BgProps>): BgPalette => {
  const tint = p.bgTint ?? 'brand';
  if (tint === 'custom') {
    const c = Array.isArray(p.bgColors) ? p.bgColors : bgDefaults.bgColors;
    return {
      base: hexOr(p.bgBase, aurora.base),
      colors: [hexOr(c[0], aurora.mint), hexOr(c[1], aurora.blue), hexOr(c[2], aurora.violet)],
    };
  }
  if (tint === 'brand') return { base: aurora.base, colors: [aurora.mint, aurora.blue, aurora.violet] };
  const one = aurora[tint];
  return { base: aurora.base, colors: [one, one, one] };
};

/** Integer seed that changes `perSec` times per second: the grain "moves" without Math.random. */
export const grainSeed = (t: number, perSec = 24): number => Math.floor(Math.max(0, t) * perSec) % 997;
