# Pseudo-code Studio

Interactive interpreter for French/English algorithmic pseudo-code, built with React, Vite, TypeScript and Tailwind CSS. Write an algorithm in the editor, run it, follow the typed console output and answer the input prompts.

## Features

- French (`Saisir` / `Lire`) and English keyword sets
- Variables, assignments, conditions, loops, expressions
- Runtime and syntax errors reported with their line number
- Typewriter console output, input prompt, stop/clear/copy controls
- Keyboard shortcuts: `Ctrl + Enter` run, `Esc` stop, `Tab` indent
- Dark interface, responsive two-pane layout

## Run locally

    npm install
    npm run dev

## Build

    npm run build   # type-check + bundle into dist/
    npm run preview

## Deploy to GitHub Pages

1. In `vite.config.ts`, set `base: '/Frcomp/'` (use `'/'` only for a `<user>.github.io` repo).
2. `npm run deploy` (builds to `dist/` and pushes it to the `gh-pages` branch).
3. GitHub > Settings > Pages > Deploy from a branch > `gh-pages` / root.

## License

MIT
