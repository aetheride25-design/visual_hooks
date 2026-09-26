import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { baseDefaults, canvasOf, durationInFrames, effects, findEffect, shells } from '../src/registry.tsx';
import type { BaseProps, MediaRef } from '../src/lib/types.ts';
import { mediaRect } from '../src/components/brand.tsx';
import { captionDefaults, captionParams, type CaptionsSettings } from '../src/components/captions.tsx';
import type { CaptionWord } from '../src/lib/captions.ts';
import { FRAME } from '../src/lib/frame.ts';
import { fitRect, pointToMedia, type Fit } from '../src/lib/layout.ts';
import { compatibility, hasTimeline, onVideoOf, planTimeline } from '../src/lib/timeline.ts';
import { listMedia, uploadMedia } from './api.ts';
import { CaptionsEditor, EffectList, ExportPanel, Field, FrameBar, MediaPanel, TimelineBar } from './panels.tsx';
import { BackgroundPanel } from './background-panel.tsx';
import { bgDefaults, type BgProps } from '../src/lib/background.ts';

type Overrides = Record<string, Record<string, unknown>>;

/** Dónde empieza el efecto dentro de tu video (se guarda por efecto; no choca con los parámetros del efecto). */
const AT = '__startSec';

export const App: React.FC = () => {
  const [effectId, setEffectId] = useState('enfoque-golpe');
  const [overrides, setOverrides] = useState<Overrides>({});
  const [media, setMedia] = useState<MediaRef[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaRef | null>(null);
  const [fps, setFps] = useState<30 | 60>(30);
  const [speed, setSpeed] = useState(1);
  const [transparent, setTransparent] = useState(false);
  const [bg, setBg] = useState<BgProps>(bgDefaults);
  /** "Aplicar a mi video" (dura todo tu video) o "Solo el efecto" (clip suelto para DaVinci). */
  const [mode, setMode] = useState<'video' | 'clip'>('video');
  const [captionsOn, setCaptionsOn] = useState(false);
  const [captions, setCaptions] = useState<CaptionsSettings>(captionDefaults);
  /** Transcripción de cada archivo: al cambiar de video o audio, cada uno conserva la suya. */
  const [transcripts, setTranscripts] = useState<Record<string, CaptionWord[]>>({});
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const player = useRef<PlayerRef>(null);

  const def = findEffect(effectId)!;
  const own = overrides[effectId] ?? {};
  const setOwn = (key: string, value: unknown) =>
    setOverrides((o) => ({ ...o, [effectId]: { ...o[effectId], [key]: value } }));

  const onVideo = onVideoOf(def);
  const main = selectedMedia;
  const hasVoice = main?.kind === 'video' || main?.kind === 'audio';
  // Hasta que transcribas este archivo se ve la frase de ejemplo.
  const mine = main ? transcripts[main.name] : undefined;
  const shownCaptions: CaptionsSettings = mine ? { ...captions, words: mine, wordsFor: main!.name } : { ...captions, wordsFor: '' };
  const effectSec = Number(own.durationSec ?? def.defaultDurationSec);
  // Con un audio siempre hay línea de tiempo (un clip suelto no tendría imagen); con un video, si eliges "Aplicar".
  const timed = hasTimeline(main) && onVideo !== 'none' && (mode === 'video' || main.kind === 'audio');
  const timeline = timed
    ? planTimeline({ onVideo, totalSec: main.durationSec, effectSec, startSec: own[AT] as number | undefined, defaultAt: def.defaultAt })
    : null;

  const props = useMemo(
    () =>
      ({
        ...baseDefaults(def),
        ...def.defaults,
        ...own,
        // En un clip suelto un audio no tiene imagen: se ve la pantalla de ejemplo.
        media: main?.kind === 'audio' && !timed ? null : main,
        fps,
        speed,
        transparent,
        ...bg,
        durationSec: timed ? main.durationSec : effectSec,
        timeline,
        captions: captionsOn && hasVoice ? shownCaptions : null,
      }) as BaseProps & Record<string, unknown>,
    [def, own, main, fps, speed, transparent, bg, timed, effectSec, timeline?.startSec, timeline?.effectSec, captionsOn, captions, mine, hasVoice],
  );
  const canvas = canvasOf(def, props);
  const total = durationInFrames(props);
  const effectFrom = timeline ? Math.round(timeline.startSec * fps) : 0;

  useEffect(() => {
    listMedia().then(setMedia).catch(() => undefined);
  }, []);

  // Con un audio solo no van los efectos que necesitan imagen: se pasa a "Sin efecto".
  useEffect(() => {
    if (compatibility(onVideo, def.group, main)) setEffectId('sin-efecto');
  }, [main]);

  // Al elegir un efecto se ve aplicado al instante, desde donde empieza.
  useEffect(() => {
    setPicking(false);
    player.current?.seekTo(effectFrom);
    player.current?.play();
  }, [effectId]);

  // Elegir el punto de zoom con un clic: se muestra el primer cuadro del efecto, donde la captura aún no se movió.
  const hasFocus = def.params.some((p) => p.key === 'focusX');
  const [picking, setPicking] = useState(false);
  const startPicking = () => {
    player.current?.pause();
    player.current?.seekTo(effectFrom);
    setPicking((v) => !v);
  };
  const onPick = (e: React.MouseEvent<HTMLDivElement>) => {
    // El Player encaja el lienzo dentro del contenedor (con bandas si no coincide la proporción).
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

  // Selector de tu video principal dentro del panel del efecto (p. ej. "Toma de abajo" en Mitad y mitad).
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
  const kindWord = main?.kind === 'audio' ? 'audio' : 'video';

  return (
    <div className="app">
      <aside className="col left">
        <header className="brand">
          <span className="dot" /> chitodev <em>hooks visuales</em>
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
              <span>Haz clic sobre el dato clave</span>
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
            label={def.name}
            movable={onVideo !== 'full'}
            onMove={(s) => setOwn(AT, s)}
          />
        )}
        <FrameBar player={player} total={total} fps={fps} />
      </main>

      <aside className="col right">
        <section className="panel">
          <h2>{def.name}</h2>
          <p className="desc">{def.description}</p>
          {hasFocus && (
            <button className={`primary ghost pick ${picking ? 'on' : ''}`} onClick={startPicking}>
              {picking ? 'Haz clic en la vista previa…' : '🎯 Elegir punto sobre la vista previa'}
            </button>
          )}
          {def.params.map((p) => (
            <React.Fragment key={p.key}>
              <Field def={p} media={media} value={props[p.key]} onChange={(v) => setOwn(p.key, v)} />
              {/* Tu video principal va justo debajo de la otra toma, para elegir las dos juntas. */}
              {p.key === firstMediaParam && mainMediaField}
            </React.Fragment>
          ))}
          {!firstMediaParam && mainMediaField}
        </section>

        <section className="panel">
          <h2>Tiempo</h2>
          {main?.kind === 'video' && onVideo !== 'none' && (
            <Field
              def={{
                key: 'mode',
                label: '¿Qué exportas?',
                type: 'select',
                options: [
                  { value: 'video', label: 'Aplicar a mi video' },
                  { value: 'clip', label: 'Solo el efecto (DaVinci)' },
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
                  ? `Dura todo tu ${kindWord} (${props.durationSec.toFixed(1)} s), con su audio.`
                  : `Tu ${kindWord} dura ${props.durationSec.toFixed(1)} s y conserva su audio. El efecto va de ${timeline.startSec.toFixed(1)} a ${(timeline.startSec + timeline.effectSec).toFixed(1)} s; antes y después sigue tu ${kindWord} normal. Arrastra el tramo en la barra de abajo de la vista previa.`}
              </p>
              {onVideo !== 'full' && (
                <>
                  <Field
                    def={{ key: AT, label: 'Empieza en (s)', type: 'number', min: 0, max: Math.max(0, props.durationSec - timeline.effectSec), step: 0.1 }}
                    media={media}
                    value={timeline.startSec}
                    onChange={(v) => setOwn(AT, v)}
                  />
                  <Field
                    def={{ key: 'durationSec', label: 'Duración del efecto (s)', type: 'number', min: 0.5, max: Math.min(10, props.durationSec), step: 0.1 }}
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
                  ? 'Pieza suelta: no va sobre un video. El export dura lo que la pieza.'
                  : main?.kind === 'image'
                    ? 'Con una imagen no hay línea de tiempo: el export dura lo que el efecto.'
                    : main?.kind === 'video'
                      ? 'Solo el efecto: un clip corto con los primeros segundos de tu video y sin audio, para montarlo en DaVinci.'
                      : 'Sube o elige un video para aplicarle el efecto. Mientras tanto ves una pantalla de ejemplo.'}
              </p>
              <Field
                def={{ key: 'durationSec', label: 'Duración (s)', type: 'number', min: 0.5, max: 10, step: 0.1 }}
                media={media}
                value={effectSec}
                onChange={(v) => setOwn('durationSec', v)}
              />
            </>
          )}
          {def.id !== 'sin-efecto' && (
            <Field
              def={{ key: 'speed', label: 'Velocidad de la animación', type: 'number', min: 0.25, max: 3, step: 0.05 }}
              media={media}
              value={speed}
              onChange={(v) => setSpeed(v as number)}
            />
          )}
          <Field
            def={{
              key: 'fps',
              label: 'Cuadros por segundo',
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
            def={{
              key: 'transparent',
              label: timeline ? 'Ver sin tu video (solo efecto y subtítulos, como sale en ProRes)' : 'Fondo transparente (para DaVinci)',
              type: 'boolean',
            }}
            media={media}
            value={transparent}
            onChange={(v) => setTransparent(Boolean(v))}
          />
        </section>

        <section className="panel">
          <h2>Subtítulos</h2>
          {hasVoice ? (
            <>
              <Field
                def={{ key: 'captionsOn', label: `Poner subtítulos de tu voz encima`, type: 'boolean' }}
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
                    onChange={(words, wordsFor) => setTranscripts((t) => ({ ...t, [wordsFor]: words }))}
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
            <p className="desc">Elige un video o un audio con tu voz para ponerle subtítulos. Funcionan con cualquier efecto.</p>
          )}
        </section>

        <BackgroundPanel value={bg} onChange={setBg} transparent={transparent} />
        <ExportPanel effectId={effectId} effectName={def.name} props={props} size={canvas} timed={!!timeline} />
      </aside>
    </div>
  );
};
