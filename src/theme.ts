// Aurora palette and fonts. Every color in the library comes from here.
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

// System fonts (Windows 11): nothing to download, and the headless Chrome render uses exactly the same
// fonts as the preview on the same PC. On macOS or Linux the fallbacks kick in and look slightly different.
export const fonts = {
  sans: '"Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: '"Cascadia Code", Consolas, monospace',
} as const;

/** Sample @handle for the cards; you edit it in the app. */
export const handle = '@your.handle';
