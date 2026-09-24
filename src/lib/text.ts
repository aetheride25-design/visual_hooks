// Texto con énfasis: escribe *palabra* para destacarla (color de acento + serif itálica).

export type Word = { text: string; accent: boolean };

export const parseWords = (raw: string): Word[] => {
  const words: Word[] = [];
  let accent = false;
  for (const token of raw.split(/\s+/).filter(Boolean)) {
    if (/^\*+$/.test(token)) continue;
    // [signos de apertura][*]palabra[*][signos de cierre], p. ej. "¡*gratis*!" o "*excusas*."
    const m = /^([¡¿("'«]*)(\**)(.*?)(\**)([.,;:!?)"'»]*)$/.exec(token)!;
    const [, pre, open, core, close, post] = m;
    if (open) accent = true;
    const text = pre + core + post;
    if (text) words.push({ text, accent });
    if (close) accent = false;
  }
  return words;
};

/** Parte el texto en líneas (separadas por salto de línea), cada una con sus palabras. */
export const parseLines = (raw: string): Word[][] =>
  raw
    .split(/\n/)
    .map(parseWords)
    .filter((l) => l.length > 0);
