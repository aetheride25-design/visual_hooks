import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { baseDefaults, canvasOf, defaultsFor, durationInFrames, effects, findEffect, shells } from '../src/registry.tsx';
import type { BaseProps, MediaRef } from '../src/lib/types.ts';
import { mediaRect } from '../src/components/media.tsx';
import { captionDefaults, captionParams, demoWords, type CaptionsSettings } from '../src/components/captions.tsx';
import type { CaptionWord } from '../src/lib/captions.ts';
import { FRAME } from '../src/lib/frame.ts';
import { tr } from '../src/lib/i18n.ts';
import { fitRect, pointToMedia, type Fit } from '../src/lib/layout.ts';
import { compatibility, hasTimeline, onVideoOf, planTimeline } from '../src/lib/timeline.ts';
import { bgDefaults, type BgProps } from '../src/lib/background.ts';
import { listMedia, uploadMedia } from './api.ts';
import { LangSwitch, useLang } from './i18n.tsx';
import { BackgroundPanel } from './panels/background.tsx';
import { CaptionsEditor } from './panels/captions.tsx';
import { EffectList } from './panels/effects.tsx';
import { ExportPanel } from './panels/export.tsx';
import { Field } from './panels/field.tsx';
import { MediaPanel } from './panels/media.tsx';
import { FrameBar, TimelineBar } from './panels/preview.tsx';

type Overrides = Record<string, Record<string, unknown>>;

/** Where the effect starts inside your video (stored per effect; can't clash with the effect's params). */
const AT = '__startSec';

