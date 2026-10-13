// TASK-025: cross-browser probe for the sizzler video on the built site.
// Usage: npx astro preview --port 4400 & node qa/sizzler-browser-probe.mjs http://127.0.0.1:4400/
// Prints JSON: media requests before any interaction, the reduced-motion and in-view contract, and keyboard play.
import { chromium, firefox, webkit, devices } from 'playwright';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4400/';
const isMedia = (url) => /\/video\/sizzler\.(mp4|webm)/.test(url);
const cases = [
  ['chromium', chromium, { viewport: { width: 1280, height: 800 } }],
  ['firefox', firefox, { viewport: { width: 1280, height: 800 } }],
  ['webkit', webkit, { viewport: { width: 1280, height: 800 } }],
];
const state = (page) =>
  page.locator('#video video').evaluate((v) => ({ paused: v.paused, muted: v.muted, loop: v.loop, controls: v.controls, src: v.currentSrc.split('/').pop().split('?')[0] }));

const results = [];
for (const [name, engine, opts] of cases) {
  const browser = await engine.launch();
  const row = { browser: name };
  for (const reducedMotion of ['reduce', 'no-preference']) {
    const ctx = await browser.newContext({ ...opts, reducedMotion });
    const page = await ctx.newPage();
    const media = [];
    page.on('request', (r) => { if (isMedia(r.url())) media.push(r.url().split('/').pop().split('?')[0]); });
    await page.goto(BASE, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(2000);
    row[`${reducedMotion}-mediaBeforeInView`] = media.slice();
    await page.locator('#video .sizzler__play').scrollIntoViewIfNeeded();
    await page.waitForTimeout(2500);
    row[`${reducedMotion}-inView`] = await state(page);
    if (reducedMotion === 'reduce') {
      await page.locator('#video .sizzler__play').focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('#video video').currentTime > 0.5, null, { timeout: 30000 }).catch(() => {});
      row.keyboardPlay = await state(page);
    }
    await ctx.close();
  }
  results.push(row);
  await browser.close();
}
// Mobile WebKit: `load` does not fire under iPhone emulation on the built page (see qa/report.md, TASK-025 findings).
// Measured with waitUntil 'commit' so the probe can still run.
const mobile = await webkit.launch();
const mctx = await mobile.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' });
const mpage = await mctx.newPage();
await mpage.goto(BASE, { waitUntil: 'commit' });
await mpage.waitForTimeout(5000);
results.push({ browser: 'webkit-iphone13', readyState: await mpage.evaluate(() => document.readyState), playButtons: await mpage.locator('#video .sizzler__play').count() });
await mobile.close();

console.log(JSON.stringify(results, null, 2));
