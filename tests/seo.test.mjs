import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (file) => readFileSync(new URL(file, root), 'utf8');
const html = read('dist/index.html');
const notFound = read('dist/404.html');

const metaContent = (src, attr, value) => {
  const tag = src.match(new RegExp(`<meta ${attr}="${value}"[^>]*>`))?.[0] ?? '';
  return tag.match(/content="([^"]*)"/)?.[1];
};

const ldBlocks = () =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

test('index.html has title, description and canonical', () => {
  assert.match(html, /<title>[^<]+<\/title>/);
  assert.ok(metaContent(html, 'name', 'description'), 'meta description missing');
  assert.match(html, /<link rel="canonical" href="https?:\/\/[^"]+\/"/);
});

test('index.html has Open Graph and Twitter tags', () => {
  for (const prop of ['og:type', 'og:site_name', 'og:title', 'og:description', 'og:url', 'og:image', 'og:image:alt']) {
    assert.ok(metaContent(html, 'property', prop), `missing ${prop}`);
  }
  for (const name of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt']) {
    assert.ok(metaContent(html, 'name', name), `missing ${name}`);
  }
  assert.equal(metaContent(html, 'name', 'twitter:card'), 'summary_large_image');
});

test('og:image points to a PNG at the declared 1200x630 size', () => {
  assert.match(metaContent(html, 'property', 'og:image'), /\/og\.png$/);
  assert.equal(metaContent(html, 'property', 'og:image:width'), '1200');
  assert.equal(metaContent(html, 'property', 'og:image:height'), '630');
  const png = readFileSync(new URL('dist/og.png', root));
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
});

test('favicon and OG image are emitted to dist', () => {
  assert.ok(existsSync(new URL('dist/favicon.svg', root)));
  assert.ok(existsSync(new URL('dist/og.png', root)));
});

test('JSON-LD parses and includes SoftwareApplication for Windows', () => {
  const app = ldBlocks().find((b) => b['@type'] === 'SoftwareApplication');
  assert.ok(app, 'SoftwareApplication JSON-LD missing');
  assert.equal(app['@context'], 'https://schema.org');
  assert.equal(app.operatingSystem, 'Windows');
  assert.ok(app.name && app.description && app.url);
});

test('FAQPage JSON-LD matches the visible FAQ questions and answers', () => {
  const faq = ldBlocks().find((b) => b['@type'] === 'FAQPage');
  assert.ok(faq, 'FAQPage JSON-LD missing');
  assert.ok(faq.mainEntity.length > 0);
  for (const q of faq.mainEntity) {
    assert.ok(html.includes(escapeHtml(q.name)), `question not visible: ${q.name}`);
    assert.ok(html.includes(escapeHtml(q.acceptedAnswer.text)), `answer not visible: ${q.name}`);
  }
});

test('JSON-LD cannot break out of its script element', () => {
  for (const block of [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]) {
    assert.doesNotMatch(block[1], /<\/script/i);
  }
});

test('index.html has exactly one h1 and no skipped heading levels', () => {
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1);
  const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  for (let i = 1; i < levels.length; i++) {
    assert.ok(levels[i] <= levels[i - 1] + 1, `heading level jumps from h${levels[i - 1]} to h${levels[i]}`);
  }
});

test('404 page is noindex and has no canonical', () => {
  assert.equal(metaContent(notFound, 'name', 'robots'), 'noindex');
  assert.doesNotMatch(notFound, /rel="canonical"/);
});

test('robots.txt allows crawling and points at the sitemap', () => {
  const robots = read('dist/robots.txt');
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, /^Sitemap: https?:\/\/\S+\/sitemap\.xml$/m);
});

test('sitemap.xml lists the home page', () => {
  const sitemap = read('dist/sitemap.xml');
  assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(sitemap, /<loc>https?:\/\/[^<]+\/<\/loc>/);
});
