// Center of the app: the live preview, the point picker, frame stepping and the timeline.
import React, { useEffect, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { shells } from '../../src/shell.tsx';
import { mediaRect } from '../../src/components/media.tsx';
import { FRAME } from '../../src/lib/frame.ts';
import { tr } from '../../src/lib/i18n.ts';
import { fitRect, pointToMedia, type Fit } from '../../src/lib/layout.ts';
import { onVideoOf, tagsOf } from '../../src/lib/timeline.ts';
import type { Editor } from '../state/useEditor.ts';
import { AT } from '../state/useEditor.ts';
import { useLang } from '../i18n.tsx';
import { FrameBar, TimelineBar } from '../panels/preview.tsx';

export const Stage: React.FC<{
  ed: Editor;
  player: React.RefObject<PlayerRef | null>;
  picking: boolean;
  setPicking: (v: boolean) => void;
}> = ({ ed, player, picking, setPicking }) => {
  const { lang, t } = useLang();
  const { def, props, canvas, total, fps, timeline, effectFrom, onVideo } = ed;
  const name = tr(def.name, lang);

  // Picking an effect shows it applied right away, from where it starts.
  useEffect(() => {
    setPicking(false);
    player.current?.seekTo(effectFrom);
    player.current?.play();
  }, [ed.effectId]);

  const onPick = (e: React.MouseEvent<HTMLDivElement>) => {
    // The Player fits the canvas inside the container (letterboxed if the ratio differs).
    const box = e.currentTarget.getBoundingClientRect();
    const view = fitRect(canvas.width, canvas.height, { x: box.left, y: box.top, w: box.width, h: box.height }, 'contain');
    const x = ((e.clientX - view.x) / view.w) * canvas.width;
    const y = ((e.clientY - view.y) / view.h) * canvas.height;
    const { fx, fy } = pointToMedia(mediaRect(props.media, FRAME, (props.fit as Fit) ?? 'contain'), x, y);
    ed.setOwn('focusX', fx);
    ed.setOwn('focusY', fy);
    setPicking(false);
    player.current?.play();
  };

  const [tipClosed, setTipClosed] = useState(() => {
    try {
      return localStorage.getItem('tipClosed') === '1';
    } catch {
      return false;
    }
  });
  const closeTip = () => {
    setTipClosed(true);
    try {
      localStorage.setItem('tipClosed', '1');
    } catch {
      // Not remembered: it shows again next time.
    }
  };

  return (
    <main className={`stage ${timeline ? 'timed' : ''}`}>
      <div className="stage-head">
        <div>
          <h1>{name}</h1>
          <p>
            {tagsOf(onVideoOf(def), def.group)
              .map((x) => tr(x, lang))
              .join(' · ')}
            {def.author && ` · ${t('byAuthor', { a: def.author })}`}
          </p>
        </div>
      </div>
      {!ed.main && !tipClosed && (
        <ol className="steps">
          <li>
            <b>1</b> {t('step1')}
          </li>
          <li>
            <b>2</b> {t('step2')}
          </li>
          <li>
            <b>3</b> {t('step3')}
          </li>
          <button className="close" onClick={closeTip} aria-label={t('close')}>
            ×
          </button>
        </ol>
      )}
      <div className={`phone ${ed.transparent ? 'checker' : ''}`} style={{ aspectRatio: `${canvas.width} / ${canvas.height}` }}>
        <Player
          ref={player}
          component={shells[def.id]}
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
          onMove={(s) => ed.setOwn(AT, s)}
        />
      )}
      <FrameBar player={player} total={total} fps={fps} />
    </main>
  );
};
