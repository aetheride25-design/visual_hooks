// Subtítulos palabra por palabra: lógica pura (sin React ni DOM), probada con node --test.

/** Una palabra dicha, con su tiempo en milisegundos desde el inicio del video. */
export type CaptionWord = { text: string; startMs: number; endMs: number };

/**
 * Lo que devuelve Whisper (vía `toCaptions` de Remotion): un token por elemento, con espacio delante si empieza palabra.
 * `timestampMs` es el instante en que de verdad suena (DTW): más exacto que `startMs`, que solo pega con el token anterior.
 */
export type RawToken = { text: string; startMs: number; endMs: number; timestampMs?: number | null };

/**
 * Junta los tokens de Whisper en palabras.
 * Whisper a veces parte una palabra en trozos ("Clau" + "de"): el trozo que no empieza con espacio se pega al anterior.
 * Descarta marcas como "[Música]" o "(risas)".
 */
export const wordsFromTokens = (tokens: RawToken[]): CaptionWord[] => {
  const words: CaptionWord[] = [];
  for (const tok of tokens) {
    const text = tok.text.replace(/\s+/g, ' ');
    if (!text.trim()) continue;
    const startsWord = words.length === 0 || /^\s/.test(text) || /^[¡¿]/.test(text.trim());
    if (startsWord) {
      const at = tok.timestampMs ?? tok.startMs;
      words.push({ text: text.trim(), startMs: Math.max(tok.startMs, Math.min(at, tok.endMs)), endMs: tok.endMs });
    } else {
      const last = words[words.length - 1];
      last.text += text.trim();
      last.endMs = Math.max(last.endMs, tok.endMs);
    }
  }
  return words.filter((w) => !/^[[(].*[\])]$/.test(w.text));
};

export type CaptionPage = { words: CaptionWord[]; startMs: number; endMs: number };

/** Cierra frase: después de estos signos conviene cambiar de página. */
const endsPhrase = (text: string) => /[.!?…,;:]$/.test(text);

/**
 * Agrupa las palabras en "páginas" (lo que se ve a la vez en pantalla):
 * - como mucho `maxWords` palabras,
 * - se corta en los signos de puntuación y en los silencios de más de `silenceMs`.
 * Cada página dura hasta que empieza la siguiente (o hasta `lingerMs` después de su última palabra si viene un silencio).
 */
export const paginate = (words: CaptionWord[], maxWords: number, silenceMs = 600, lingerMs = 400): CaptionPage[] => {
  const pages: CaptionPage[] = [];
  let current: CaptionWord[] = [];
  const flush = () => {
    if (current.length) pages.push({ words: current, startMs: current[0].startMs, endMs: current[current.length - 1].endMs });
    current = [];
  };
  words.forEach((w, i) => {
    current.push(w);
    const next = words[i + 1];
    if (!next || current.length >= Math.max(1, maxWords) || endsPhrase(w.text) || next.startMs - w.endMs > silenceMs) flush();
  });
  // Cada página se queda en pantalla hasta la siguiente, salvo que haya un silencio largo.
  return pages.map((p, i) => {
    const next = pages[i + 1];
    const end = p.endMs + lingerMs;
    return { ...p, endMs: next ? Math.min(Math.max(p.endMs, next.startMs), Math.max(end, p.endMs)) : end };
  });
};

/** Página visible en `ms` (o null si en ese momento no se habla). */
export const pageAt = (pages: CaptionPage[], ms: number): CaptionPage | null =>
  pages.find((p) => ms >= p.startMs && ms < p.endMs) ?? null;

/** Índice de la palabra que se está diciendo en `ms` dentro de la página (la última ya dicha si hay una pausa). */
export const activeWordIndex = (page: CaptionPage, ms: number): number => {
  let idx = -1;
  page.words.forEach((w, i) => {
    if (ms >= w.startMs) idx = i;
  });
  return idx;
};

/**
 * Cambia el texto de las palabras sin tocar sus tiempos.
 * Si la palabra queda vacía se borra; si escribes dos ("Claude Code"), se reparten su tiempo.
 */
export const editWord = (words: CaptionWord[], index: number, text: string): CaptionWord[] => {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  const w = words[index];
  if (!w) return words;
  const step = (w.endMs - w.startMs) / Math.max(1, parts.length);
  const replaced = parts.map((t, i) => ({
    text: t,
    startMs: Math.round(w.startMs + step * i),
    endMs: Math.round(w.startMs + step * (i + 1)),
  }));
  return [...words.slice(0, index), ...replaced, ...words.slice(index + 1)];
};

/** Texto como se muestra: sin la coma o el punto final y en mayúsculas si el estilo lo pide. */
export const displayText = (text: string, upper: boolean, stripPunct: boolean): string => {
  let t = stripPunct ? text.replace(/[.,;:…]+$/u, '') : text;
  if (upper) t = t.toLocaleUpperCase('es');
  return t;
};

/** Minutos y segundos para mostrar en el editor: 1:05.3 */
export const formatMs = (ms: number): string => {
  const s = Math.max(0, ms) / 1000;
  const m = Math.floor(s / 60);
  return `${m}:${(s - m * 60).toFixed(1).padStart(4, '0')}`;
};
