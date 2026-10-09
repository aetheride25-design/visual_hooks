# Mods: make your own effects

*[Leer en español](mods.es.md)*

A mod is an effect that lives in its own folder under `mods/`. The app finds it on its own: no need to touch the
app's code or `src/registry.ts`. It shows up in the gallery with a **MOD** badge (filter **Mods**), with its settings
on the right, and it exports to MP4, ProRes or PNG like any built-in effect.

## Make one in a minute

```sh
pnpm new-mod "my effect"
pnpm dev
```

That creates `mods/my-effect/index.tsx` from a template that already works (a word that pops in over your video).
Open the app, pick **Mods**, and edit the file: the preview updates as you save.

You can also copy the example, [`mods/sticker-slap/`](../mods/sticker-slap/index.tsx).

## What a mod looks like

```
mods/
  my-effect/
    index.tsx      ← exports an EffectDef (default or named export; several effects in one file work too)
    any-other-file.ts, images…  (optional, imported from index.tsx)
```

`index.tsx` exports an `EffectDef`: the same shape the built-in effects use.

| Field | What it is |
|---|---|
| `id` | unique, lowercase letters, digits and dashes (`my-effect`) |
| `name`, `description` | `{ en, es }` |
| `group` | `'hook'` (first seconds), `'support'` (cards, formats) or `'piece'` (standalone clip) |
| `usesMedia` | `true` if it draws your video or image |
| `defaultDurationSec` | how long it lasts by default |
| `defaults` | a value for every param; sample texts in English, Spanish ones in `localized.es` |
| `params` | the controls on the right: `text`, `color`, `number`, `select`, `boolean`, `media` |
| `component` | the React component that draws one frame |
| `author` | optional, shown on its card (e.g. `@your.handle`) |

Everything a mod needs is exported from **[`src/sdk.ts`](../src/sdk.ts)**: types, the animation helpers
(`timeOf`, `progress`, `lerp`, easings, `shake`…), the palette and fonts, and building blocks such as
`MediaBackdrop`, `MediaAt`, `KineticText`, `cardStyle` and `AppWindow`.

```tsx
import { timeOf, progress, MediaBackdrop, type BaseProps, type EffectDef } from '../../src/sdk.ts';
```

## The one rule: animate from time

Compute everything from `t = timeOf(useCurrentFrame(), p.fps, p.speed)`, the effect's time in seconds.
No `Date.now()`, `Math.random()`, `setTimeout` or CSS animations: the export renders frame by frame, and only
time-based math looks identical in the preview and the file. For randomness that's always the same, use `hash01(n)`.

## If something's wrong

A mod that can't load (wrong `id`, missing default, a name without `es`…) doesn't break the app: it's listed in red
under the gallery with the reason, and the other effects keep working. Fix it and save.

Folders starting with `_` (e.g. `mods/_draft/`) are skipped, handy for drafts.

## Sharing a mod

A mod is just a folder: share it as a GitHub repo or a gist, and others drop it into their `mods/`.
**Mods run code on your computer**, like any npm package: only add mods from people you trust, and read them first.

Made something good? Open a pull request adding your folder to `mods/`, or, if it should be a built-in effect,
move it to `src/effects/` and register it in `src/registry.ts` (see [CONTRIBUTING](../CONTRIBUTING.md)).
