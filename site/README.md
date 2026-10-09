# Landing

The project's website: one static page, English and Spanish, no build step.

| File | What it holds |
|---|---|
| `index.html` | the page (English texts are written here too, for crawlers and no-JS visitors) |
| `i18n.js` | every text in English and Spanish |
| `effects.js` | the effect gallery: one line per effect |
| `config.js` | where the "Cloud version coming soon" email form posts (`/api/waitlist`) |
| `api/waitlist.js` | Vercel function that adds the email to a Loops mailing list (tests in `tests/`) |
| `styles.css` | Aurora palette, same colors as the app |
| `media/` | demo, caption clips and one clip + poster per effect |

## Preview

```bash
cd site && python3 -m http.server 8088
```

Then open http://localhost:8088 (`?lang=es` forces Spanish).

## Add or refresh an effect clip

1. Start the app (`pnpm dev`) and drop the sample clip `site/media/sample-code-screen.mp4` into it.
2. Add the effect's line to `effects.js`.
3. Render its clip with the app itself:

   ```bash
   node site/scripts/render-media.ts sample-code-screen.mp4 my-effect
   ```

   Leave out the id to re-render all of them.

## Email list (Loops)

The form posts to `api/waitlist.js`, a Vercel function. It adds the email to one Loops **mailing list** and never
sets `userGroup`, so it doesn't touch contacts that other products in the same Loops account already have.
A contact that already exists is only added to the list. No welcome email is sent.

1. The Loops list **Hooks visuales** already exists (private is fine: the API key can add to it).
2. In Vercel: import the repo with **Root Directory** = `site`, and add two environment variables
   (see `.env.example`):
   - `LOOPS_API_KEY` (Loops → Settings → API)
   - `LOOPS_HOOKS_LIST_ID` = `cmv1i8zk10gxa0j10ety2c0uv`

On a host without functions (GitHub Pages, `python3 -m http.server`) the form just says the list opens soon.

```bash
node --test site/tests/*.test.js
```

## Publish

On Vercel (above), every push to `main` publishes it, and the email form works.

Or GitHub Pages, without the email form: `.github/workflows/pages.yml` publishes `site/` to GitHub Pages on every push to `main` that touches it,
once Pages is on (Settings → Pages → Source: GitHub Actions) and the repository variable `PAGES_ENABLED` is `true`.
