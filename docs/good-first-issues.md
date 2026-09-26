# Good first issues

Drafts to open on GitHub with the `good first issue` label. Each one adds a new hook by following
[Add a new effect](../README.md#add-a-new-effect).

---

## 1. New hook: `emoji-burst`

**What it looks like**: 12–20 emojis (🔥 by default) burst out of a point you pick, spin and fall with gravity, in about 1 s.
Your capture stays behind, optionally dimmed.

**Where to start**
- Copy `src/effects/hooks/ArrowCircle.tsx` for the "pick a point" params (`focusX`, `focusY`) and the dimmed backdrop.
- Use the deterministic helpers in `src/lib/particles.ts` for directions and speeds. No `Math.random()`: the render must match the preview frame by frame.

**Params**: emoji (text), count (number), spread (number), gravity (number), `showMedia` + `dim`.

**Done when**
- It shows up in the app under "Visual hooks" with `{ en, es }` name, description and labels.
- `pnpm test` and `pnpm typecheck` pass, and an MP4 and a ProRes export look the same as the preview.

---

## 2. New hook: `progress-bar`

**What it looks like**: a thick loading bar races to 99 %, stalls for a beat, then snaps to 100 % with a flash and a label
("Deploying…" → "Live ✅").

**Where to start**
- Copy `src/effects/support/BigNumber.tsx` for the counting number (`countValue` and `formatNumber` in `src/lib/anim.ts`).
- Timing is plain math on `t`; `progress()` and the easing functions in `src/lib/anim.ts` cover it.

**Params**: label while loading, label when done, stall time (s), color, bar width.
Sample copy in English in `defaults`, in Spanish in `localized.es` ("Publicando…" → "En vivo ✅").

**Done when**
- The bar never goes backwards and lands exactly on 100 % at the chosen second.
- Tests for any new pure helper you add in `src/lib/` (e.g. the stall curve), plus `pnpm test` and `pnpm typecheck`.

---

## 3. New hook: `search-bar`

**What it looks like**: a clean search box drops in, a query types itself ("how to build an app in 10 minutes"), the
Enter key flashes and a result card pops underneath.

**Where to start**
- `src/effects/hooks/PromptTyping.tsx` already types text with a blinking cursor (`typedText`, `typingEnd` and
  `cursorOn` in `src/lib/anim.ts`). Reuse those; the new part is the box, the Enter flash and the result card.
- Use `cardStyle()` from `src/components/media.tsx` so it matches the other cards.

**Params**: query (text), result title (text), typing speed (chars/s), color, `showMedia` + `dim`.

**Done when**
- Accents and emojis type one character at a time (no half characters).
- It works with the "Effect only" and "Apply to my video" modes; `pnpm test` and `pnpm typecheck` pass.
