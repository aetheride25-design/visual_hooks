// Controls several effects share, so they read the same everywhere.
import type { ParamDef } from '../lib/types.ts';

/** Framing of your video or screenshot: whole (letterboxed) or filling the vertical frame. */
export const fitParam = (label = { en: 'Framing', es: 'Encuadre' }): ParamDef => ({
  key: 'fit',
  label,
  type: 'select',
  options: [
    { value: 'contain', label: { en: 'Whole', es: 'Completa' } },
    { value: 'cover', label: { en: 'Fill screen', es: 'Llenar pantalla' } },
  ],
});

/** The point the effect points at. With these keys the app shows "Pick a point on the preview". */
export const focusParams = (what = { en: 'Point', es: 'Punto' }): ParamDef[] => [
  { key: 'focusX', label: { en: `${what.en} ↔`, es: `${what.es} ↔` }, type: 'number', min: 0, max: 1, step: 0.01 },
  { key: 'focusY', label: { en: `${what.en} ↕`, es: `${what.es} ↕` }, type: 'number', min: 0, max: 1, step: 0.01 },
];

/** How much your video darkens behind cards, so they read well. */
export const dimParam: ParamDef = {
  key: 'dim',
  label: { en: 'Darken your video', es: 'Oscurecer tu video' },
  type: 'number',
  min: 0,
  max: 0.9,
  step: 0.05,
};
