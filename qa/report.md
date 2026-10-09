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

- **Pending: TASK-003 script-order assertion.** The PM's follow-up (Frontend Lead) is not present in `tests/` yet (grep for "script-order" finds nothing). Re-run once it lands.

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
