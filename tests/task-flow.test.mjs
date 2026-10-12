import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

// TASK-020: animated agent-team task flow in the Features section.
const require = createRequire(import.meta.url);
const PORT = 4398;
const BASE = `http://127.0.0.1:${PORT}/`;
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');

const { chromium } = require('playwright');

let server;
let browser;

before(async () => {
  // detached: own process group, so after() can stop the astro child that npx starts
  server = spawn('npx', ['astro', 'preview', '--port', String(PORT), '--host', '127.0.0.1'], { stdio: 'ignore', detached: true });
  for (let i = 0; i < 150; i++) {
    try {
      if ((await fetch(BASE)).ok) break;
    } catch {
      /* server not up yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  if (server?.pid) process.kill(-server.pid);
});

async function open(viewport, reducedMotion) {
  const context = await browser.newContext({ viewport, reducedMotion });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  return { context, page };
}

test('task flow renders in the features section with an accessible name', () => {
  const m = html.match(/<div class="flow" role="img" aria-label="([^"]+)"/);
  assert.ok(m, 'flow graphic with role="img" and aria-label is missing');
  assert.match(m[1], /Animated diagram/);
  const features = html.slice(html.indexOf('id="features"'), html.indexOf('id="team"') > 0 ? html.indexOf('id="team"') : undefined);
  assert.ok(features.includes('class="flow-wrap"'), 'flow graphic is not inside the features section');
});

test('task flow has a visible text caption and its inner content is hidden from assistive tech', () => {
  assert.match(html, /<figcaption class="flow__caption"[^>]*>[^<]{20,}<\/figcaption>/);
  assert.match(html, /<div class="flow__inner" aria-hidden="true"[^>]*>/);
});

for (const [name, viewport] of [
  ['mobile 360x800', { width: 360, height: 800 }],
  ['desktop 1280x800', { width: 1280, height: 800 }],
]) {
  test(`task flow fits ${name} without horizontal overflow`, async () => {
    const { context, page } = await open(viewport, 'no-preference');
    const r = await page.evaluate(() => {
      const de = document.documentElement;
      const flow = document.querySelector('.flow').getBoundingClientRect();
      return { overflow: de.scrollWidth - de.clientWidth, width: flow.width, left: flow.left, right: flow.right };
    });
    assert.equal(r.overflow, 0, 'page scrolls horizontally');
    assert.ok(r.left >= 0 && r.right <= viewport.width, `flow box ${r.left}-${r.right} exceeds the viewport`);
    await context.close();
  });
}

test('reduced motion shows the complete final frame with no running animations', async () => {
  const { context, page } = await open({ width: 360, height: 800 }, 'reduce');
  const r = await page.evaluate(() => {
    const flow = document.querySelector('.flow');
    const pills = [...document.querySelectorAll('.flow__pill')];
    const visible = (el) => getComputedStyle(el).visibility === 'visible' && Number(getComputedStyle(el).opacity) > 0.5;
    return {
      animations: flow.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length,
      tasks: document.querySelectorAll('.flow__task').length,
      done: document.querySelectorAll('.flow__pill--done').length,
      doneVisible: [...document.querySelectorAll('.flow__pill--done')].every(visible),
      otherPillsHidden: pills.filter((p) => !p.classList.contains('flow__pill--done')).every((p) => !visible(p)),
      fillScale: getComputedStyle(document.querySelector('.flow__fill')).transform,
    };
  });
  assert.equal(r.tasks, 3);
  assert.equal(r.animations, 0, 'animations are running under reduced motion');
  assert.equal(r.done, 3);
  assert.ok(r.doneVisible, 'Done pills should be visible in the static frame');
  assert.ok(r.otherPillsHidden, 'Backlog and In progress pills should be hidden in the static frame');
  assert.notEqual(r.fillScale, 'none', 'budget bar should be at its final value');
  await context.close();
});

test('task flow animates by default', async () => {
  const { context, page } = await open({ width: 1280, height: 800 }, 'no-preference');
  const running = await page.evaluate(
    () => document.querySelector('.flow').getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length,
  );
  assert.ok(running >= 9, `expected the flow to animate, got ${running} running animations`);
  await context.close();
});
