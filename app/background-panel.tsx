import React from 'react';
import { aurora } from '../src/brand.ts';
import { bgStyles, bgTints, type BgProps } from '../src/lib/background.ts';

const TINT_SWATCH: Record<string, string> = {
  marca: `conic-gradient(${aurora.mint}, ${aurora.blue}, ${aurora.violet}, ${aurora.mint})`,
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

/** Estilo de fondo animado y sus colores. Se aplica a todos los efectos. */
export const BackgroundPanel: React.FC<{
  value: BgProps;
  onChange: (v: BgProps) => void;
  transparent: boolean;
}> = ({ value, onChange, transparent }) => {
  const set = (patch: Partial<BgProps>) => onChange({ ...value, ...patch });
  const setColor = (i: number, c: string) => {
    const colors = [...value.bgColors] as BgProps['bgColors'];
    colors[i] = c;
    set({ bgColors: colors });
  };
  return (
    <section className="panel">
      <h2>Fondo</h2>
      {transparent && <p className="desc">Con "Fondo transparente" activo no se dibuja; el MP4 sí lo lleva.</p>}
      <div className="field">
        <span>Estilo</span>
        <div className="segmented wrap">
          {bgStyles.map((s) => (
            <button key={s.value} className={value.bg === s.value ? 'on' : ''} onClick={() => set({ bg: s.value })}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span>
          Colores <em>{bgTints.find((x) => x.value === value.bgTint)?.label}</em>
        </span>
        <div className="swatches">
          {bgTints.map((x) => (
            <button
              key={x.value}
              title={x.label}
              className={`swatch ${value.bgTint === x.value ? 'on' : ''}`}
              style={{ background: TINT_SWATCH[x.value] }}
              onClick={() => set({ bgTint: x.value })}
            />
          ))}
        </div>
      </div>
      {value.bgTint === 'custom' && (
        <div className="field hexes">
          <ColorInput label="Base" value={value.bgBase} onChange={(c) => set({ bgBase: c })} />
          {value.bgColors.map((c, i) => (
            <ColorInput key={i} label={`Luz ${i + 1}`} value={c} onChange={(v) => setColor(i, v)} />
          ))}
        </div>
      )}
    </section>
  );
};
