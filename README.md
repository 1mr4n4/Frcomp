# Pseudo-code Studio

Interactive interpreter for French/English algorithmic pseudo-code (React + Vite + TypeScript + Tailwind).

## Run locally
    npm install
    npm run dev

## Deploy to GitHub Pages
1. In `vite.config.ts`, set `base: '/YOUR-REPO-NAME/'` (use `'/'` only for a `<user>.github.io` repo).
2. `npm run deploy` (builds to `dist/` and pushes to the `gh-pages` branch).
3. GitHub > Settings > Pages > Deploy from a branch > `gh-pages` / root.
