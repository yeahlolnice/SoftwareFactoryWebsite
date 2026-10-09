import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';

const require = createRequire(import.meta.url);
const PORT = 4399;
const BASE = `http://127.0.0.1:${PORT}/`;

function loadPlaywright() {
  for (const id of ['playwright', '/usr/lib/node_modules/playwright']) {
    try {
      return require(id);
    } catch {
      /* try next */
    }
  }
  return null;
}

const playwright = loadPlaywright();
const skip = false;

test('playwright is installed (hero browser tests must never be skipped)', () => {
  assert.ok(playwright, 'playwright is missing: run `npm install && npx playwright install chromium`');
});
let server;
let browser;

before(async () => {
  assert.ok(playwright, 'playwright is missing: run `npm install && npx playwright install chromium`');
  server = spawn('npx', ['astro', 'preview', '--port', String(PORT), '--host', '127.0.0.1'], {
    stdio: 'ignore',
  });
  for (let i = 0; i < 150; i++) {
    try {
      if ((await fetch(BASE)).ok) break;
    } catch {
      /* server not up yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  browser = await playwright.chromium.launch();
});

after(async () => {
  await browser?.close();
  server?.kill();
});

async function open(viewport, reducedMotion) {
  const context = await browser.newContext({ viewport, reducedMotion });
  const page = await context.newPage();
  const external = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(BASE)) external.push(r.url());
  });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  return { context, page, external };
}

for (const [name, viewport] of [
  ['desktop 1280x800', { width: 1280, height: 800 }],
  ['mobile 390x844', { width: 390, height: 844 }],
]) {
  test(`hero fits ${name}: no horizontal scroll, CTAs above the fold, mock visible`, { skip }, async () => {
    const { context, page, external } = await open(viewport, 'no-preference');
    const m = await page.evaluate(() => {
      const de = document.documentElement;
      const visible = (el) => el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;
      return {
        overflow: de.scrollWidth - de.clientWidth,
        ctaBottoms: [...document.querySelectorAll('.hero__ctas a')].map((a) => a.getBoundingClientRect().bottom),
        mockTop: document.querySelector('.am').getBoundingClientRect().top,
        desktopVisible: visible(document.querySelector('.am-desktop')),
        compactVisible: visible(document.querySelector('.am-compact')),
        agents: document.querySelectorAll('.am-agent, .am-faces .am-avatar').length,
        cards: document.querySelectorAll('.am-card').length,
        logLines: document.querySelectorAll('.am-ln').length,
      };
    });
    assert.equal(m.overflow, 0);
    assert.equal(m.ctaBottoms.length, 2);
    for (const b of m.ctaBottoms) assert.ok(b < viewport.height, `CTA bottom ${b} is below the fold`);
    assert.ok(m.mockTop < viewport.height, 'mock should start above the fold');
    assert.equal(viewport.width >= 1024 ? m.desktopVisible : m.compactVisible, true);
    assert.ok(m.agents >= 5 && m.cards >= 2 && m.logLines >= 6);
    assert.deepEqual(external, [], 'no external requests');
    await context.close();
  });
}

test('mock is aria-hidden and has a visually hidden text alternative', { skip }, async () => {
  const { context, page } = await open({ width: 1280, height: 800 }, 'no-preference');
  const r = await page.evaluate(() => {
    const fig = document.querySelector('figure.am');
    const cap = document.getElementById(fig.getAttribute('aria-labelledby'));
    return {
      caption: cap.textContent.trim(),
      hidden: [...fig.querySelectorAll('.am-desktop, .am-compact')].every((e) => e.getAttribute('aria-hidden') === 'true'),
      focusable: fig.querySelectorAll('a, button, [tabindex]').length,
    };
  });
  assert.ok(r.caption.length > 40);
  assert.ok(r.hidden);
  assert.equal(r.focusable, 0);
  await context.close();
});

test('the mock animates by default', { skip }, async () => {
  const { context, page } = await open({ width: 1280, height: 800 }, 'no-preference');
  const running = await page.evaluate(
    () => document.querySelector('.am').getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length,
  );
  assert.ok(running > 10, `expected running animations, got ${running}`);
  await context.close();
});

for (const [name, viewport] of [
  ['desktop', { width: 1280, height: 800 }],
  ['mobile', { width: 390, height: 844 }],
]) {
  test(`prefers-reduced-motion (${name}): no animations on the mock, final frame is complete`, { skip }, async () => {
    const { context, page } = await open(viewport, 'reduce');
    const r = await page.evaluate(() => {
      const fig = document.querySelector('.am');
      const all = [fig, ...fig.querySelectorAll('*')];
      const opacity = (el) => Number(getComputedStyle(el).opacity);
      const done = [...fig.querySelectorAll('.am-col')].find((c) => c.querySelector('[data-moving]'));
      const lines = [...fig.querySelectorAll('.am-ln')].filter((e) => e.offsetParent !== null);
      return {
        animations: fig.getAnimations({ subtree: true }).length,
        namedAnimations: all.filter((el) => getComputedStyle(el).animationName !== 'none').length,
        linesVisible: lines.every((e) => opacity(e) === 1) && lines.length >= 6,
        movingCardInDone: Boolean(done),
        movingCardOpacity: opacity(fig.querySelector('[data-moving]')),
        movingCardTransform: getComputedStyle(fig.querySelector('[data-moving]')).transform,
      };
    });
    assert.equal(r.animations, 0);
    assert.equal(r.namedAnimations, 0);
    assert.ok(r.linesVisible);
    assert.ok(r.movingCardInDone);
    assert.equal(r.movingCardOpacity, 1);
    assert.equal(r.movingCardTransform, 'none');
    await context.close();
  });
}

test('hero payload: HTML + CSS + JS under 150KB, no font or image files referenced', () => {
  const dist = new URL('../dist/', import.meta.url);
  assert.ok(existsSync(dist), 'run npm run build first');
  const walk = (dir) =>
    readdirSync(new URL(dir, dist), { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(`${dir}${e.name}/`) : [`${dir}${e.name}`],
    );
  const files = walk('').filter((f) => /\.(html|css|js)$/.test(f));
  const bytes = files.reduce((n, f) => n + statSync(new URL(f, dist)).size, 0);
  assert.ok(bytes < 150 * 1024, `${bytes} bytes`);
  const html = readFileSync(new URL('index.html', dist), 'utf8');
  assert.doesNotMatch(html, /@font-face|<img[\s>]|fonts\.googleapis/);
});