export const App: React.FC = () => {
  const { lang, t } = useLang();
  const [effectId, setEffectId] = useState('focus-snap');
  const [overrides, setOverrides] = useState<Overrides>({});
  const [media, setMedia] = useState<MediaRef[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaRef | null>(null);
  const [fps, setFps] = useState<30 | 60>(30);
  const [speed, setSpeed] = useState(1);
  const [transparent, setTransparent] = useState(false);
  const [bg, setBg] = useState<BgProps>(bgDefaults);
  /** "Apply to my video" (lasts your whole video) or "Effect only" (standalone clip for DaVinci). */
  const [mode, setMode] = useState<'video' | 'clip'>('video');
  const [captionsOn, setCaptionsOn] = useState(false);
  const [captions, setCaptions] = useState<CaptionsSettings>(captionDefaults);
  /** Transcript per file: switching video or audio, each keeps its own. */
  const [transcripts, setTranscripts] = useState<Record<string, CaptionWord[]>>({});
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const player = useRef<PlayerRef>(null);

  const def = findEffect(effectId)!;
  const name = tr(def.name, lang);
  const own = overrides[effectId] ?? {};
  const setOwn = (key: string, value: unknown) =>
    setOverrides((o) => ({ ...o, [effectId]: { ...o[effectId], [key]: value } }));

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

  useEffect(() => {
    listMedia().then(setMedia).catch(() => undefined);
  }, []);

  // Audio only can't take effects that need a picture: switch to "No effect".
  useEffect(() => {
    if (compatibility(onVideo, def.group, main)) setEffectId('no-effect');
  }, [main]);

  // Picking an effect shows it applied right away, from where it starts.
  useEffect(() => {
    setPicking(false);
    player.current?.seekTo(effectFrom);
    player.current?.play();
  }, [effectId]);

  // Pick the zoom point with a click: shows the effect's first frame, before the capture moves.
  const hasFocus = def.params.some((p) => p.key === 'focusX');
  const [picking, setPicking] = useState(false);
  const startPicking = () => {
    player.current?.pause();
    player.current?.seekTo(effectFrom);
    setPicking((v) => !v);
  };
  const onPick = (e: React.MouseEvent<HTMLDivElement>) => {
    // The Player fits the canvas inside the container (letterboxed if the ratio differs).
    const box = e.currentTarget.getBoundingClientRect();
    const view = fitRect(canvas.width, canvas.height, { x: box.left, y: box.top, w: box.width, h: box.height }, 'contain');
    const x = ((e.clientX - view.x) / view.w) * canvas.width;
    const y = ((e.clientY - view.y) / view.h) * canvas.height;
    const { fx, fy } = pointToMedia(mediaRect(props.media, FRAME, (props.fit as Fit) ?? 'contain'), x, y);
    setOwn('focusX', fx);
    setOwn('focusY', fy);
    setPicking(false);
    player.current?.play();
  };

  // Main video picker inside the effect panel (e.g. "Bottom shot" in Split screen).
  const firstMediaParam = def.params.find((p) => p.type === 'media')?.key;
  const mainMediaField = def.mediaLabel ? (
    <Field
      def={{ key: 'media', label: def.mediaLabel, type: 'media' }}
      media={media}
      value={selectedMedia}
      onChange={(v) => setSelectedMedia(v as MediaRef | null)}
    />
  ) : null;

  const onFiles = async (files: File[]) => {
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

  const seekMs = (ms: number) => {
    player.current?.pause();
    player.current?.seekTo(Math.round((ms / 1000) * fps));
  };
  const kind = main?.kind === 'audio' ? 'audio' : 'video';

  return (
    <div className="app">
      <aside className="col left">
        <header className="brand">
          <span className="dot" /> {t('brand')}
          <LangSwitch />
        </header>
        <MediaPanel
          media={media}
          selected={selectedMedia}
          onSelect={setSelectedMedia}
          onFiles={onFiles}
          uploading={uploading}
        />
        {notice && <div className="job error">{notice}</div>}
        <EffectList effects={effects} selected={effectId} media={main} onSelect={setEffectId} />
      </aside>

      <main className={`stage ${timeline ? 'timed' : ''}`}>
        <div className={`phone ${transparent ? 'checker' : ''}`} style={{ aspectRatio: `${canvas.width} / ${canvas.height}` }}>
          <Player
            ref={player}
            component={shells[effectId]}
            inputProps={props}
            durationInFrames={total}
            fps={fps}
            compositionWidth={canvas.width}
            compositionHeight={canvas.height}
            style={{ width: '100%', height: '100%' }}
            controls
            loop
            autoPlay
            clickToPlay
            spaceKeyToPlayOrPause
            acknowledgeRemotionLicense
          />
          {picking && (
            <div className="picker" onClick={onPick}>
              <span>{t('pickHere')}</span>
            </div>
          )}
        </div>
        {timeline && (
          <TimelineBar
            player={player}
            totalSec={props.durationSec}
            startSec={timeline.startSec}
            effectSec={timeline.effectSec}
            fps={fps}
            label={name}
            movable={onVideo !== 'full'}
            onMove={(s) => setOwn(AT, s)}
          />
        )}
        <FrameBar player={player} total={total} fps={fps} />
      </main>

      <aside className="col right">
        <section className="panel">
          <h2>{name}</h2>
          <p className="desc">{tr(def.description, lang)}</p>
          {hasFocus && (
            <button className={`primary ghost pick ${picking ? 'on' : ''}`} onClick={startPicking}>
              {picking ? t('picking') : t('pickPoint')}
            </button>
          )}
          {def.params.map((p) => (
            <React.Fragment key={p.key}>
              <Field def={p} media={media} value={props[p.key]} onChange={(v) => setOwn(p.key, v)} />
              {/* Your main video goes right below the other shot, to pick both together. */}
              {p.key === firstMediaParam && mainMediaField}
            </React.Fragment>
          ))}
          {!firstMediaParam && mainMediaField}
        </section>

        <section className="panel">
          <h2>{t('time')}</h2>
          {main?.kind === 'video' && onVideo !== 'none' && (
            <Field
              def={{
                key: 'mode',
                label: t('whatExport'),
                type: 'select',
                options: [
                  { value: 'video', label: t('modeVideo') },
                  { value: 'clip', label: t('modeClip') },
                ],
              }}
              media={media}
              value={mode}
              onChange={(v) => setMode(v as 'video' | 'clip')}
            />
          )}
          {timeline ? (
            <>
              <p className="desc">
                {onVideo === 'full'
                  ? t('timedFull', { kind, d: props.durationSec.toFixed(1) })
                  : t('timedMoment', {
                      kind,
                      d: props.durationSec.toFixed(1),
                      from: timeline.startSec.toFixed(1),
                      to: (timeline.startSec + timeline.effectSec).toFixed(1),
                    })}
              </p>
              {onVideo !== 'full' && (
                <>
                  <Field
                    def={{ key: AT, label: t('startsAt'), type: 'number', min: 0, max: Math.max(0, props.durationSec - timeline.effectSec), step: 0.1 }}
                    media={media}
                    value={timeline.startSec}
                    onChange={(v) => setOwn(AT, v)}
                  />
                  <Field
                    def={{ key: 'durationSec', label: t('effectDuration'), type: 'number', min: 0.5, max: Math.min(10, props.durationSec), step: 0.1 }}
                    media={media}
                    value={timeline.effectSec}
                    onChange={(v) => setOwn('durationSec', v)}
                  />
                </>
              )}
            </>
          ) : (
            <>
              <p className="desc">
                {onVideo === 'none'
                  ? t('untimedPiece')
                  : main?.kind === 'image'
                    ? t('untimedImage')
                    : main?.kind === 'video'
                      ? t('untimedClip')
                      : t('untimedNone')}
              </p>
              <Field
                def={{ key: 'durationSec', label: t('duration'), type: 'number', min: 0.5, max: 10, step: 0.1 }}
                media={media}
                value={effectSec}
                onChange={(v) => setOwn('durationSec', v)}
              />
            </>
          )}
          {def.id !== 'no-effect' && (
            <Field
              def={{ key: 'speed', label: t('speed'), type: 'number', min: 0.25, max: 3, step: 0.05 }}
              media={media}
              value={speed}
              onChange={(v) => setSpeed(v as number)}
            />
          )}
          <Field
            def={{
              key: 'fps',
              label: t('fps'),
              type: 'select',
              options: [
                { value: '30', label: '30 fps' },
                { value: '60', label: '60 fps' },
              ],
            }}
            media={media}
            value={String(fps)}
            onChange={(v) => setFps(Number(v) as 30 | 60)}
          />
          <Field
            def={{ key: 'transparent', label: timeline ? t('hideVideo') : t('transparentBg'), type: 'boolean' }}
            media={media}
            value={transparent}
            onChange={(v) => setTransparent(Boolean(v))}
          />
        </section>

        <section className="panel">
          <h2>{t('captions')}</h2>
          {hasVoice ? (
            <>
              <Field
                def={{ key: 'captionsOn', label: t('captionsOn'), type: 'boolean' }}
                media={media}
                value={captionsOn}
                onChange={(v) => setCaptionsOn(Boolean(v))}
              />
              {captionsOn && (
                <>
                  <CaptionsEditor
                    video={main}
                    words={shownCaptions.words}
                    wordsFor={shownCaptions.wordsFor}
                    offsetMs={captions.offsetMs}
                    onChange={(words, wordsFor) => setTranscripts((ts) => ({ ...ts, [wordsFor]: words }))}
                    onSeek={seekMs}
                  />
                  {captionParams.map((p) => (
                    <Field
                      key={p.key}
                      def={p}
                      media={media}
                      value={captions[p.key as keyof CaptionsSettings]}
                      onChange={(v) => setCaptions((c) => ({ ...c, [p.key]: v }))}
                    />
                  ))}
                </>
              )}
            </>
          ) : (
            <p className="desc">{t('captionsNeedVoice')}</p>
          )}
        </section>

        <BackgroundPanel value={bg} onChange={setBg} transparent={transparent} />
        <ExportPanel effectId={effectId} effectName={name} props={props} size={canvas} timed={!!timeline} />
      </aside>
    </div>
  );
};
