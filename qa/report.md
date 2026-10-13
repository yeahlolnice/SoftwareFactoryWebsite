# QA report: TASK-007 end-to-end browser tests and visual review

Scope: Playwright suite in `tests/e2e/site.spec.ts` (config `playwright.config.ts`), run against `astro preview` serving the production build in `dist/`. Browser: Chromium (Desktop Chrome profile), Playwright 1.48.2.

## What was run

| Command | Result |
| --- | --- |
| `npm install` | OK |
| `npm install --save-dev @playwright/test@1.48.2 @axe-core/playwright@4.10.1` | OK |
| `npm run build` | OK, 2 pages built (`/`, `/404`) |
| `npx playwright test --reporter=list` (first run) | 15 passed, 1 failed (test bug, see below); fixed |
| `npx playwright test --reporter=list` (final run) | **16 passed** (39.6s) |
| `npm test` (`build && node --test tests/ && playwright test`) | **Exit 1**: node suite 35 pass, 2 fail; Playwright step not reached because the chain stops at the first failure |
| Standalone CSP check (nginx CSP applied to preview response via `page.route`) | 5 CSP violations on `/` (see BUG-001) |
| Element and crop screenshots at 360/768/1280 for visual review | Reviewed, see Visual review |

### Playwright results (final run)

All 16 tests passed on the final run:

