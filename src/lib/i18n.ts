// Languages of the app. Pure logic (no React, no DOM) so it can be tested with node --test.

export type Lang = 'en' | 'es';
export const LANGS: Lang[] = ['en', 'es'];

/** A piece of text shown to the user, in every language. */
export type Text = Record<Lang, string>;

/** Text that is the same in every language (a number, a brand, "MP4") can stay a plain string. */
export type Label = Text | string;

export const tr = (label: Label, lang: Lang): string => (typeof label === 'string' ? label : label[lang]);

/** First language in the browser's list that the app speaks; English otherwise. */
export const detectLang = (preferred: readonly string[]): Lang => {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0];
    if ((LANGS as string[]).includes(base)) return base as Lang;
  }
  return 'en';
};

/** Fills `{name}` placeholders: fill('Starts at {s} s', { s: 2 }) → 'Starts at 2 s'. */
export const fill = (template: string, vars: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (m, key: string) => (key in vars ? String(vars[key]) : m));
