// Aurora UI (identidad de chitodev). Todo color de la biblioteca sale de aquí.
export const aurora = {
  base: '#0a0b0d',
  surface: '#131519',
  text: '#eceff2',
  muted: '#8b929c',
  mint: '#5fd6b2',
  blue: '#6fb4ff',
  violet: '#b495ff',
  red: '#ff4f4a',
} as const;

export type PaletteColor = 'mint' | 'blue' | 'violet' | 'red' | 'text';
export const paletteColors: PaletteColor[] = ['mint', 'blue', 'violet', 'red', 'text'];
export const colorOf = (c: PaletteColor): string => aurora[c];

// Fuentes del sistema (Windows 11): no requieren descarga y el render en Chrome headless
// usa exactamente las mismas que la vista previa en esta PC.
export const fonts = {
  sans: '"Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: '"Cascadia Code", Consolas, monospace',
} as const;

export const handle = '@chito.dev';