- page load: no console errors, page errors, HTTP >= 400 responses or failed requests (`/`)
- navigation: every nav link has a matching section id; nav anchors scroll their section into view at 1280px and at 360px (menu opened first); download CTA has an href
- FAQ: all 7 items open and close
- responsive: no horizontal overflow at 360, 768 and 1280px
- screenshots: full-page captures at 360, 768 and 1280 saved to `qa/screenshots/home-{width}.png`
- reduced motion: with `reduce`, the app-mock log does not change over 3.2s and no animation is running; with `no-preference`, the log changes
- axe-core (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`): zero violations at 360px and 1280px

Note: the first version of the reduced-motion test used `test.use({ reducedMotion })` in a nested describe. That setting did not reach the page (`matchMedia` returned false), so the test was changed to `page.emulateMedia`. The first run's failure was in the test harness, not the site.

### Node suite (`node --test tests/`, run via `npm test`)

35 pass, 2 fail:

- `mock data: log is long enough to stream and counts agree` (`tests/mock-data.test.mjs:5`), see BUG-002
- `built pages have no inline styles (style-src is self-only)` (`tests/security-headers.test.mjs:33`), see BUG-001

## Bugs

- **BUG-001 (high): production CSP blocks the app mock's inline `style` attributes.**
  - Steps: `npm run build && npm run preview`. Load `/` in Chromium with the response header from `nginx.conf:47` applied (`style-src 'self'`, no `unsafe-inline`). Read the console.
  - Actual: 5 "Refused to apply inline style ... style-src 'self'" errors on the home page. The app mock's progress bars use markup like `<span class="am-fill" style="--p:0.7;--p0:0.7">` (`src/components/AppMock.astro`), and those style attributes are blocked. The visual impact on bar widths was not measured.
  - Expected: the site loads with no CSP violations under the production headers.
  - Suggested fix (owner: Frontend Lead): move per-element values into CSS classes or set them with `element.style.setProperty` from the existing inline script. Do not add `unsafe-inline` to `style-src`.
  - Also failing: `tests/security-headers.test.mjs` test "built pages have no inline styles" (`dist/index.html contains a style attribute`).

- **BUG-002 (medium): `tests/mock-data.test.mjs` first assertion is broken, not the data.**
  - Steps: `node --test tests/mock-data.test.mjs`.
  - Actual: `mock.log needs enough lines...` fails. The test locates the log with `src.indexOf("statusBar: {\n      working")`, which returns -1 because `src/data/site.ts:289` has `statusBar: {` followed by a different layout, so the slice is empty and the count is 0.
  - Expected: the test counts the 16 mock log entries in `src/data/site.ts` (lines 272 onward) and passes.
  - Suggested fix (owner: test author for TASK-003): anchor the search on the `log: [` block boundaries that actually exist in the file.

- **BUG-003 (low): Agent team grid leaves an empty cell at 768px.**
  - Steps: load `/` at 768px width and screenshot `#team`.
  - Actual: 3 + 3 + 2 cards. The last row's two cards sit left-aligned with an empty third column.
  - Expected: a balanced layout (for example 2 columns at 768, or centred last row). Whether this is acceptable is a design call.

- **BUG-004 (info, owner: Project Manager / product owner): placeholder content is live.**
  - Hero shows `v0.0.0 (placeholder) · Windows 10/11, 64-bit`.
  - The download CTA href is `https://example.com/downloads/software-factory-setup.exe` (`src/data/site.ts:165`). The test verifies the href exists, not that it resolves to a real file.

- **Resolved: TASK-003 script-order assertion.** Added as `no-preference: log lines appear in script order` in `tests/e2e/site.spec.ts` and passing in the Playwright run.

## Visual review

Reviewed at full resolution: hero at 1280px and 360px, the compact app mock and "How it works" at 360px, Features and Agent team at 768px. The 768px full-page and 360px full-page screenshots were reviewed at reduced scale. Not every section was inspected at full resolution.

- No clipping, overlap or text overflow found in the sections above.
- The "Skip to main content" link appeared in one element screenshot. It was not reproduced in a real viewport: its computed position is `top: -91px` with `translateY(-200%)` (`src/styles/global.css:127`), so it stays hidden. The capture artifact is not a defect.
- The sticky header overlaps section headings in element screenshots. This is a capture artifact of sticky headers, not a defect.
- Findings are BUG-003 and BUG-004 above.

## Environment

- Chromium from `/ms-playwright`, Playwright 1.48.2, Node v20.18.0.
- Test artifacts: `test-results/` and `playwright-report/` added to `.gitignore`.
- `package.json`: added `@playwright/test@1.48.2` and `@axe-core/playwright@4.10.1`; `test` script now also runs `playwright test`; added `test:e2e`. The existing `playwright@1.48.2` devDependency was left in place.

## TASK-008 resolution

| Item | Status |
| --- | --- |
| BUG-001 (high) CSP blocks inline styles | **Fixed.** AppMock progress bars use `data-p` / `data-p0` attributes with CSS rules in `appmock.css`; no `style=` attributes in built HTML. The mock's script moved to `src/scripts/app-mock.js` and Astro now emits all scripts as external files (`assetsInlineLimit: 0`), so `nginx.conf` only needs the hash of the `html.js` marker. New e2e test applies the nginx CSP and asserts no violations, that bars have a `--p` value and that the stream starts. |
| BUG-002 (medium) mock-data test anchor | **Fixed.** The test now anchors on the `log: [` block and normalises CRLF line endings. |
| BUG-003 (low) 3+3+2 team grid at 768px | **Fixed.** Agent team grid is 2 columns from 640px and 4 from 1024px, so 8 cards fill evenly. |
| BUG-004 (info) placeholder content | **Deferred to the product owner** (real download URL, version, product name need owner input). Documented in `README.md` and the `PLACEHOLDERS` list in `src/data/site.ts`. |
| TASK-003 script-order assertion | **Added** (`log lines appear in script order`). |

Results: `npm run build` OK; `node --test tests/` 38 pass, 0 fail; `npx playwright test` 18 passed.

# TASK-013: imagery visual and functional check

Scope: the five WebP screenshots in `public/images/screenshots/`, the SVG diagrams and feature graphics, and the page layout at 360, 768 and 1280px. Browser: Chromium, Playwright 1.48.2, against `astro preview` of the production build.

## What was run

| Command | Result |
| --- | --- |
| `npm test` (`build && node --test tests/ && playwright test`) | **Exit 0**. Build OK; `node --test` 42 pass, 0 fail; Playwright 20 passed |
| Element-level load check at 360 (DPR 2), 768 (DPR 1 and 2) and 1280 (DPR 1 and 2) | All 7 `<img>` elements `complete` with non-zero `naturalWidth`; no failed requests; no console errors or warnings |
| Horizontal overflow check (`document.documentElement.scrollWidth` vs viewport) | 360, 768 and 1280, at DPR 1 and 2: scrollWidth equals viewport width. No horizontal scroll |
| Visual review of the five shipped WebP files at source resolution | See Redaction below |
| Visual review of 360px rendered figures (billing, tasks board) | See Legibility below |

Methodology note: an early pass reported `roles.webp` and `agent-team.svg` as not loaded at 360 and 768. That was a measurement artifact. `global.css` sets `scroll-behavior: smooth`, so a scripted `scrollTo` never reached the lazy images. Re-measured with `scrollIntoView` per element, all images load. No defect filed.

Side effect: `npm test` regenerates `qa/screenshots/home-{360,768,1280}.png`. Those regenerated baselines were not committed; they were restored from git. Whether to accept them is still open (see below).

## Image loading and eager/lazy

- `overview.webp` is `loading="eager"` (Hero). The other six images are `lazy`. Matches `tests/images.test.mjs`.
- All images load. No broken or 404 responses.

## Sizing and blur

| Image | Natural px | Displayed CSS px at 1280 | Upscale at DPR 2 (1280) | Displayed CSS px at 360 | Scale at 360 |
| --- | --- | --- | --- | --- | --- |
| overview.webp | 964 | 958 | 1.99x | 318 | 0.33x |
| billing-costs.webp | 1203 | 958 | 1.59x | 318 | 0.26x |
| agent-chat.webp | 628 | 626 | 1.99x | 318 | 0.51x (1.01x at DPR 1, 768 width) |
| tasks-board.webp | 1203 | 958 | 1.59x | 318 | 0.26x |
| roles.webp | 1200 | 958 | 1.60x | 318 | 0.27x |

- At DPR 1 nothing is upscaled above about 1x. At DPR 2 the WebP screenshots are upscaled about 1.6–2.0x, so their text is soft on high-DPI screens. **Filed as TASK-015 (medium).**
- The SVG diagrams are vectors, so the upscale ratio does not apply.

## Redaction (shipped WebP files, checked at source resolution)

- `overview.webp`: no usernames or real paths. Shows `D:\Projects\acme-storefront` and "Acme Storefront", which are demo names. OK.
- `agent-chat.webp`: no usernames or paths. The message text is an internal engineering exchange ("worktree path is a host problem", "TASK-006"). No personal data. OK. The alt text says the PM "keeps the work moving". It does not show a human escalation, which the imagery brief originally described. Acceptable, but the brief and alt text should agree.
- `billing-costs.webp`: demo project names (Acme Storefront, Demo — Task Manager). **Real spend figures are shown** ($30.97, $11.56, $0.4655, $30.9662 and token counts). The owner has not yet confirmed these can be public. This is the existing TODO(PO) in `src/data/site.ts`. It is an owner decision, not a QA defect, but it blocks public use of this image.
- `tasks-board.webp`: shows "Software Factory Website" (the product name, fine), internal TASK-011/012/013 card text and model names. No personal data. The Review column is cut off (see below).
- `roles.webp`: no personal data. OK.
- No API keys, tokens, emails or usernames visible in any of the five shipped images.

**Defect filed as TASK-016 (medium):** `docs/imagery-brief.md` quoted a real Windows username, a local project path, a client project name and a sandbox name (values omitted here on purpose). Those strings are in the committed brief on this branch and in `main` history from TASK-010/011. The screenshots are clean; the brief is not.

## Legibility at 360px (mobile)

Viewed the rendered billing and tasks-board figures at 360px, DPR 2:

- The billing usage table text is roughly 3–4 CSS px tall and cannot be read.
- The tasks-board sidebar and cards cannot be read either.

Page layout is correct (no horizontal scroll), but the screenshots are not legible at this width. **Filed as TASK-014 (medium).**

## Cropping

- `tasks-board.webp`: the image ends mid-way through the Review column. The card "Design brief: product imagery and screenshot showcase plan" is cut mid-word. Its priority badge reads "hi" and its cost line reads "$0.80 / $". **Filed as TASK-017 (low).**
- Other four crops: no clipped text found at source resolution. `overview.webp` ends cleanly at the stat tiles. `billing-costs.webp` ends at the footnote. `roles.webp` ends at the last card row.

## Layout and overflow

- No horizontal scroll at 360, 768 or 1280, DPR 1 or 2.
- `.am-glow` extends past the viewport (right edge at 372px at 360 width). It is clipped by an ancestor with `overflow: hidden`; document scrollWidth is unaffected, so it is not a defect.

## Defects filed (follow-up tasks)

| Task | Severity | Owner | Summary |
| --- | --- | --- | --- |
| TASK-014 | medium | frontend_developer | Screenshots illegible at 360px |
| TASK-015 | medium | frontend_developer | Screenshots upscaled about 2x on retina; add 2x sources / srcset |
| TASK-016 | medium | ui_ux_designer | `docs/imagery-brief.md` quotes real username, client path and project name |
| TASK-017 | low | ui_ux_designer | `tasks-board.webp` cut mid-card at right edge |

## Open decisions (not defects)

- Owner must confirm the billing screenshot's real spend figures can be public (TODO(PO) in `src/data/site.ts`).
- PM/QA still need to confirm the regenerated `qa/screenshots/` baselines are intended. `npm test` overwrites them; they were not committed.
- Git history still contains the real username and client name in `docs/imagery-brief.md`. Removing them from history would need a rewrite, which is the PM's call.

# TASK-025: sizzler video QA and Lighthouse-style pass

Scope: the built site (`npm run build`, `astro preview`) and the rendered video in `public/video/`. Browsers: Chromium, Firefox and WebKit from `/ms-playwright` (Playwright 1.48.2). ffmpeg and ffprobe were fetched with the repo's own `ensureFfmpeg()` into `tools/sizzler/.bin/` (git-ignored) so the probe tests actually run. The reviewer model for the frame review was Haiku 5.5. The task asked for Opus 5.5, so the frame and copy review should be repeated on Opus if the PM wants that tier.

## Result

| Check | Result |
| --- | --- |
| `npm test` (build, node tests, Playwright) | Build OK. `node --test tests/`: **65 pass, 0 fail, 0 skipped** (the 5 ffprobe tests run once ffprobe is present). Playwright: **31 passed** with `--workers=2`. The default-worker run is flaky (see Test stability). |
| Video codec, size and length | `sizzler.mp4`: H.264 High, 1920x1080, yuv420p, 30 fps, 1200 frames, 40.0 s, 7.9 MB. `sizzler.webm`: VP9, 1920x1080, yuv420p, 30 fps, 40.0 s, 3.2 MB. Both decode end to end with `ffmpeg -v error -f null` and no errors. `sizzler-poster.webp`: 1920x1080 WebP. |
| Cross-browser playback (explicit Play, `currentTime` advances) | Chromium: plays (WebM; the Playwright Chromium build has no H.264, so the MP4 fallback was not exercised here). Firefox: plays. WebKit: plays. All show 1920x1080 and no `error`. |
| Poster before play | Poster, play button and `data-state="poster"` present in all 3 engines at 1280 px (screenshot checked). Mobile Chromium at 360 and 390 px: frame is 16:9 (ratio 0.563), no horizontal overflow. |
| Reduced motion | `reduce`: no autoplay, no media request in view, controls hidden. Keyboard Enter on Play starts playback with sound and captions shown, and the play button hides. Same result in Chromium, Firefox and WebKit. |
| Autoplay when in view (no-preference) | Muted, looped, controls on, only while in view; pauses when scrolled away. Same in all 3 engines. |
| Accessibility | axe (wcag2a/aa, wcag21a/aa) on the video section at both motion settings: 0 violations (Chromium). Keyboard: Play is reachable and Enter starts playback in all 3 engines. Transcript `<details>` is text. |
| No video request before interaction or visibility | **FAIL in WebKit.** Chromium and Firefox: 0 media requests before the video is in view. WebKit: `sizzler.webm` is requested at load, with the video about 1650 px below the fold. See BUG-005. |
| No CLS | Chromium: CLS 0.0000 over a full scroll of the page at 1280 and 390 px. |
| First load / LCP / weight (Chromium) | First load 58 KB over 10 requests, no video request. Poster (35.6 KB) and VTT (0.6 KB) are fetched at load; the poster is an image and is not video bytes, but it could be lazy-loaded. LCP is the H1 at 172 ms (desktop) and the hero paragraph at 131 ms (390 px). The video does not affect LCP. |
| Mobile WebKit (iPhone 13 emulation) | **Page `load` never fires** and the play button is unreachable with the video present. See BUG-006 (not verified on a real iOS device). |

## Frame and copy review

Reviewed a 4x4 contact sheet of the MP4 (every 2.5 s), the poster, full-resolution frames at 16.5 s, 27.5 s and 37.5 s, and the caption file.

- No typos in the on-screen copy or in `sizzler.vtt`.
- No clipped headlines or cards. Mid-typing log text ("nav.", "Softwa") is intentional kinetic typography.
- Colours stay on the token palette (dark ground, green accent, amber DevOps, blue Frontend, purple SEO).
- **Real data (owner decision, not a render defect):** the billing frame at about 30 s shows the same spend figures as `billing-costs.webp` ($30.97, $11.56, $0.47, $0.40, $0.00, $0.00). The existing TODO(PO) in `src/data/site.ts` (line 16) covers this and applies to the video too. The overview frames and the poster show the path `D:\Projects\acme-storefront` and the project name "Acme Storefront". There is no username in the video, and "Acme Storefront" was treated as a demo name in the TASK-013 review. The PO should confirm the path and name are fine to publish.
- Overlapping cues: see BUG-007.

## Bugs filed (this run)

- **BUG-005 (high, TASK-027, frontend_developer): WebKit requests `sizzler.webm` before interaction.** Repro: `qa/sizzler-browser-probe.mjs` (webkit `mediaBeforeInView`). Chromium and Firefox make no request. The WebKit load event takes about 3.5 s versus about 0.2 s elsewhere, which fits a full WebM download (not byte-verified). Fix: keep `<source>` children out of the markup until play or in-view (e.g. `data-src`, set in `src/scripts/sizzler.js`).
- **BUG-006 (medium, TASK-028, frontend_developer): WebKit iPhone 13 emulation never reaches `load`.** The DOM is fully parsed, but `readyState` stays `interactive`, module scripts do not run and the play button is unreachable. Minimal-page bisect: a preload=none video with a source loads in about 3 s, but adding `controls` or a `<track>` makes it hang; removing all `<source>` children unblocks it. The stderr shows "Button failed to load, iconName = invalid-placard", which suggests the WebKit-GTK media-control icons on Linux. **Not verified on iOS Safari.** Needs a real iOS device or a device farm before it is treated as a user bug.
- **BUG-007 (low, TASK-029, frontend_developer): overlapping caption cues.** Several cues overlap in `public/video/sizzler.vtt` (for example 00:02.800–00:04.267 with 00:03.000–00:04.667, and 00:09.200–00:14.967 with 00:09.400–00:11.000). Two captions show at once when the track is on. Fix in the render timings, not by hand-editing the video.
- **BUG-008 (low, TASK-030, ui_ux_designer): poster has a non-clickable "Download for Windows" pill.** It is burned-in image pixels above the real Play control. Remove it from the poster or make it the real download button.

## Test stability

The first full `npm test` (default workers) failed 3 to 5 Playwright tests each run (teardown timeouts and "Target page, context or browser has been closed"). The failing set changed between runs (nav anchor 360, imagery 390, CTA showcase, sizzler axe, sizzler poster-first). Each one passed on rerun, and the full suite passed 31/31 with `--workers=2`. The cause is load on this 22-core sandbox with video decoding in parallel, not an assertion. Suggested fix (DevOps/QA): set `workers` in `playwright.config.ts` to a fixed low number on CI and locally, and reduce the per-test timeout pressure for the sizzler tests.

## Notes

- `qa/sizzler-browser-probe.mjs` is the repro for BUG-005 and BUG-006. It prints JSON and needs the preview server on port 4400.
- The regenerated `qa/screenshots/home-*.png` from `npm test` were restored from git and not committed. The baselines are still an open decision (see the TASK-013 section).
- Chromium here cannot decode H.264, so MP4 playback is verified only by ffprobe and full decode, not by a browser. Real Chrome and Safari should be checked on the MP4 path.
