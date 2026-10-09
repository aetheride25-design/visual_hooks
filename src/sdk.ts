// The toolkit for mods (and for new built-in effects): everything an effect needs, from one import.
//   import { timeOf, progress, MediaBackdrop, type EffectDef } from '../../src/sdk.ts';
// What's exported here is kept stable so mods keep working when the app changes. See docs/mods.md.

// Types
export type { BaseProps, EffectDef, EffectGroup, MediaRef, OnVideo, ParamDef } from './lib/types.ts';
export type { Label, Lang, Text } from './lib/i18n.ts';
export type { Fit, Rect } from './lib/layout.ts';
export type { PaletteColor } from './theme.ts';

// The frame (1080×1920) and the palette
export { FRAME, HEIGHT, WIDTH } from './lib/frame.ts';
export { aurora, colorOf, fonts, paletteColors } from './theme.ts';

// Animation math: everything depends on `t`, the effect's time in seconds
export {
  clamp01,
  countValue,
  cursorOn,
  easeInExpo,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  easeOutExpo,
  formatClock,
  formatNumber,
  lerp,
  progress,
  shake,
  timeOf,
  typedText,
  typingEnd,
} from './lib/anim.ts';
export { hash01 } from './lib/particles.ts';
export { handArrow, handEllipse, polylineLength, toPath, type Pt } from './lib/sketch.ts';
export { parseLines, parseWords, type Word } from './lib/text.ts';

// Placing your video or image in the frame, and zooming toward a point of it
export { cameraTransform, fitRect, pointIn } from './lib/layout.ts';

// Building blocks the built-in effects use
export { MediaBackdrop } from './components/backdrop.tsx';
export { cardStyle, Media, MediaAt, mediaRect, Pill } from './components/media.tsx';
export { KineticText, wordCount, type WordEntrance } from './components/text.tsx';
export { AppWindow, windowSize } from './components/window.tsx';
export { StampLabel } from './components/labels.tsx';
