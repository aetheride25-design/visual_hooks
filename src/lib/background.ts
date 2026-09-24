// Fondos animados: qué estilos hay y con qué colores se pintan. Lógica pura, sin React,
// para poder probarla con node --test.
import { aurora } from '../brand.ts';

export type BgStyle = 'aurora' | 'puntos' | 'gradiente' | 'rejilla' | 'grano' | 'codigo' | 'solido';
export type BgTint = 'marca' | 'mint' | 'blue' | 'violet' | 'red' | 'custom';

export const bgStyles: { value: BgStyle; label: string }[] = [
  { value: 'aurora', label: 'Aurora' },
  { value: 'puntos', label: 'Puntos' },
  { value: 'gradiente', label: 'Gradiente' },
  { value: 'rejilla', label: 'Rejilla' },
  { value: 'grano', label: 'Grano' },
  { value: 'codigo', label: 'Código' },
  { value: 'solido', label: 'Sólido' },
];

export const bgTints: { value: BgTint; label: string }[] = [
  { value: 'marca', label: 'Marca' },
  { value: 'mint', label: 'Menta' },
  { value: 'blue', label: 'Azul' },
  { value: 'violet', label: 'Violeta' },
  { value: 'red', label: 'Rojo' },
  { value: 'custom', label: 'Personalizado' },
];

/** Props del fondo que viajan con cada efecto (vista previa y export). */
export type BgProps = {
  bg: BgStyle;
  bgTint: BgTint;
  /** Solo con bgTint = 'custom': color de fondo y los tres colores de luz. */
  bgBase: string;
  bgColors: [string, string, string];
};

export const bgDefaults: BgProps = {
  bg: 'aurora',
  bgTint: 'marca',
  bgBase: aurora.base,
  bgColors: [aurora.mint, aurora.blue, aurora.violet],
};

export type BgPalette = { base: string; colors: [string, string, string] };

const HEX = /^#[0-9a-f]{6}$/i;
/** Los fondos le pegan alfa al final (`${color}40`), así que solo aceptamos #rrggbb. */
const hexOr = (value: unknown, fallback: string): string =>
  typeof value === 'string' && HEX.test(value) ? value.toLowerCase() : fallback;

export const bgPalette = (p: Partial<BgProps>): BgPalette => {
  const tint = p.bgTint ?? 'marca';
  if (tint === 'custom') {
    const c = Array.isArray(p.bgColors) ? p.bgColors : bgDefaults.bgColors;
    return {
      base: hexOr(p.bgBase, aurora.base),
      colors: [hexOr(c[0], aurora.mint), hexOr(c[1], aurora.blue), hexOr(c[2], aurora.violet)],
    };
  }
  if (tint === 'marca') return { base: aurora.base, colors: [aurora.mint, aurora.blue, aurora.violet] };
  const one = aurora[tint];
  return { base: aurora.base, colors: [one, one, one] };
};

/** Semilla entera que cambia `perSec` veces por segundo: el grano "vive" sin Math.random. */
export const grainSeed = (t: number, perSec = 24): number => Math.floor(Math.max(0, t) * perSec) % 997;
