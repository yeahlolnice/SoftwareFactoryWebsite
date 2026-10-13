# Software Factory website

Static marketing site for the Software Factory Windows desktop app (a tool for managing a team of AI agents that completes a whole project). Built with Astro (static output), TypeScript and plain CSS; no client framework. Served by nginx in Docker.

## Requirements

Node.js 20+ and npm. Playwright's Chromium and WebKit for the browser tests (`npm run test:setup`).

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve `dist/` locally (used by the browser tests) |
| `npm test` | `build`, then `node --test tests/` (unit/static checks), then `playwright test` (browser, axe, CSP) |
| `npm run test:e2e` | Browser tests only (needs a built `dist/`) |
| `npm run render:sizzler` | Re-render the sizzler video into `public/video/` (see below) |

## Editing content

All copy, links and the mock-app data live in `src/data/site.ts`. Components only format that data. Change text there and rebuild; no component edits are needed.

- The `PLACEHOLDERS` list at the top of the file names every value the owner still has to confirm; each is also marked `TODO(PO)` next to its value.
- The animated hero app mock reads `mock.*` in the same file. Progress values must be multiples of 10 (a test checks this, because bar widths are CSS classes, not inline styles).
- Design tokens are in `src/styles/tokens.css`; the design spec is `docs/design.md`.

## Sizzler video

`public/video/sizzler.mp4` (H.264), `sizzler.webm` (VP9), `sizzler-poster.webp` and `sizzler.vtt` are generated from `tools/sizzler/` (render-only, not part of the site build), which implements `docs/sizzler-storyboard.md`.

- `tools/sizzler/scene.html` + `scene.js` is a deterministic scene: every frame is a pure function of the frame number (`window.SIZZLER.seek(f)`). Open it in a browser with `?f=<frame>` to inspect a frame, or `?play` to preview.
- `npm run render:sizzler` steps all 1200 frames (40 s at 30 fps) in Playwright Chromium, then encodes with ffmpeg. ffmpeg/ffprobe come from `$FFMPEG_PATH`/`$FFPROBE_PATH`, `tools/sizzler/.bin/` or `PATH`; on Linux x64 a static build is downloaded into `.bin/` if none is found. A full render takes several minutes.
- Stills only: `node tools/sizzler/render.mjs --frames 0,450,1140 --out /tmp/stills`.
- Copy, timings and screenshots are in `scene.js`; the screenshots come from `public/images/screenshots/`. Re-render after changing any of them, then run `node --test tests/sizzler.test.mjs` (checks size, codec, resolution, fps and duration).

## Docker

```sh
docker build -t software-factory-website .
docker run --rm -p 8080:80 software-factory-website   # http://localhost:8080
# or
docker compose up --build
```

The image builds the site with Node and serves `dist/` with `nginx.conf`, which sets the security headers, including a strict CSP (`style-src 'self'`, no inline styles). The only executable inline script is the tiny `html.js` marker in `src/layouts/Base.astro`, allowed by hash. If you edit it, regenerate its `sha256` in `nginx.conf`; `tests/security-headers.test.mjs` fails when the hash drifts. The page also contains two inline `application/ld+json` blocks (SEO structured data); these are data, not executed, so CSP `script-src` does not apply to them. All other scripts are bundled as external files.

## Owner-supplied items (not yet provided)

1. Real download URL: `download.url` is `https://example.com/downloads/software-factory-setup.exe`. Also set the real `download.version`; the hero currently shows "v0.0.0 (placeholder)".
2. Screenshots: none supplied. The hero uses a CSS-only app mock. Real screenshots can be added under `public/` and wired in via `src/data/site.ts` and the components. A product-specific `public/og.png` (social preview) is also worth replacing.
3. Product name, company name, tagline: `productName`, `companyName`, `tagline` are placeholders.
4. Site URL: `siteUrl` is `https://example.com`; it drives the canonical URL, sitemap, robots.txt and structured data.
5. Analytics: none is installed. Adding a provider requires updating the CSP in `nginx.conf` (`script-src`, `connect-src`) and the privacy wording.
6. Copy to confirm: How it works steps, feature claims, FAQ answers (platforms, code safety, pricing, support), system requirements (RAM/storage), support/contact text.

## QA

`qa/report.md` holds the latest QA report, including the status of every bug. Full-page screenshots are written to `qa/screenshots/` by the browser tests.
