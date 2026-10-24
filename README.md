# quest-n-click-site

The showcase website of [Quest'n'Click](https://github.com/Quest-n-Click/quest-n-click), the open-source point-and-click
engine for the browser: what it does, the demos to play, the changelog and the whole documentation, in English and
in French. Live at [quest-n-click.cleverapps.io](https://quest-n-click.cleverapps.io).

Nothing of the engine is copied here. The site reads GitHub at run time:

- the latest release, its date and the repository's stars (hero, changelog);
- `CHANGELOG.md` at the latest tag (`/changelog`);
- the README's measured figures (`<!-- metric:… -->` markers, "In numbers");
- the documentation archive `quest-n-click-docs-<version>.tar.gz` of the latest release, or its latest revision
  (`docs-v<version>-r<n>`), rendered page by page in the site's own design with a search (`/docs`).

- the demo, `quest-n-click-v<version>-web.tar.gz` of the latest release that carries one (from 4.5.2): the sample
  game and the Studio demo built for `/demo/`, checked against the release's `SHA256SUMS`, served at `/demo/`
  and embedded by `/play`.

A release of the engine is enough: the release workflow calls `POST /api/revalidate` and the site loads the new
archives without a redeploy. Once an hour the site also checks on its own.

## Run it

```bash
npm install
QNC_DOCS_SOURCE=$(npm run -s docs:fetch) npm run dev     # the archive downloaded once into .cache/, then offline
npm run build && npm start                                # production, on $PORT (8080 by default)
npm run test:e2e                                          # Playwright, against `npm start`
```

Without `QNC_DOCS_SOURCE` the server resolves and downloads the archive itself at the first request for the docs.

| Variable | Role |
|---|---|
| `PORT` | the port `next start` listens on (Clever Cloud sets 8080) |
| `SITE_URL` | the public origin, for canonical URLs and Open Graph (default `https://quest-n-click.cleverapps.io`) |
| `GITHUB_TOKEN` | optional, raises the GitHub API limit from 60 to 5000 requests an hour |
| `REVALIDATE_SECRET` | the bearer token `POST /api/revalidate` expects |
| `QNC_DOCS_SOURCE` | a directory holding an extracted documentation archive, instead of GitHub |
| `QNC_DOCS_CACHE` | where downloaded archives are kept (default `.cache/qnc-docs`) |
| `QNC_DEMO_SOURCE` | a directory holding an extracted web archive (the game built for `/demo/`), instead of GitHub |
| `QNC_DEMO_CACHE` | where the downloaded demo is kept (default `.cache/qnc-demo`) |

## How it is made

Next.js 16 (App Router, React 19, TypeScript, Tailwind 4), served as a Node application on Clever Cloud.

- `app/[locale]/…`: the pages; English at the root, French under `/fr` (`proxy.ts` rewrites the root to `/en`).
- `lib/github.ts`: the GitHub reads, memoised in memory for an hour, with the last good answer kept on a failure.
- `lib/docs/`: the documentation store (`resolve.ts` finds the archive, `store.ts` downloads, extracts and serves
  it, `markdown.ts` renders the wiki's Markdown with its own markers: explicit anchors, `applies:` comments,
  `[!GUARANTEE]`, `[!LIMIT]` and `[!MEASURE]` blockquotes, generated regions).
- `lib/changelog.ts`: `CHANGELOG.md` parsed into versions and sections.
- `messages/`: the interface texts in both languages. `content/`: the gallery captions and the code excerpts.
- `scripts/screenshots.mjs`: screenshots of the main pages in both schemes and viewports.

## Deploy on Clever Cloud

```bash
clever create --type node --org <org> quest-n-click-site
clever env set CC_NODE_DEV_DEPENDENCIES install
clever env set CC_POST_BUILD_HOOK "npm run build"
clever env set REVALIDATE_SECRET "$(openssl rand -hex 32)"
clever domain add quest-n-click.cleverapps.io
clever deploy
```

The engine repository holds the same secret as `SITE_REVALIDATE_SECRET`; its workflow `site-revalidate.yml` calls
the site after each published release.

## Licence

MIT. The screenshots and the logo belong to the quest'n-click project (art under CC BY 4.0).
