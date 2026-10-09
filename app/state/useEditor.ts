// All of the editor's state in one place: which effect, its settings, your media, time, captions and background,
// plus the props the preview and the export receive. The layout components only read and set it.
import { useEffect, useMemo, useRef, useState } from 'react';
import { baseDefaults, canvasOf, defaultsFor, durationInFrames, findEffect } from '../../src/registry.ts';
import type { BaseProps, MediaRef } from '../../src/lib/types.ts';
import { captionDefaults, demoWords, type CaptionsSettings } from '../../src/components/captions.tsx';
import type { CaptionWord } from '../../src/lib/captions.ts';
import { compatibility, hasTimeline, onVideoOf, planTimeline } from '../../src/lib/timeline.ts';
import { bgDefaults, type BgProps } from '../../src/lib/background.ts';
import { listMedia, uploadMedia } from '../api.ts';
import { useLang } from '../i18n.tsx';
import { fromSaved, toSaved, type InspectorTab, type Saved } from './saved.ts';

/** Where the effect starts inside your video (stored per effect; can't clash with the effect's params). */
export const AT = '__startSec';

const STORAGE_KEY = 'editor';
const DEFAULT_EFFECT = 'focus-snap';

const readSaved = (): Partial<Saved> => {
  try {
    return fromSaved(localStorage.getItem(STORAGE_KEY), (id) => !!findEffect(id)) ?? {};
  } catch {
    // Private mode or blocked storage: start fresh.
    return {};
  }
};

export const useEditor = () => {
  const { lang } = useLang();
  const saved = useRef(readSaved()).current;

  const [effectId, setEffectId] = useState(saved.effectId ?? DEFAULT_EFFECT);
  const [overrides, setOverrides] = useState<Saved['overrides']>(saved.overrides ?? {});
  const [media, setMedia] = useState<MediaRef[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaRef | null>(null);
  const [fps, setFps] = useState<30 | 60>(saved.fps ?? 30);
  const [speed, setSpeed] = useState(saved.speed ?? 1);
  const [transparent, setTransparent] = useState(saved.transparent ?? false);
  const [bg, setBg] = useState<BgProps>(saved.bg ?? bgDefaults);
  /** "Apply to my video" (lasts your whole video) or "Effect only" (standalone clip for an editor). */
  const [mode, setMode] = useState<'video' | 'clip'>(saved.mode ?? 'video');
  const [captionsOn, setCaptionsOn] = useState(saved.captionsOn ?? false);
  const [captions, setCaptions] = useState<CaptionsSettings>({ ...captionDefaults, ...(saved.captions as Partial<CaptionsSettings>) });
  /** Transcript per file: switching video or audio, each keeps its own. */
  const [transcripts, setTranscripts] = useState<Record<string, CaptionWord[]>>(saved.transcripts ?? {});
  const [tab, setTab] = useState<InspectorTab>(saved.tab ?? 'effect');
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const def = findEffect(effectId) ?? findEffect(DEFAULT_EFFECT)!;
  const own = overrides[effectId] ?? {};
  const setOwn = (key: string, value: unknown) =>
    setOverrides((o) => ({ ...o, [effectId]: { ...o[effectId], [key]: value } }));
  const resetOwn = () => setOverrides((o) => ({ ...o, [effectId]: {} }));

  const onVideo = onVideoOf(def);
  const main = selectedMedia;
  const hasVoice = main?.kind === 'video' || main?.kind === 'audio';
  // Until you transcribe this file, the sample phrase shows (in the UI language).
  const mine = main ? transcripts[main.name] : undefined;
  const shownCaptions: CaptionsSettings = mine
    ? { ...captions, words: mine, wordsFor: main!.name }
    : { ...captions, words: demoWords(lang), wordsFor: '' };
  const effectSec = Number(own.durationSec ?? def.defaultDurationSec);
  // Audio always gets a timeline (a standalone clip would have no picture); video only with "Apply".
  const timed = hasTimeline(main) && onVideo !== 'none' && (mode === 'video' || main.kind === 'audio');
  const timeline = timed
    ? planTimeline({ onVideo, totalSec: main.durationSec, effectSec, startSec: own[AT] as number | undefined, defaultAt: def.defaultAt })
    : null;

  const props = useMemo(
    () =>
      ({
        ...baseDefaults(def),
        ...defaultsFor(def, lang),
        ...own,
        // In a standalone clip audio has no picture: the sample screen shows.
        media: main?.kind === 'audio' && !timed ? null : main,
        fps,
        speed,
        transparent,
        ...bg,
        durationSec: timed ? main.durationSec : effectSec,
        timeline,
        captions: captionsOn && hasVoice ? shownCaptions : null,
      }) as BaseProps & Record<string, unknown>,
    [def, lang, own, main, fps, speed, transparent, bg, timed, effectSec, timeline?.startSec, timeline?.effectSec, captionsOn, captions, mine, hasVoice],
  );
  const canvas = canvasOf(def, props);
  const total = durationInFrames(props);
  const effectFrom = timeline ? Math.round(timeline.startSec * fps) : 0;

  // Your files, and the one you had picked last time (if it's still there).
  useEffect(() => {
    listMedia()
      .then((list) => {
        setMedia(list);
        if (saved.mediaName) setSelectedMedia(list.find((m) => m.name === saved.mediaName) ?? null);
      })
      .catch(() => undefined);
  }, []);

  // Audio only can't take effects that need a picture: switch to "No effect".
  useEffect(() => {
    if (compatibility(onVideo, def.group, main)) setEffectId('no-effect');
  }, [main]);

  // Remember everything (debounced: dragging a slider writes once it settles).
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const data = toSaved({
          effectId,
          overrides,
          mediaName: selectedMedia?.name ?? null,
          fps,
          speed,
          transparent,
          bg,
          mode,
          captionsOn,
          captions: captions as unknown as Record<string, unknown>,
          transcripts,
          tab,
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // Storage full or blocked: settings just aren't remembered.
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [effectId, overrides, selectedMedia, fps, speed, transparent, bg, mode, captionsOn, captions, transcripts, tab]);

  const onFiles = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    setNotice(null);
    try {
      let last: MediaRef | null = null;
      for (const f of files) last = await uploadMedia(f);
      setMedia(await listMedia());
      if (last) setSelectedMedia(last);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return {
    def,
    effectId,
    setEffectId,
    own,
    setOwn,
    resetOwn,
    onVideo,
    media,
    main,
    setSelectedMedia,
    onFiles,
    uploading,
    notice,
    fps,
    setFps,
    speed,
    setSpeed,
    transparent,
    setTransparent,
    bg,
    setBg,
    mode,
    setMode,
    hasVoice,
    captionsOn,
    setCaptionsOn,
    captions,
    setCaptions,
    shownCaptions,
    setTranscripts,
    tab,
    setTab,
    effectSec,
    timeline,
    props,
    canvas,
    total,
    effectFrom,
  };
};

export type Editor = ReturnType<typeof useEditor>;
