# Contributing

**English** · [Español](CONTRIBUTING.es.md)

Thanks for wanting to help! The easiest way in is a new hook: each one is a single file.

## How to send a change

1. **Fork** this repo (your own copy on GitHub) and clone it.
2. Create a branch: `git checkout -b my-new-hook`.
3. Install and run the app:
   ```sh
   pnpm install
   pnpm dev   # http://localhost:3210
   ```
4. Make your change. For a new effect, follow [Add a new effect](README.md#add-a-new-effect).
5. Check that everything passes:
   ```sh
   pnpm test
   pnpm typecheck
   ```
6. Push your branch and open a **pull request** against `main`. Say what it does and, if it's visual, attach a
   screenshot or a short clip.

The maintainer reviews every PR and may ask for changes before merging it.

## Where to start

- [Good first issues](docs/good-first-issues.md): hook ideas with a starting file and a "done when" list.
- Found a bug or have an idea? Open an **issue** first so we can talk about it.

## A few rules

- Animate only from the frame (`useCurrentFrame`), never `Date.now()`, `Math.random()` or CSS animations: the render must
  match the preview frame by frame.
- Names, descriptions and labels are `{ en, es }` so the app works in both languages.
- One effect per PR keeps reviews quick.
