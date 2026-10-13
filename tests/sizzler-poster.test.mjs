// TASK-030 regression: the poster (end card, frame 1140) must not show a burned-in button.
// A green "Download for Windows" pill in the image looked clickable but was only pixels, and
// competed with the real Play control and the page's download CTA. The copy stays, as plain text.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const POSTER_FRAME = 1140;
const scene = pathToFileURL(fileURLToPath(new URL('../tools/sizzler/scene.html', import.meta.url))).href;
const poster = readFileSync(fileURLToPath(new URL('../public/video/sizzler-poster.webp', import.meta.url)));

async function withPage(fn) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    return await fn(page);
  } finally {
    await browser.close();
  }
}

test('end card has no button-shaped element at the poster frame', async () => {
  const found = await withPage(async (page) => {
    await page.goto(scene);
    await page.evaluate(() => window.SIZZLER.ready);
    return page.evaluate((f) => {
      window.SIZZLER.seek(f);
      const visible = (n) => {
        for (let e = n; e && e !== document.body; e = e.parentElement) {
          const s = getComputedStyle(e);
          if (s.display === 'none' || Number(s.opacity) === 0) return false;
        }
        return true;
      };
      return [...document.querySelectorAll('.btn')].filter(visible).map((n) => n.textContent.trim());
    }, POSTER_FRAME);
  });
  assert.deepEqual(found, [], `visible button-like elements on the poster frame: ${found.join(', ')}`);
});

test('poster image has no filled accent pill behind "Download for Windows"', async () => {
  // Count bright accent-green (#3ddc97) pixels in the centre band where the pill used to be
  // (660x108 at 630,590 in the old render, about 71k px). The Windows icon alone is about 2k px.
  const accent = await withPage(async (page) => {
    await page.setContent('<canvas></canvas>');
    return page.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.querySelector('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(560, 560, 800, 180);
      let n = 0;
      for (let i = 0; i < data.length; i += 4) {
        const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
        if (g > 170 && r < 120 && b > 100 && b < 200) n++;
      }
      return n;
    }, `data:image/webp;base64,${poster.toString('base64')}`);
  });
  assert.ok(accent < 6000, `poster has ${accent} accent-green px in the CTA band; a filled button pill is burned in`);
});
