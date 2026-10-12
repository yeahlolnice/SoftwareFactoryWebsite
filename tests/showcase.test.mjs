import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const tour = html.match(/<div class="tour"[\s\S]*?<p class="tour__caption/)?.[0] ?? '';
const imgs = [...tour.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

test('CTA showcase renders the 4 screenshots lazily with explicit dimensions and alt text', () => {
  assert.equal(imgs.length, 4);
  for (const f of ['overview', 'agent-chat', 'billing-costs', 'roles']) {
    assert.ok(imgs.some((i) => attr(i, 'src') === `/images/screenshots/${f}.webp`), `missing ${f}`);
  }
  for (const tag of imgs) {
    assert.equal(attr(tag, 'loading'), 'lazy');
    assert.ok(Number(attr(tag, 'width')) > 0 && Number(attr(tag, 'height')) > 0);
    assert.ok((attr(tag, 'alt') ?? '').length > 20);
    assert.ok(existsSync(new URL(`../dist${attr(tag, 'src')}`, import.meta.url)));
  }
});

test('showcase sits before the download CTA and ships first slide active without JS', () => {
  assert.ok(html.indexOf('id="tour"') > 0 && html.indexOf('id="tour"') < html.indexOf('id="download"'));
  assert.equal((tour.match(/data-active="true"/g) ?? []).length, 1);
  assert.match(tour, /<div class="tour__controls" hidden/);
});

test('showcase script has no inline-event handlers or external hosts (CSP-safe)', () => {
  const src = readFileSync(new URL('../src/scripts/showcase.js', import.meta.url), 'utf8');
  assert.ok(!/https?:\/\//.test(src) && !/eval\(|new Function/.test(src));
  assert.ok(!/ on[a-z]+="/.test(tour));
});
