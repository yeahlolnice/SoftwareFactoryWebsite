import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const htmlPath = new URL('../dist/index.html', import.meta.url);

test('build output exists', () => {
  assert.ok(existsSync(htmlPath), 'dist/index.html is missing; run npm run build first');
});

test('page has landmarks, one h1 and all section anchors', () => {
  const html = readFileSync(htmlPath, 'utf8');
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1);
  for (const id of ['top', 'main', 'hero', 'how-it-works', 'features', 'team', 'faq', 'download']) {
    assert.match(html, new RegExp(`id="${id}"`), `missing #${id}`);
  }
  assert.match(html, /<nav[^>]*aria-label="Primary"/);
  assert.match(html, /<footer/);
  assert.doesNotMatch(html, /<!--/);
});
