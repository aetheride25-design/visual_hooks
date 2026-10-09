// Right column: the settings, in tabs (effect, time, captions, background).
import React from 'react';
import type { PlayerRef } from '@remotion/player';
import { captionParams, type CaptionsSettings } from '../../src/components/captions.tsx';
import { tr } from '../../src/lib/i18n.ts';
import type { MediaRef } from '../../src/lib/types.ts';
import type { InspectorTab } from '../state/saved.ts';
import { AT, type Editor } from '../state/useEditor.ts';
import { useLang, type StringKey } from '../i18n.tsx';
import { BackgroundPanel } from '../panels/background.tsx';
import { CaptionsEditor } from '../panels/captions.tsx';
import { Field } from '../panels/field.tsx';

const TABS: [InspectorTab, StringKey][] = [
  ['effect', 'tabEffect'],
  ['time', 'time'],
  ['captions', 'captions'],
  ['background', 'background'],
];

const EffectTab: React.FC<{ ed: Editor; picking: boolean; startPicking: () => void }> = ({ ed, picking, startPicking }) => {
  const { lang, t } = useLang();
  const { def, props, media } = ed;
  const hasFocus = def.params.some((p) => p.key === 'focusX');
  // Main video picker inside the effect panel (e.g. "Bottom shot" in Split screen).
  const firstMediaParam = def.params.find((p) => p.type === 'media')?.key;
  const mainMediaField = def.mediaLabel ? (
    <Field
      def={{ key: 'media', label: def.mediaLabel, type: 'media' }}
      media={media}
      value={ed.main}
      onChange={(v) => ed.setSelectedMedia(v as MediaRef | null)}
    />
  ) : null;
  const edited = Object.keys(ed.own).some((k) => k !== AT && k !== 'durationSec');
  return (
    <>
      <p className="desc">{tr(def.description, lang)}</p>
      {hasFocus && (
        <button className={`primary ghost pick ${picking ? 'on' : ''}`} onClick={startPicking}>
          {picking ? t('picking') : t('pickPoint')}
        </button>
      )}
      {def.params.map((p) => (
        <React.Fragment key={p.key}>
          <Field def={p} media={media} value={props[p.key]} onChange={(v) => ed.setOwn(p.key, v)} />
          {/* Your main video goes right below the other shot, to pick both together. */}
          {p.key === firstMediaParam && mainMediaField}
        </React.Fragment>
      ))}
      {!firstMediaParam && mainMediaField}
      {edited && (
        <button className="link" onClick={ed.resetOwn}>
          ↺ {t('resetEffect')}
        </button>
      )}
    </>
  );
};

const TimeTab: React.FC<{ ed: Editor }> = ({ ed }) => {
  const { t } = useLang();
  const { def, props, media, main, timeline, onVideo } = ed;
  const kind = main?.kind === 'audio' ? 'audio' : 'video';
  return (
    <>
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
          value={ed.mode}
          onChange={(v) => ed.setMode(v as 'video' | 'clip')}
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
                onChange={(v) => ed.setOwn(AT, v)}
              />
              <Field
                def={{ key: 'durationSec', label: t('effectDuration'), type: 'number', min: 0.5, max: Math.min(10, props.durationSec), step: 0.1 }}
                media={media}
                value={timeline.effectSec}
                onChange={(v) => ed.setOwn('durationSec', v)}
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
            value={ed.effectSec}
            onChange={(v) => ed.setOwn('durationSec', v)}
          />
        </>
      )}
      {def.id !== 'no-effect' && (
        <Field
          def={{ key: 'speed', label: t('speed'), type: 'number', min: 0.25, max: 3, step: 0.05 }}
          media={media}
          value={ed.speed}
          onChange={(v) => ed.setSpeed(v as number)}
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
        value={String(ed.fps)}
        onChange={(v) => ed.setFps(Number(v) as 30 | 60)}
      />
      <Field
        def={{ key: 'transparent', label: timeline ? t('hideVideo') : t('transparentBg'), type: 'boolean' }}
        media={media}
        value={ed.transparent}
        onChange={(v) => ed.setTransparent(Boolean(v))}
      />
    </>
  );
};

const CaptionsTab: React.FC<{ ed: Editor; onSeekMs: (ms: number) => void }> = ({ ed, onSeekMs }) => {
  const { t } = useLang();
  const { main, media, captions, shownCaptions } = ed;
  if (!ed.hasVoice) return <p className="desc">{t('captionsNeedVoice')}</p>;
  return (
    <>
      <Field
        def={{ key: 'captionsOn', label: t('captionsOn'), type: 'boolean' }}
        media={media}
        value={ed.captionsOn}
        onChange={(v) => ed.setCaptionsOn(Boolean(v))}
      />
      {ed.captionsOn && (
        <>
          <CaptionsEditor
            video={main}
            words={shownCaptions.words}
            wordsFor={shownCaptions.wordsFor}
            offsetMs={captions.offsetMs}
            onChange={(words, wordsFor) => ed.setTranscripts((ts) => ({ ...ts, [wordsFor]: words }))}
            onSeek={onSeekMs}
          />
          {captionParams.map((p) => (
            <Field
              key={p.key}
              def={p}
              media={media}
              value={captions[p.key as keyof CaptionsSettings]}
              onChange={(v) => ed.setCaptions((c) => ({ ...c, [p.key]: v }))}
            />
          ))}
        </>
      )}
    </>
  );
};

export const Inspector: React.FC<{
  ed: Editor;
  player: React.RefObject<PlayerRef | null>;
  picking: boolean;
  setPicking: (fn: (v: boolean) => boolean) => void;
}> = ({ ed, player, picking, setPicking }) => {
  const { t } = useLang();
  const startPicking = () => {
    player.current?.pause();
    player.current?.seekTo(ed.effectFrom);
    setPicking((v) => !v);
  };
  const seekMs = (ms: number) => {
    player.current?.pause();
    player.current?.seekTo(Math.round((ms / 1000) * ed.fps));
  };
  // A dot on the tab when something there is on (captions) or changed (background).
  const dot: Partial<Record<InspectorTab, boolean>> = {
    captions: ed.captionsOn && ed.hasVoice,
    background: ed.bg.bg !== 'aurora' || ed.bg.bgTint !== 'brand',
  };
  return (
    <aside className="col right">
      <div className="tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={ed.tab === id} className={ed.tab === id ? 'on' : ''} onClick={() => ed.setTab(id)}>
            {t(label)}
            {dot[id] && <i className="dot" />}
          </button>
        ))}
      </div>
      <section className="panel inspector">
        {ed.tab === 'effect' && <EffectTab ed={ed} picking={picking} startPicking={startPicking} />}
        {ed.tab === 'time' && <TimeTab ed={ed} />}
        {ed.tab === 'captions' && <CaptionsTab ed={ed} onSeekMs={seekMs} />}
        {ed.tab === 'background' && <BackgroundPanel value={ed.bg} onChange={ed.setBg} transparent={ed.transparent} />}
      </section>
    </aside>
  );
};
