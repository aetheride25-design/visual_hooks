// Top bar: brand, link to the open-source repo, language and the export button (with its progress).
import React from 'react';
import type { JobState } from '../api.ts';
import { LangSwitch, useLang } from '../i18n.tsx';

export const REPO_URL = 'https://github.com/aetheride25-design/visual_hooks';

export const TopBar: React.FC<{ job: JobState | null; onExport: () => void }> = ({ job, onExport }) => {
  const { t } = useLang();
  const busy = job?.status === 'preparing' || job?.status === 'rendering';
  return (
    <header className="topbar">
      <div className="brand">
        <span className="logo" aria-hidden>
          <i />
        </span>
        <strong>{t('brand')}</strong>
        <a className="oss" href={REPO_URL} target="_blank" rel="noreferrer" title={t('ossHint')}>
          {t('oss')}
        </a>
      </div>
      <div className="topbar-actions">
        <span className="kbd-hint">
          <kbd>/</kbd> {t('kbdSearch')} · <kbd>␣</kbd> {t('kbdPlay')}
        </span>
        <LangSwitch />
        <button className={`primary export-btn ${busy ? 'busy' : ''}`} onClick={onExport}>
          {busy ? (
            <>
              <span className="ring" style={{ ['--p' as string]: job!.progress }} />
              {Math.round(job!.progress * 100)} %
            </>
          ) : job?.status === 'done' ? (
            <>✓ {t('exportBtn')}</>
          ) : (
            <>⬇ {t('exportBtn')}</>
          )}
        </button>
      </div>
    </header>
  );
};
