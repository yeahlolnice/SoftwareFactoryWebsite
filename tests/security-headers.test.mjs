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

test('IIS web.config sends the same security headers as nginx.conf', () => {
  const webConfig = readFileSync(new URL('public/web.config', root), 'utf8');
  const iis = Object.fromEntries([...webConfig.matchAll(/<add name="([^"]+)" value="([^"]*)" \/>/g)].map((m) => [m[1], m[2]]));
  const nginx = Object.fromEntries([...nginxConf.matchAll(/add_header ([\w-]+) "([^"]*)" always;/g)].map((m) => [m[1], m[2]]));
  for (const name of ['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy', 'Content-Security-Policy']) {
    assert.equal(iis[name], nginx[name], `${name} differs between public/web.config and nginx.conf`);
  }
  assert.match(webConfig, /<remove name="X-Powered-By" \/>/);
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

test('CSP allows same-origin media for the sizzler video', () => {
  assert.match(csp, /media-src 'self'(;|$)/);
});

test('nginx serves video with MIME types, Range support and long cache headers', () => {
  // stock nginx mime.types maps mp4 and webm; vtt must be added
  assert.match(nginxConf, /include \/etc\/nginx\/mime\.types;/);
  assert.match(nginxConf, /types\s*{\s*text\/vtt\s+vtt;\s*}/);
  const video = nginxConf.match(/location \/video\/ {([^}]*)}/)?.[1] ?? '';
  assert.ok(video, 'location /video/ missing');
  assert.doesNotMatch(video, /max_ranges 0/, 'Range requests must stay enabled');
  assert.match(video, /max_ranges 1;/);
  assert.doesNotMatch(video, /add_header/, 'add_header in a location would drop the server-level security headers');
  assert.match(nginxConf, /~\^\/video\/\.\+\\\.\(mp4\|webm\|webp\)\$\s+"public, max-age=31536000"/);
  assert.doesNotMatch(nginxConf.match(/gzip_types[^;]*;/)[0], /video\//, 'do not gzip video');
});
