// What the app remembers between sessions (in this browser only): your last effect, its settings, the background,
// captions style and transcripts. Pure logic, no React or DOM, so it can be tested with node --test.
import type { BgProps } from '../../src/lib/background.ts';
import type { CaptionWord } from '../../src/lib/captions.ts';

export type InspectorTab = 'effect' | 'time' | 'captions' | 'background';

export type Saved = {
  v: 1;
  effectId: string;
  /** Each effect's own settings, by effect id. */
  overrides: Record<string, Record<string, unknown>>;
  mediaName: string | null;
  fps: 30 | 60;
  speed: number;
  transparent: boolean;
  bg: BgProps;
  mode: 'video' | 'clip';
  captionsOn: boolean;
  /** Caption style settings (without the words: those are in `transcripts`). */
  captions: Record<string, unknown>;
  /** Transcript per file name: Whisper takes a while, so it isn't lost on reload. */
  transcripts: Record<string, CaptionWord[]>;
  tab: InspectorTab;
};

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** A second video or image picked in a param: not remembered, the file may be gone next time. */
const isMediaValue = (v: unknown) => isObject(v) && typeof v.src === 'string';

/** Copy of the state that's safe to store: no media references, no words inside the captions settings. */
export const toSaved = (s: Omit<Saved, 'v'>): Saved => ({
  ...s,
  v: 1,
  overrides: Object.fromEntries(
    Object.entries(s.overrides).map(([id, o]) => [id, Object.fromEntries(Object.entries(o).filter(([, v]) => !isMediaValue(v)))]),
  ),
  captions: Object.fromEntries(Object.entries(s.captions).filter(([k]) => k !== 'words' && k !== 'wordsFor')),
});

/**
 * Reads what was stored, keeping only what still makes sense: an unknown effect, a broken value or an old
 * version falls back to the defaults (null = nothing usable).
 */
export const fromSaved = (raw: string | null, knownEffect: (id: string) => boolean): Partial<Saved> | null => {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObject(data) || data.v !== 1) return null;
  const out: Partial<Saved> = {};
  if (typeof data.effectId === 'string' && knownEffect(data.effectId)) out.effectId = data.effectId;
  if (isObject(data.overrides)) {
    out.overrides = Object.fromEntries(
      Object.entries(data.overrides).filter(([id, o]) => knownEffect(id) && isObject(o)),
    ) as Saved['overrides'];
  }
  if (typeof data.mediaName === 'string' || data.mediaName === null) out.mediaName = data.mediaName as string | null;
  if (data.fps === 30 || data.fps === 60) out.fps = data.fps;
  if (typeof data.speed === 'number' && data.speed >= 0.25 && data.speed <= 3) out.speed = data.speed;
  if (typeof data.transparent === 'boolean') out.transparent = data.transparent;
  if (isObject(data.bg) && typeof data.bg.bg === 'string' && Array.isArray(data.bg.bgColors)) out.bg = data.bg as BgProps;
  if (data.mode === 'video' || data.mode === 'clip') out.mode = data.mode;
  if (typeof data.captionsOn === 'boolean') out.captionsOn = data.captionsOn;
  if (isObject(data.captions)) out.captions = data.captions;
  if (isObject(data.transcripts)) {
    out.transcripts = Object.fromEntries(
      Object.entries(data.transcripts).filter(([, w]) => Array.isArray(w)),
    ) as Saved['transcripts'];
  }
  if (data.tab === 'effect' || data.tab === 'time' || data.tab === 'captions' || data.tab === 'background') out.tab = data.tab;
  return out;
};
