import { test, expect, type ConsoleMessage, type Page, type Response } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, readFileSync } from 'node:fs';

const WIDTHS = [360, 768, 1280] as const;
const MOBILE_MAX = 1023;
const SCREENSHOT_DIR = 'qa/screenshots';

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()} (${msg.location().url})`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('response', (res: Response) => {
    if (res.status() >= 400) errors.push(`HTTP ${res.status()}: ${res.url()}`);
  });
  page.on('requestfailed', (req) => {
    errors.push(`requestfailed: ${req.url()} (${req.failure()?.errorText})`);
  });
  return errors;
}

async function navHrefs(page: Page) {
  return page.locator('header nav a[href^="#"]').evaluateAll((as) =>
    as.map((a) => a.getAttribute('href') as string),
  );
}

test.beforeAll(() => {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

test.describe('page load', () => {
  test('loads with no console errors, page errors or failed requests', async ({ page }) => {
    const errors = collectErrors(page);
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await page.waitForLoadState('load');
    expect(errors).toEqual([]);
  });
});

test.describe('navigation', () => {
  test('nav links exist and every target section exists', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    const hrefs = await navHrefs(page);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      await expect(page.locator(`[id="${href.slice(1)}"]`)).toHaveCount(1);
    }
  });

  for (const width of [1280, 360]) {
    test(`nav anchors scroll their section into view at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      const hrefs = await navHrefs(page);
      for (const href of hrefs) {
        if (width <= MOBILE_MAX) await page.locator('.menu-toggle').click();
        await page.locator(`#primary-nav a[href="${href}"]`).click();
        await expect(page).toHaveURL(new RegExp(`${href}$`));
        await expect
          .poll(
            () =>
              page.evaluate((id) => {
                const el = document.getElementById(id);
                if (!el) return 'missing';
                const header = document.querySelector('header')!.getBoundingClientRect();
                const top = el.getBoundingClientRect().top;
                const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
                return top >= -2 && top <= header.height + 48 ? 'ok' : atBottom ? 'ok' : `top=${Math.round(top)}`;
              }, href.slice(1)),
            { message: `section ${href} did not scroll into view at ${width}px` },
          )
          .toBe('ok');
      }
    });
  }

  test('download CTA has an href', async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('#download a[href]').first();
    await expect(cta).toHaveAttribute('href', /.+/);
    const href = await cta.getAttribute('href');
    expect(() => new URL(href as string, 'https://example.com')).not.toThrow();
  });
});

test.describe('FAQ', () => {
  test('each item opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    const items = page.locator('#faq details.faq__item');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      const summary = item.locator('summary');
      await expect(item).not.toHaveJSProperty('open', true);
      await summary.click();
      await expect(item).toHaveJSProperty('open', true);
      await expect(item.locator('.faq__answer')).toBeVisible();
      await summary.click();
      await expect(item).not.toHaveJSProperty('open', true);
    }
  });
});

test.describe('responsive layout', () => {
  for (const width of WIDTHS) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      const offenders =
        scrollWidth > clientWidth
          ? await page.evaluate((vw) => {
              const out: string[] = [];
              for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
                const r = el.getBoundingClientRect();
                if (r.right > vw + 1 && r.width > 0) {
                  const name = el.className && typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase();
                  out.push(`${name} right=${Math.round(r.right)}`);
                }
              }
              return out.slice(0, 10);
            }, clientWidth)
          : [];
      expect(scrollWidth, `offending elements: ${offenders.join(', ')}`).toBeLessThanOrEqual(clientWidth);
    });

    test(`captures a full-page screenshot at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      await page.waitForLoadState('load');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/home-${width}.png`, fullPage: true, animations: 'disabled' });
    });
  }
});

test.describe('reduced motion', () => {
  test('reduce: app mock log does not stream and no animations run', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    const log = page.locator('.am-log__lines:visible').first();
    const before = await log.innerText();
    await page.waitForTimeout(3200);
    expect(await log.innerText()).toBe(before);
    const running = await page.evaluate(() =>
      document.getAnimations().filter((a) => a.playState === 'running').length,
    );
    expect(running).toBe(0);
  });

  test('no-preference: app mock log streams', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    const log = page.locator('.am-log__lines:visible').first();
    const before = await log.innerText();
    await expect.poll(() => log.innerText(), { timeout: 5000 }).not.toBe(before);
  });

  test('no-preference: log lines appear in script order', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    const msgs = () => page.locator('.am-log__lines:visible').first().locator('.am-msg').allInnerTexts();
    const initial = await msgs();
    expect(initial.length).toBeGreaterThan(6);
    await expect.poll(async () => (await msgs()).join('|'), { timeout: 6000 }).not.toBe(initial.join('|'));
    const after = await msgs();
    const n = initial.length;
    const shift = initial.indexOf(after[0]);
    expect(shift).toBeGreaterThan(0);
    expect(after).toEqual(initial.map((_, i) => initial[(i + shift) % n]));
  });
});

test.describe('production CSP', () => {
  test('no CSP violations with the nginx Content-Security-Policy applied', async ({ page }) => {
    const conf = readFileSync('nginx.conf', 'utf8');
    const csp = conf.match(/Content-Security-Policy "([^"]+)"/)?.[1];
    expect(csp).toBeTruthy();
    await page.route('**/*', async (route) => {
      const response = await route.fetch();
      await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': csp as string } });
    });
    const violations: string[] = [];
    page.on('console', (m) => {
      if (/content security policy|refused to/i.test(m.text())) violations.push(m.text());
    });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('load');
    await page.waitForTimeout(1500);
    expect(violations).toEqual([]);
    const widths = await page.locator('.am-desktop .am-fill').evaluateAll((els) =>
      els.map((e) => getComputedStyle(e).getPropertyValue('--p').trim()),
    );
    expect(widths.every((w) => w !== '')).toBe(true);
    const streamed = await page.evaluate(() => document.querySelector('.am-log__lines')?.classList.contains('am-streaming'));
    expect(streamed).toBe(true);
  });
});

