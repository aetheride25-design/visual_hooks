// Word-by-word captions: pure logic (no React or DOM), tested with node --test.

/** A spoken word, with its time in milliseconds from the start of the video. */
export type CaptionWord = { text: string; startMs: number; endMs: number };

/**
 * What Whisper returns (via Remotion's `toCaptions`): one token per item, with a leading space if it starts a word.
 * `timestampMs` is when it is actually heard (DTW): more accurate than `startMs`, which just follows the previous token.
 */
export type RawToken = { text: string; startMs: number; endMs: number; timestampMs?: number | null };

/**
 * Joins Whisper tokens into words.
 * Whisper sometimes splits a word into pieces ("Clau" + "de"): a piece that doesn't start with a space joins the previous one.
 * Drops tags like "[Music]" or "(laughs)".
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

/** Ends a phrase: after these marks it's best to start a new page. */
const endsPhrase = (text: string) => /[.!?…,;:]$/.test(text);

/**
 * Groups words into "pages" (what is on screen at once):
 * - at most `maxWords` words,
 * - split at punctuation and at silences longer than `silenceMs`.
 * Each page lasts until the next one starts (or `lingerMs` after its last word if a silence follows).
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
  // Each page stays on screen until the next one, unless there's a long silence.
  return pages.map((p, i) => {
    const next = pages[i + 1];
    const end = p.endMs + lingerMs;
    return { ...p, endMs: next ? Math.min(Math.max(p.endMs, next.startMs), Math.max(end, p.endMs)) : end };
  });
};

/** Page visible at `ms` (or null if nobody is speaking then). */
export const pageAt = (pages: CaptionPage[], ms: number): CaptionPage | null =>
  pages.find((p) => ms >= p.startMs && ms < p.endMs) ?? null;

/** Index of the word being spoken at `ms` within the page (the last one spoken during a pause). */
export const activeWordIndex = (page: CaptionPage, ms: number): number => {
  let idx = -1;
  page.words.forEach((w, i) => {
    if (ms >= w.startMs) idx = i;
  });
  return idx;
};

/**
 * Changes a word's text without touching its timing.
 * An emptied word is removed; if you type two ("Claude Code"), they split its time.
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

/** Text as displayed: without the trailing comma or period, and uppercase if the style asks for it. */
export const displayText = (text: string, upper: boolean, stripPunct: boolean): string => {
  let t = stripPunct ? text.replace(/[.,;:…]+$/u, '') : text;
  if (upper) t = t.toLocaleUpperCase('es');
  return t;
};

/** SRT (00:01:05,300) or VTT (00:01:05.300) timestamp. */
const cueTime = (ms: number, sep: ',' | '.'): string => {
  const t = Math.max(0, Math.round(ms));
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return `${pad(Math.floor(t / 3_600_000))}:${pad(Math.floor(t / 60_000) % 60)}:${pad(Math.floor(t / 1000) % 60)}${sep}${pad(t % 1000, 3)}`;
};

/**
 * Caption lines for editors and YouTube: phrases of up to `maxWords` words,
 * split at punctuation and silences. `offsetMs` shifts everything (like the sync offset control).
 */
const cues = (words: CaptionWord[], maxWords: number, offsetMs: number) =>
  paginate(words, maxWords).map((p) => ({
    start: p.startMs + offsetMs,
    end: p.endMs + offsetMs,
    text: p.words.map((w) => w.text).join(' '),
  }));

/** .srt file (CapCut, DaVinci, Premiere). */
export const toSrt = (words: CaptionWord[], maxWords = 7, offsetMs = 0): string =>
  cues(words, maxWords, offsetMs)
    .map((c, i) => `${i + 1}\n${cueTime(c.start, ',')} --> ${cueTime(c.end, ',')}\n${c.text}\n`)
    .join('\n');

/** .vtt file (YouTube, web). */
export const toVtt = (words: CaptionWord[], maxWords = 7, offsetMs = 0): string =>
  'WEBVTT\n\n' +
  cues(words, maxWords, offsetMs)
    .map((c) => `${cueTime(c.start, '.')} --> ${cueTime(c.end, '.')}\n${c.text}\n`)
    .join('\n');

/** Minutes and seconds shown in the editor: 1:05.3 */
export const formatMs = (ms: number): string => {
  const s = Math.max(0, ms) / 1000;
  const m = Math.floor(s / 60);
  return `${m}:${(s - m * 60).toFixed(1).padStart(4, '0')}`;
};
