import React, { useEffect, useRef, useState } from 'react';
import type { PlayerRef } from '@remotion/player';
import { effects } from '../src/registry.ts';
import { tr } from '../src/lib/i18n.ts';
import type { JobState } from './api.ts';
import { useLang } from './i18n.tsx';
import { Gallery } from './layout/Gallery.tsx';
import { Inspector } from './layout/Inspector.tsx';
import { Stage } from './layout/Stage.tsx';
import { TopBar } from './layout/TopBar.tsx';
import { ExportPanel } from './panels/export.tsx';
import { MediaPanel } from './panels/media.tsx';
import { useEditor } from './state/useEditor.ts';

export const App: React.FC = () => {
  const { lang, t } = useLang();
  const ed = useEditor();
  const player = useRef<PlayerRef>(null);
  const [picking, setPicking] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [job, setJob] = useState<JobState | null>(null);

  // Esc closes the export window.
  useEffect(() => {
    if (!exportOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setExportOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exportOpen]);

  return (
    <div className="app">
      <TopBar job={job} onExport={() => setExportOpen(true)} />
      <aside className="col left">
        <MediaPanel
          media={ed.media}
          selected={ed.main}
          onSelect={ed.setSelectedMedia}
          onFiles={ed.onFiles}
          uploading={ed.uploading}
        />
        {ed.notice && <div className="job error">{ed.notice}</div>}
        <Gallery effects={effects} selected={ed.effectId} media={ed.main} bg={ed.bg} onSelect={ed.setEffectId} />
      </aside>

      <Stage ed={ed} player={player} picking={picking} setPicking={setPicking} />

      <Inspector ed={ed} player={player} picking={picking} setPicking={setPicking} />

      {/* Always mounted (hidden when closed) so a running export keeps reporting its progress. */}
      <div className={`overlay ${exportOpen ? 'open' : ''}`} onClick={() => setExportOpen(false)} aria-hidden={!exportOpen}>
        <div className="panel dialog" role="dialog" aria-label={t('exportBtn')} onClick={(e) => e.stopPropagation()}>
          <button className="close" onClick={() => setExportOpen(false)} aria-label={t('close')}>
            ×
          </button>
          <ExportPanel
            effectId={ed.def.id}
            effectName={tr(ed.def.name, lang)}
            props={ed.props}
            size={ed.canvas}
            timed={!!ed.timeline}
            onJob={setJob}
          />
        </div>
      </div>
    </div>
  );
};
