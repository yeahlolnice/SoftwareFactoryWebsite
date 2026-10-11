import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

test('screenshots and graphics are present in the page', () => {
  for (const f of ['overview.webp', 'agent-chat.webp', 'billing-costs.webp', 'tasks-board.webp', 'roles.webp', 'orchestration-flow.svg', 'agent-team.svg']) {
    assert.ok(imgs.some((i) => attr(i, 'src')?.endsWith(f)), `missing <img> for ${f}`);
  }
});

test('every <img> has alt text, dimensions and lazy loading', () => {
  for (const tag of imgs) {
    const src = attr(tag, 'src');
    if (src?.startsWith('/images/')) {
      assert.ok((attr(tag, 'alt') ?? '').length > 10, `alt missing: ${src}`);
      assert.ok(attr(tag, 'width') && attr(tag, 'height'), `dimensions missing: ${src}`);
      assert.equal(attr(tag, 'loading'), 'lazy', `not lazy: ${src}`);
    }
  }
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
