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

**Defect filed as TASK-016 (medium):** `docs/imagery-brief.md` quotes the real Windows username (`matthew.williams`), the local path (`D:\Documents\Projects\FlyByFlyBuys`), the client name "Fly by FlyBuys" and a sandbox name. Those strings are in the committed brief on this branch and in `main` history from TASK-010/011. The screenshots are clean; the brief is not.

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
