# abhandaru.com

Source code and assets for [abhandaru.com](https://abhandaru.com) are here.

## Development

The scene lives in `src/` and is bundled into `static/index.js` with Vite.

```bash
cd abhandaru-com
yarn install
yarn dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Production build

```bash
yarn build
```

This writes the bundled app to `static/index.js`. `index.html` still references `/static/index.js`, so production deploys stay the same.

## Deploy

`release/prod.sh` runs `yarn install --frozen-lockfile` and `yarn build` before uploading `index.html` and `static/` to S3.

GitHub Actions (`Deploy-Abhandaru` in `.github/workflows/merge.yml`) sets up Node 22 with Yarn cache, then runs the same release script.
