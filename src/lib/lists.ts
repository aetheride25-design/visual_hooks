// Text the user types as "one per line" (list items, poll options), turned into data. Pure logic, no React.

/** Non-empty trimmed lines, at most `max`. A leading "1." / "-" / "•" is dropped (the effect numbers them). */
export const parseList = (raw: string, max: number): string[] =>
  raw
    .split('\n')
    .map((l) => l.trim().replace(/^(\d+[.)]|[-•*])\s+/, ''))
    .filter(Boolean)
    .slice(0, max);

export type PollOption = { label: string; pct: number };

/**
 * "Option | 62" per line. Percentages are scaled so they add up to 100 (and rounded so the shown numbers do too);
 * options without a number split what's left evenly.
 */
export const parsePoll = (raw: string, max = 4): PollOption[] => {
  const rows = parseList(raw, max).map((l) => {
    const [label, value] = l.split('|').map((s) => s.trim());
    const n = Number(String(value ?? '').replace('%', ''));
    return { label, value: value !== undefined && Number.isFinite(n) && n >= 0 ? n : null };
  });
  if (!rows.length) return [];
  const given = rows.reduce((s, r) => s + (r.value ?? 0), 0);
  const missing = rows.filter((r) => r.value === null).length;
  const rest = Math.max(0, 100 - given);
  const raws = rows.map((r) => (r.value ?? (missing ? rest / missing : 0)));
  const total = raws.reduce((s, v) => s + v, 0) || 1;
  const exact = raws.map((v) => (v / total) * 100);
  // Largest remainder: rounded values that still add up to exactly 100.
  const floors = exact.map(Math.floor);
  let left = 100 - floors.reduce((s, v) => s + v, 0);
  const order = exact.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) if (left-- > 0) floors[i]++;
  return rows.map((r, i) => ({ label: r.label, pct: floors[i] }));
};

/** Index of the option with the highest share (the first one on a tie). */
export const winnerOf = (options: PollOption[]): number =>
  options.reduce((best, o, i) => (o.pct > options[best].pct ? i : best), 0);
