// Every effect in the library, in the order the app lists them, plus the helpers that give each one its props.
// To add an effect: create it under src/effects/ and add it to `effects` below.
import { bgDefaults } from './lib/background.ts';
import type { Lang } from './lib/i18n.ts';
import type { BaseProps, EffectDef } from './lib/types.ts';
import { HEIGHT, WIDTH } from './lib/frame.ts';
import { noEffect } from './effects/NoEffect.tsx';
import { arrowCircle } from './effects/hooks/ArrowCircle.tsx';
import { beforeAfterCut } from './effects/hooks/BeforeAfterCut.tsx';
import { focusSnap } from './effects/hooks/FocusSnap.tsx';
import { glitch } from './effects/hooks/Glitch.tsx';
import { notification } from './effects/hooks/Notification.tsx';
import { promptTyping } from './effects/hooks/PromptTyping.tsx';
import { punchZoom } from './effects/hooks/PunchZoom.tsx';
import { redStrike } from './effects/hooks/RedStrike.tsx';
import { stopwatch } from './effects/hooks/Stopwatch.tsx';
import { textDrop } from './effects/hooks/TextDrop.tsx';
import { window3D } from './effects/hooks/Window3D.tsx';
import { freezeFrame } from './effects/hooks/FreezeFrame.tsx';
import { spotlight } from './effects/hooks/Spotlight.tsx';
import { cursorClick } from './effects/hooks/CursorClick.tsx';
import { beforeAfterWipe } from './effects/support/BeforeAfterWipe.tsx';
import { bigNumber } from './effects/support/BigNumber.tsx';
import { endCard } from './effects/support/EndCard.tsx';
import { floatingWindow } from './effects/support/FloatingWindow.tsx';
import { mysteryCards } from './effects/support/MysteryCards.tsx';
import { splitScreen } from './effects/support/SplitScreen.tsx';
import { textCard } from './effects/support/TextCard.tsx';
import { commentReply } from './effects/support/CommentReply.tsx';
import { topList } from './effects/support/TopList.tsx';
import { poll } from './effects/support/Poll.tsx';
import { namelessIdea } from './effects/pieces/NamelessIdea.tsx';
import { collectMods } from './lib/mods.ts';
import { modules } from '../mods/index.generated.ts';

const core: EffectDef<any>[] = [
  // Your video as is (to add captions only)
  noEffect,
  // A. Visual hooks (0–2 s)
  focusSnap,
  punchZoom,
  textDrop,
  window3D,
  arrowCircle,
  beforeAfterCut,
  glitch,
  notification,
  redStrike,
  promptTyping,
  stopwatch,
  freezeFrame,
  spotlight,
  cursorClick,
  // B. Support effects
  floatingWindow,
  splitScreen,
  beforeAfterWipe,
  bigNumber,
  textCard,
  endCard,
  mysteryCards,
  commentReply,
  topList,
  poll,
  // C. Animated pieces (they don't go over a video)
  namelessIdea,
];

/** Effects from the mods/ folder that load fine, and the ones that don't (with the reason). */
const mods = collectMods(modules, core.map((e) => e.id));
export const modProblems = mods.problems;

export const effects: EffectDef<any>[] = [...core, ...mods.effects];

export const findEffect = (id: string): EffectDef<any> | undefined => effects.find((e) => e.id === id);

export { WIDTH, HEIGHT } from './lib/frame.ts';

/** Canvas size of an effect with these props (vertical 1080×1920 unless the effect says otherwise). */
export const canvasOf = (def: EffectDef<any>, props: Record<string, unknown>) =>
  def.canvas?.(props) ?? { width: WIDTH, height: HEIGHT };

export const baseDefaults = (def: EffectDef<any>): BaseProps => ({
  media: null,
  durationSec: def.defaultDurationSec,
  fps: 30,
  speed: 1,
  transparent: false,
  timeline: null,
  captions: null,
  ...bgDefaults,
});

/** The effect's own defaults, with the sample texts in `lang`. */
export const defaultsFor = (def: EffectDef<any>, lang: Lang): Record<string, unknown> => ({
  ...def.defaults,
  ...def.localized?.[lang],
});

export const durationInFrames = (p: Pick<BaseProps, 'durationSec' | 'fps'>): number =>
  Math.max(1, Math.round(p.durationSec * p.fps));
