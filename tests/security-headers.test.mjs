import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const pages = ['dist/index.html', 'dist/404.html'];
const nginxConf = readFileSync(new URL('nginx.conf', root), 'utf8');
const csp = nginxConf.match(/Content-Security-Policy "([^"]+)"/)?.[1] ?? '';

test('nginx sends the required security headers', () => {
  assert.match(nginxConf, /add_header X-Content-Type-Options "nosniff" always;/);
  assert.match(nginxConf, /add_header X-Frame-Options "DENY" always;/);
  assert.ok(csp, 'Content-Security-Policy header missing from nginx.conf');
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /frame-ancestors 'none'/);
});

test('CSP allows the hash of every inline script in the built pages', () => {
  const allowed = new Set([...csp.matchAll(/'sha256-([^']+)'/g)].map((m) => m[1]));
  const missing = [];
  for (const page of pages) {
    const html = readFileSync(new URL(page, root), 'utf8');
    for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
      if (/^<script[^>]*\btype="application\/ld\+json"/.test(m[0])) continue;
      const hash = createHash('sha256').update(m[1], 'utf8').digest('base64');
      if (!allowed.has(hash)) missing.push(`${page}: sha256-${hash}`);
    }
  }
  assert.deepEqual(missing, [], 'update the script-src hashes in nginx.conf');
});

test('built pages have no inline styles (style-src is self-only)', () => {
  for (const page of pages) {
    const html = readFileSync(new URL(page, root), 'utf8');
    assert.doesNotMatch(html, /<style[\s>]/, `${page} contains an inline <style> block`);
    assert.doesNotMatch(html, / style="/, `${page} contains a style attribute`);
  }
});
