# le coding
# https://1mr4n4.github.io/Frcomp/

basic compiler, not so basic css

## Features

fnrech compiler

## Run locally

    npm install
    npm run dev

## Build

    npm run build 
    npm run preview


## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds `dist/`
and publishes it to GitHub Pages automatically
(<https://1mr4n4.github.io/Frcomp/>).

Manual fallback: `npm run deploy` (pushes `dist/` to the `gh-pages` branch).

## License

MIT
