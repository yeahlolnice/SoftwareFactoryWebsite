import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

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

const root = new URL('../', import.meta.url);

function listFiles(dir, exts) {
  const out = [];
  for (const entry of readdirSync(new URL(dir, root), { withFileTypes: true })) {
    const rel = `${dir}${entry.name}`;
    if (entry.isDirectory()) out.push(...listFiles(`${rel}/`, exts));
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(rel);
  }
  return out;
}

function cssOf(file) {
  const src = readFileSync(new URL(file, root), 'utf8');
  if (file.endsWith('.css')) return src;
  return [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
}

const styleFiles = [...listFiles('src/', ['.astro', '.css'])].filter(
  (f) => f !== 'src/styles/tokens.css',
);

test('no hex/rgb/hsl colour literals outside tokens.css', () => {
  const bad = [];
  for (const f of styleFiles) {
    const css = cssOf(f);
    for (const m of css.matchAll(/#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl)a?\(/g)) bad.push(`${f}: ${m[0]}`);
  }
  assert.deepEqual(bad, []);
});

test('no hardcoded font sizes or font families outside tokens.css', () => {
  const bad = [];
  for (const f of styleFiles) {
    const css = cssOf(f);
    for (const m of css.matchAll(/font-size\s*:\s*([^;}]+)/g)) {
      if (!/^var\(--/.test(m[1].trim())) bad.push(`${f}: font-size: ${m[1].trim()}`);
    }
    for (const m of css.matchAll(/font-family\s*:\s*([^;}]+)/g)) {
      if (!/^var\(--/.test(m[1].trim()) && m[1].trim() !== 'inherit') {
        bad.push(`${f}: font-family: ${m[1].trim()}`);
      }
    }
  }
  assert.deepEqual(bad, []);
});

function stripBraces(src) {
  let depth = 0;
  let out = '';
  for (const ch of src) {
    if (ch === '{') depth++;
    else if (ch === '}') depth = Math.max(0, depth - 1);
    else if (depth === 0) out += ch;
  }
  return out;
}

test('components and pages contain no hardcoded copy (text lives in site.ts)', () => {
  const bad = [];
  for (const f of listFiles('src/', ['.astro']).filter((p) => !p.startsWith('src/data/'))) {
    let src = readFileSync(new URL(f, root), 'utf8');
    src = src.replace(/^---[\s\S]*?\n---/, '');
    src = src.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
    const text = stripBraces(src)
      .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
      .replace(/<!doctype html>/gi, '')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
    if (text) bad.push(`${f}: "${text.slice(0, 60)}"`);
  }
  assert.deepEqual(bad, []);
});

test('footer headings are not h2 elements', () => {
  const html = readFileSync(htmlPath, 'utf8');
  const footer = html.slice(html.indexOf('<footer'));
  assert.doesNotMatch(footer, /<h2[\s>]/);
});
