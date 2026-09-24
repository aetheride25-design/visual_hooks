import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { baseDefaults, canvasOf, durationInFrames, effects, findEffect, shells } from '../src/registry.tsx';
import type { BaseProps, MediaRef } from '../src/lib/types.ts';
import { mediaRect } from '../src/components/brand.tsx';
import { FRAME } from '../src/lib/frame.ts';
import { fitRect, pointToMedia, type Fit } from '../src/lib/layout.ts';
import { listMedia, uploadMedia } from './api.ts';
import { EffectList, ExportPanel, Field, FrameBar, MediaPanel } from './panels.tsx';
import { BackgroundPanel } from './background-panel.tsx';
import { bgDefaults, type BgProps } from '../src/lib/background.ts';

type Overrides = Record<string, Record<string, unknown>>;

export const App: React.FC = () => {
  const [effectId, setEffectId] = useState(effects[0].id);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [media, setMedia] = useState<MediaRef[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaRef | null>(null);
  const [fps, setFps] = useState<30 | 60>(30);
  const [speed, setSpeed] = useState(1);
  const [transparent, setTransparent] = useState(false);
  const [bg, setBg] = useState<BgProps>(bgDefaults);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const player = useRef<PlayerRef>(null);

  const def = findEffect(effectId)!;
  const own = overrides[effectId] ?? {};
  const setOwn = (key: string, value: unknown) =>
    setOverrides((o) => ({ ...o, [effectId]: { ...o[effectId], [key]: value } }));

  const props = useMemo(
    () =>
      ({
        ...baseDefaults(def),
        ...def.defaults,
        ...own,
        media: selectedMedia,
        fps,
        speed,
        transparent,
        ...bg,
      }) as BaseProps & Record<string, unknown>,
    [def, own, selectedMedia, fps, speed, transparent, bg],
  );
  const canvas = canvasOf(def, props);

  useEffect(() => {
    listMedia().then(setMedia).catch(() => undefined);
  }, []);

  // Al elegir un efecto se ve aplicado al instante, desde el inicio.
  useEffect(() => {
    setPicking(false);
    player.current?.seekTo(0);
    player.current?.play();
  }, [effectId]);

  // Elegir el punto de zoom con un clic: se muestra el cuadro 0, donde la captura aún no se movió.
  const hasFocus = def.params.some((p) => p.key === 'focusX');
  const [picking, setPicking] = useState(false);
  const startPicking = () => {
    player.current?.pause();
    player.current?.seekTo(0);
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
        <EffectList effects={effects} selected={effectId} onSelect={setEffectId} />
      </aside>

      <main className="stage">
        <div className={`phone ${transparent ? 'checker' : ''}`} style={{ aspectRatio: `${canvas.width} / ${canvas.height}` }}>
          <Player
            ref={player}
            component={shells[effectId]}
            inputProps={props}
            durationInFrames={durationInFrames(props)}
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
        <FrameBar player={player} total={durationInFrames(props)} fps={fps} />
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
          <Field
            def={{ key: 'durationSec', label: 'Duración (s)', type: 'number', min: 0.5, max: 10, step: 0.1 }}
            media={media}
            value={props.durationSec}
            onChange={(v) => setOwn('durationSec', v)}
          />
          <Field
            def={{ key: 'speed', label: 'Velocidad', type: 'number', min: 0.25, max: 3, step: 0.05 }}
            media={media}
            value={speed}
            onChange={(v) => setSpeed(v as number)}
          />
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
            def={{ key: 'transparent', label: 'Fondo transparente (para DaVinci)', type: 'boolean' }}
            media={media}
            value={transparent}
            onChange={(v) => setTransparent(Boolean(v))}
          />
        </section>
        <BackgroundPanel value={bg} onChange={setBg} transparent={transparent} />
        <ExportPanel effectId={effectId} effectName={def.name} props={props} size={canvas} />
      </aside>
    </div>
  );
};
