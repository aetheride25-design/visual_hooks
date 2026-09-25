// Emphasized text: write *word* to highlight it (accent color + italic serif).

export type Word = { text: string; accent: boolean };

export const parseWords = (raw: string): Word[] => {
  const words: Word[] = [];
  let accent = false;
  for (const token of raw.split(/\s+/).filter(Boolean)) {
    if (/^\*+$/.test(token)) continue;
    // [opening marks][*]word[*][closing marks], e.g. "¡*free*!" or "*excuses*."
    const m = /^([¡¿("'«]*)(\**)(.*?)(\**)([.,;:!?)"'»]*)$/.exec(token)!;
    const [, pre, open, core, close, post] = m;
    if (open) accent = true;
    const text = pre + core + post;
    if (text) words.push({ text, accent });
    if (close) accent = false;
  }
  return words;
};

/** Splits the text into lines (on line breaks), each with its words. */
export const parseLines = (raw: string): Word[][] =>
  raw
    .split(/\n/)
    .map(parseWords)
    .filter((l) => l.length > 0);
