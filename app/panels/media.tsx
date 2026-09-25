// Media: drag and drop + list.
import React, { useRef, useState } from 'react';
import type { MediaRef } from '../../src/lib/types.ts';
import { formatDuration } from '../../src/lib/timeline.ts';
import { useLang } from '../i18n.tsx';

export const MediaPanel: React.FC<{
  media: MediaRef[];
  selected: MediaRef | null;
  onSelect: (m: MediaRef | null) => void;
  onFiles: (files: File[]) => void;
  uploading: boolean;
}> = ({ media, selected, onSelect, onFiles, uploading }) => {
  const { t } = useLang();
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <section className="panel">
      <h2>{t('mediaTitle')}</h2>
      <div
        className={`drop ${over ? 'over' : ''}`}
        onDragOver={(e) => (e.preventDefault(), setOver(true))}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          onFiles([...e.dataTransfer.files]);
        }}
        onClick={() => input.current?.click()}
      >
        {uploading ? t('uploading') : t('dropHere')}
        <small>{t('savedIn')}</small>
        <input
          ref={input}
          type="file"
          accept="video/*,image/*,audio/*"
          multiple
          hidden
          onChange={(e) => onFiles([...(e.target.files ?? [])])}
        />
      </div>
      <div className="media-list">
        <button className={`media-item ${selected === null ? 'on' : ''}`} onClick={() => onSelect(null)}>
          <span className="thumb demo">demo</span>
          <span>{t('sampleScreen')}</span>
        </button>
        {media.map((m) => (
          <button key={m.src} className={`media-item ${selected?.src === m.src ? 'on' : ''}`} onClick={() => onSelect(m)}>
            {m.kind === 'video' ? (
              <video className="thumb" src={`${m.src}#t=0.5`} muted preload="metadata" />
            ) : m.kind === 'audio' ? (
              <span className="thumb demo">🎵</span>
            ) : (
              <img className="thumb" src={m.src} alt="" />
            )}
            <span className="media-name">
              <span title={m.name}>{m.name}</span>
              <small>
                {m.kind === 'video' ? t('kindVideo') : m.kind === 'audio' ? t('kindAudio') : t('kindImage')}
                {m.durationSec ? ` · ${formatDuration(m.durationSec)}` : ''}
              </small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