test.describe('accessibility', () => {
  for (const width of [360, 1280]) {
    test(`axe reports no WCAG 2 A/AA violations at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const summary = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        targets: v.nodes.map((n) => n.target.join(' ')),
      }));
      expect(summary).toEqual([]);
    });
  }
});

test.describe('imagery', () => {
  for (const width of [390, 1280]) {
    test(`images load without 404 and have alt text at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      const bad: string[] = [];
      page.on('response', (res) => {
        if (res.url().includes('/images/') && res.status() >= 400) bad.push(res.url());
      });
      await page.goto('/');
      const imgs = page.locator('img[src^="/images/"]');
      expect(await imgs.count()).toBeGreaterThanOrEqual(7);
      for (const img of await imgs.all()) {
        await img.scrollIntoViewIfNeeded();
        await expect(img).toHaveJSProperty('complete', true);
      }
      const info = await imgs.evaluateAll((els) =>
        (els as HTMLImageElement[]).map((i) => ({ src: i.src, alt: i.alt, ok: i.complete && i.naturalWidth > 0 })),
      );
      for (const i of info) {
        expect(i.alt.length, i.src).toBeGreaterThan(10);
        expect(i.ok, `loaded: ${i.src}`).toBe(true);
      }
      expect(bad).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }
});

test.describe('screenshot legibility at 360px', () => {
  test.use({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 });

  test('screenshots render at readable scale inside a scrollable frame, no page overflow', async ({ page }) => {
    await page.goto('/');
    const imgs = page.locator('figure.shot img');
    const n = await imgs.count();
    expect(n).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < n; i++) {
      const img = imgs.nth(i);
      await img.scrollIntoViewIfNeeded();
      const m = await img.evaluate((el: HTMLImageElement) => ({
        scale: el.getBoundingClientRect().width / el.naturalWidth,
        scrollable: (el.parentElement as HTMLElement).scrollWidth > (el.parentElement as HTMLElement).clientWidth,
        focusable: (el.parentElement as HTMLElement).tabIndex === 0,
      }));
      if (m.scale < 0.5) throw new Error(`screenshot ${i} scale ${m.scale.toFixed(2)} < 0.5`);
      if (m.scrollable) expect(m.focusable).toBe(true);
    }
    const w = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
    expect(w.s).toBe(w.c);
  });
});

test.describe('CTA screenshot showcase', () => {
  const active = (page: Page) => page.locator('#tour .tour__slide[data-active="true"] img');

  test('cycles through the 4 screenshots, pauses on hover and when offscreen, no CLS', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/');
    const tour = page.locator('#tour [data-tour]');
    await tour.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    const box1 = await tour.boundingBox();
    const seen = new Set<string>();
    await expect(tour).not.toHaveAttribute('data-paused', '');
    for (let i = 0; i < 5; i++) {
      seen.add((await active(page).getAttribute('src')) ?? '');
      await page.waitForFunction((s) => document.querySelector('#tour .tour__slide[data-active="true"] img')?.getAttribute('src') !== s, (await active(page).getAttribute('src')), { timeout: 8000 });
    }
    expect(seen.size).toBe(4);
    expect((await tour.boundingBox())?.height).toBe(box1?.height);

    await tour.hover();
    await expect(tour).toHaveAttribute('data-paused', '');
    const src = await active(page).getAttribute('src');
    await page.waitForTimeout(5500);
    expect(await active(page).getAttribute('src')).toBe(src);

    await page.mouse.move(0, 0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(tour).toHaveAttribute('data-paused', '');
  });

  test('manual controls change the slide', async ({ page }) => {
    await page.goto('/');
    await page.locator('#tour [data-next]').click();
    await expect(active(page)).toHaveAttribute('src', /agent-chat/);
    await page.locator('#tour [data-goto="3"]').click();
    await expect(active(page)).toHaveAttribute('src', /roles/);
  });

  test('prefers-reduced-motion shows the static first frame with working controls', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/');
    await page.locator('#tour [data-tour]').scrollIntoViewIfNeeded();
    const first = await active(page).getAttribute('src');
    expect(first).toContain('overview');
    await page.waitForTimeout(5500);
    expect(await active(page).getAttribute('src')).toBe(first);
    await page.locator('#tour [data-next]').click();
    await expect(active(page)).toHaveAttribute('src', /agent-chat/);
    await ctx.close();
  });

  test.describe('at 360px', () => {
    test.use({ viewport: { width: 360, height: 800 } });
    test('stage is a focusable scroll frame at readable scale, no page overflow', async ({ page }) => {
      await page.goto('/');
      const frame = page.locator('#tour .tour__scroll');
      await frame.scrollIntoViewIfNeeded();
      const m = await frame.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth, tab: (el as HTMLElement).tabIndex }));
      expect(m.sw).toBeGreaterThanOrEqual(800);
      expect(m.tab).toBe(0);
      const scale = await active(page).evaluate((el: HTMLImageElement) => el.getBoundingClientRect().width / el.naturalWidth);
      expect(scale).toBeGreaterThanOrEqual(0.5);
      const w = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
      expect(w.s).toBe(w.c);
    });
  });
});
