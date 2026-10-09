// Effect gallery: search, filter by kind and a card per effect with a still of it (it plays on hover).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Player, Thumbnail } from '@remotion/player';
import { baseDefaults, canvasOf, defaultsFor, durationInFrames } from '../../src/registry.ts';
import { shells } from '../../src/shell.tsx';
import { tr, type Lang } from '../../src/lib/i18n.ts';
import type { BgProps } from '../../src/lib/background.ts';
import type { EffectDef, MediaRef } from '../../src/lib/types.ts';
import { compatibility, onVideoOf, tagsOf } from '../../src/lib/timeline.ts';
import { useLang, type StringKey } from '../i18n.tsx';

type Filter = 'all' | 'hook' | 'support' | 'piece' | 'mod';

const FILTERS: [Filter, StringKey, StringKey?][] = [
  ['all', 'filterAll'],
  ['hook', 'filterHooks', 'groupHooksHint'],
  ['support', 'filterSupport', 'groupSupportHint'],
  ['piece', 'filterPieces', 'groupPiecesHint'],
  ['mod', 'filterMods', 'groupModsHint'],
];

const GROUP_LABEL: Record<EffectDef['group'], StringKey> = {
  base: 'groupBase',
  hook: 'filterHooks',
  support: 'filterSupport',
  piece: 'filterPieces',
};

const matches = (def: EffectDef<any>, filter: Filter, query: string, lang: Lang) => {
  if (filter === 'mod' && def.source !== 'mod') return false;
  if (filter !== 'all' && filter !== 'mod' && def.group !== filter) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [def.name.en, def.name.es, def.description.en, def.description.es, def.id, def.author ?? ''].join(' ').toLowerCase();
  return q.split(/\s+/).every((w) => hay.includes(w)) || tr(def.name, lang).toLowerCase().includes(q);
};

/** Props for the card: the effect's defaults over the sample screen, with your background. */
const cardProps = (def: EffectDef<any>, lang: Lang, bg: BgProps) => ({
  ...baseDefaults(def),
  ...defaultsFor(def, lang),
  ...bg,
});

/** Draws the card only once it scrolls into view (two dozen live compositions at once would be heavy). */
const useVisible = <T extends Element>() => {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);
  return [ref, visible] as const;
};

const Card: React.FC<{
  def: EffectDef<any>;
  on: boolean;
  blocked: string | null;
  bg: BgProps;
  onSelect: () => void;
}> = ({ def, on, blocked, bg, onSelect }) => {
  const { lang, t } = useLang();
  const [ref, visible] = useVisible<HTMLButtonElement>();
  const [hover, setHover] = useState(false);
  const props = useMemo(() => cardProps(def, lang, bg), [def, lang, bg]);
  const size = canvasOf(def, props);
  const total = durationInFrames(props);
  const still = Math.min(total - 1, Math.round((def.thumbSec ?? def.defaultDurationSec * 0.7) * props.fps));
  const common = {
    component: shells[def.id],
    inputProps: props,
    durationInFrames: total,
    fps: props.fps,
    compositionWidth: size.width,
    compositionHeight: size.height,
    style: { width: '100%', height: '100%' },
  };
  const tags = tagsOf(onVideoOf(def), def.group).map((x) => tr(x, lang));
  const kind = t(def.source === 'mod' ? 'filterMods' : GROUP_LABEL[def.group]);

  return (
    <button
      ref={ref}
      className={`card ${on ? 'on' : ''} ${blocked ? 'off' : ''}`}
      disabled={!!blocked}
      title={blocked ?? `${tr(def.description, lang)}\n${tags.join(' · ')}`}
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span className="still">
        <span className="frame" style={{ aspectRatio: `${size.width} / ${size.height}` }}>
          {visible &&
            (hover && !blocked ? (
              <Player {...common} autoPlay loop initiallyMuted acknowledgeRemotionLicense />
            ) : (
              <Thumbnail {...common} frameToDisplay={still} />
            ))}
        </span>
        {def.source === 'mod' && <i className="badge">{t('modBadge')}</i>}
      </span>
      <span className="card-text">
        <strong>{tr(def.name, lang)}</strong>
        <small>{blocked ? t('notWithThis') : kind}</small>
      </span>
    </button>
  );
};

export const Gallery: React.FC<{
  effects: EffectDef<any>[];
  selected: string;
  /** What you picked: disables the effects that don't work with it. */
  media: MediaRef | null;
  bg: BgProps;
  onSelect: (id: string) => void;
}> = ({ effects, selected, media, bg, onSelect }) => {
  const { lang, t } = useLang();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const search = useRef<HTMLInputElement>(null);
  const hasMods = effects.some((e) => e.source === 'mod');

  // "/" jumps to the search box, like on GitHub.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest('input, textarea, select');
      if (e.key === '/' && !typing) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const shown = effects.filter((e) => matches(e, filter, query, lang));
  return (
    <section className="panel gallery">
      <div className="gallery-head">
        <h2>{t('effectsTitle')}</h2>
        <span className="count">{shown.length}</span>
      </div>
      <input
        ref={search}
        className="search"
        type="search"
        placeholder={t('searchEffects')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="chips">
        {FILTERS.filter(([f]) => f !== 'mod' || hasMods).map(([f, label, hint]) => (
          <button key={f} className={filter === f ? 'on' : ''} title={hint && t(hint)} onClick={() => setFilter(f)}>
            {t(label)}
          </button>
        ))}
      </div>
      <div className="cards">
        {shown.map((e) => {
          const blocked = compatibility(onVideoOf(e), e.group, media);
          return (
            <Card
              key={e.id}
              def={e}
              on={selected === e.id}
              blocked={blocked && tr(blocked, lang)}
              bg={bg}
              onSelect={() => onSelect(e.id)}
            />
          );
        })}
        {shown.length === 0 && <p className="empty">{t('noMatches')}</p>}
      </div>
    </section>
  );
};
