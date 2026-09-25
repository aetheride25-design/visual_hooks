// List of hooks and effects.
import React from 'react';
import { tr } from '../../src/lib/i18n.ts';
import type { EffectDef, MediaRef } from '../../src/lib/types.ts';
import { compatibility, onVideoOf, tagsOf } from '../../src/lib/timeline.ts';
import { useLang } from '../i18n.tsx';

export const EffectList: React.FC<{
  effects: EffectDef<any>[];
  selected: string;
  /** What you picked on the left: disables the effects that don't work with it. */
  media: MediaRef | null;
  onSelect: (id: string) => void;
}> = ({ effects, selected, media, onSelect }) => {
  const { lang, t } = useLang();
  const group = (g: EffectDef['group'], title: string | null, hint?: string) => (
    <>
      {title && <h3>{title}</h3>}
      {hint && <p className="group-hint">{hint}</p>}
      {effects
        .filter((e) => e.group === g)
        .map((e) => {
          const onVideo = onVideoOf(e);
          const blocked = compatibility(onVideo, e.group, media);
          const reason = blocked && tr(blocked, lang);
          return (
            <button
              key={e.id}
              className={`effect ${selected === e.id ? 'on' : ''} ${blocked ? 'off' : ''}`}
              disabled={!!blocked}
              title={reason ?? undefined}
              onClick={() => onSelect(e.id)}
            >
              <strong>{tr(e.name, lang)}</strong>
              <span className="tags">
                {tagsOf(onVideo, e.group).map((tag) => {
                  const text = tr(tag, lang);
                  return <em key={text}>{text}</em>;
                })}
              </span>
              <span>{reason ?? tr(e.description, lang)}</span>
            </button>
          );
        })}
    </>
  );
  return (
    <section className="panel effects">
      {group('base', null)}
      {group('hook', t('groupHooks'), t('groupHooksHint'))}
      {group('support', t('groupSupport'), t('groupSupportHint'))}
      {group('piece', t('groupPieces'), t('groupPiecesHint'))}
    </section>
  );
};
