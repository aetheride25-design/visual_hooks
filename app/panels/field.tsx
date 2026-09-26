// Parameter controls.
import React from 'react';
import { aurora, paletteColors, type PaletteColor } from '../../src/theme.ts';
import { tr } from '../../src/lib/i18n.ts';
import type { MediaRef, ParamDef } from '../../src/lib/types.ts';
import { useLang } from '../i18n.tsx';

const Swatches: React.FC<{ value: PaletteColor; onChange: (c: PaletteColor) => void }> = ({ value, onChange }) => (
  <div className="swatches">
    {paletteColors.map((c) => (
      <button
        key={c}
        title={c}
        className={`swatch ${value === c ? 'on' : ''}`}
        style={{ background: aurora[c] }}
        onClick={() => onChange(c)}
      />
    ))}
  </div>
);

export const Field: React.FC<{
  def: ParamDef;
  value: unknown;
  media: MediaRef[];
  onChange: (v: unknown) => void;
}> = ({ def, value, media, onChange }) => {
  const { lang, t } = useLang();
  const label = tr(def.label, lang);
  switch (def.type) {
    case 'text':
      return (
        <label className="field">
          <span>{label}</span>
          {def.multiline ? (
            <textarea rows={3} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
          ) : (
            <input type="text" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
          )}
        </label>
      );
    case 'color':
      return (
        <div className="field">
          <span>{label}</span>
          <Swatches value={value as PaletteColor} onChange={onChange} />
        </div>
      );
    case 'number':
      return (
        <label className="field">
          <span>
            {label}
            <input
              className="num"
              type="number"
              min={def.min}
              max={def.max}
              step={def.step}
              value={Number(value)}
              onChange={(e) => {
                const n = Number(e.target.value);
                // Never out of range: speed 0 or negative decimals break the render.
                if (e.target.value !== '' && Number.isFinite(n)) onChange(Math.min(def.max, Math.max(def.min, n)));
              }}
            />
          </span>
          <input
            type="range"
            min={def.min}
            max={def.max}
            step={def.step}
            value={Number(value)}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </label>
      );
    case 'select':
      return (
        <div className="field">
          <span>{label}</span>
          <div className="segmented">
            {def.options.map((o) => (
              <button key={o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
                {tr(o.label, lang)}
              </button>
            ))}
          </div>
        </div>
      );
    case 'boolean':
      return (
        <label className="field toggle">
          <span>{label}</span>
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
        </label>
      );
    case 'media': {
      const current = value as MediaRef | null;
      return (
        <label className="field">
          <span>{label}</span>
          <select
            value={current?.src ?? ''}
            onChange={(e) => onChange(media.find((m) => m.src === e.target.value) ?? null)}
          >
            <option value="">{t('sampleScreen')}</option>
            {media.map((m) => (
              <option key={m.src} value={m.src}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      );
    }
  }
};
