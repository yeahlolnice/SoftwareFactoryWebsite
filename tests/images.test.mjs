import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { readFileSync, existsSync, statSync } from 'node:fs';

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

test('screenshots and graphics are present in the page', () => {
  for (const f of ['overview.webp', 'agent-chat.webp', 'billing-costs.webp', 'roles.webp', 'agent-team.svg']) {
    assert.ok(imgs.some((i) => attr(i, 'src')?.endsWith(f)), `missing <img> for ${f}`);
  }
});

test('every <img> has alt text, dimensions and lazy loading', () => {
  for (const tag of imgs) {
    const src = attr(tag, 'src');
    if (src?.startsWith('/images/')) {
      assert.ok((attr(tag, 'alt') ?? '').length > 10, `alt missing: ${src}`);
      assert.ok(attr(tag, 'width') && attr(tag, 'height'), `dimensions missing: ${src}`);
      // the hero overview is above the fold (eager); its copy in the CTA showcase is lazy
      const ok = src.endsWith('/overview.webp') ? ['eager', 'lazy'] : ['lazy'];
      assert.ok(ok.includes(attr(tag, 'loading')), `wrong loading for ${src}`);
    }
  }
});

test('each image is used once (TASK-021)', () => {
  const srcs = imgs.map((i) => attr(i, 'src')).filter(Boolean);
  assert.equal(new Set(srcs).size, srcs.length, `duplicate image src: ${srcs}`);
});

test('every local image file exists and is under 300KB', () => {
  for (const tag of imgs) {
    const src = attr(tag, 'src');
    if (!src?.startsWith('/')) continue;
    const p = new URL(`../dist${src}`, import.meta.url);
    assert.ok(existsSync(p), `404: ${src}`);
    assert.ok(statSync(p).size < 300 * 1024, `over 300KB: ${src}`);
  }
});

test('tasks-board screenshot does not end mid-card at the right edge (TASK-017)', async () => {
  const b64 = readFileSync(new URL('../public/images/screenshots/tasks-board.webp', import.meta.url)).toString('base64');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const bad = await page.evaluate(async (src) => {
      const img = new Image();
      img.src = `data:image/webp;base64,${src}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      // Board area right of the In Progress column: must be plain background (no cut card).
      // Samples x>=980, y>=230 only; x 976-979 and the <=5/255 residual at 984-985 are sub-threshold and not covered.
      const { data } = ctx.getImageData(980, 230, img.width - 980, img.height - 230);
      let n = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (Math.abs(data[i] - 11) > 6 || Math.abs(data[i + 1] - 14) > 6 || Math.abs(data[i + 2] - 20) > 6) n++;
      }
      return n;
    }, b64);
    assert.equal(bad, 0, `${bad} non-background pixels at the right edge: a card is cropped`);
  } finally {
    await browser.close();
  }
});
