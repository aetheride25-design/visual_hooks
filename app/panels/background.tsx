// Animated background: style and colors.
import React from 'react';
import { aurora } from '../../src/theme.ts';
import { tr } from '../../src/lib/i18n.ts';
import { bgStyles, bgTints, type BgProps, type BgTint } from '../../src/lib/background.ts';
import { useLang } from '../i18n.tsx';

const TINT_SWATCH: Record<BgTint, string> = {
  brand: `conic-gradient(${aurora.mint}, ${aurora.blue}, ${aurora.violet}, ${aurora.mint})`,
  mint: aurora.mint,
  blue: aurora.blue,
  violet: aurora.violet,
  red: aurora.red,
  custom: 'conic-gradient(#ff4f4a, #f5c451, #5fd6b2, #6fb4ff, #b495ff, #ff4f4a)',
};

const ColorInput: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <label className="hex">
    <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
    <span>{label}</span>
  </label>
);

/** Animated background style and its colors. Applies to every effect. */
export const BackgroundPanel: React.FC<{
  value: BgProps;
  onChange: (v: BgProps) => void;
  transparent: boolean;
}> = ({ value, onChange, transparent }) => {
  const { lang, t } = useLang();
  const set = (patch: Partial<BgProps>) => onChange({ ...value, ...patch });
  const setColor = (i: number, c: string) => {
    const colors = [...value.bgColors] as BgProps['bgColors'];
    colors[i] = c;
    set({ bgColors: colors });
  };
  const tint = bgTints.find((x) => x.value === value.bgTint);
  return (
    <div>
      {transparent && <p className="desc">{t('bgHidden')}</p>}
      <div className="field">
        <span>{t('style')}</span>
        <div className="segmented wrap">
          {bgStyles.map((s) => (
            <button key={s.value} className={value.bg === s.value ? 'on' : ''} onClick={() => set({ bg: s.value })}>
              {tr(s.label, lang)}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span>
          {t('colors')} <em>{tint && tr(tint.label, lang)}</em>
        </span>
        <div className="swatches">
          {bgTints.map((x) => (
            <button
              key={x.value}
              title={tr(x.label, lang)}
              className={`swatch ${value.bgTint === x.value ? 'on' : ''}`}
              style={{ background: TINT_SWATCH[x.value] }}
              onClick={() => set({ bgTint: x.value })}
            />
          ))}
        </div>
      </div>
      {value.bgTint === 'custom' && (
        <div className="field hexes">
          <ColorInput label={t('base')} value={value.bgBase} onChange={(c) => set({ bgBase: c })} />
          {value.bgColors.map((c, i) => (
            <ColorInput key={i} label={t('light', { n: i + 1 })} value={c} onChange={(v) => setColor(i, v)} />
          ))}
        </div>
      )}
    </div>
  );
};
