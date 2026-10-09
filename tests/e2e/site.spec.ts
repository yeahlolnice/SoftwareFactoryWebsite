import { test, expect, type ConsoleMessage, type Page, type Response } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

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
