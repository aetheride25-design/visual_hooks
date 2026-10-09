# Landing

The project's website: one static page, English and Spanish, no build step.

| File | What it holds |
|---|---|
| `index.html` | the page (English texts are written here too, for crawlers and no-JS visitors) |
| `i18n.js` | every text in English and Spanish |
| `effects.js` | the effect gallery: one line per effect |
| `config.js` | where the "Cloud version coming soon" email form posts (empty = the form isn't open yet) |
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

## Publish

`.github/workflows/pages.yml` publishes `site/` to GitHub Pages on every push to `main` that touches it,
once Pages is on (Settings → Pages → Source: GitHub Actions) and the repository variable `PAGES_ENABLED` is `true`.
