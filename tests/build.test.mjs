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

function sectionHtml(html, startId, endId) {
  return html.slice(html.indexOf(`id="${startId}"`), html.indexOf(`id="${endId}"`));
}

test('how it works renders four steps', () => {
  const html = readFileSync(htmlPath, 'utf8');
  const steps = sectionHtml(html, 'how-it-works', 'features').match(/<li[^>]*class="[^"]*\bstep\b[^"]*"/g) ?? [];
  assert.equal(steps.length, 4);
});

test('features grid lists the six spec feature titles in order', () => {
  const html = readFileSync(htmlPath, 'utf8');
  const titles = [
    ...sectionHtml(html, 'features', 'team').matchAll(/<h3[^>]*class="[^"]*feature-card__title[^"]*"[^>]*>([^<]*)<\/h3>/g),
  ].map((m) => m[1]);
  assert.deepEqual(titles, [
    'Orchestrate a team of AI agents',
    'Task decomposition',
    'Budget control',
    'Human approval gates',
    'Sandboxed execution',
    'Git branch per task',
  ]);
});

test('footer headings are not h2 elements', () => {
  const html = readFileSync(htmlPath, 'utf8');
  const footer = html.slice(html.indexOf('<footer'));
  assert.doesNotMatch(footer, /<h2[\s>]/);
});

const astroFiles = listFiles('src/', ['.astro']);
const USER_FACING_ATTRS = ['aria-label', 'aria-description', 'alt', 'title', 'eyebrow', 'label', 'placeholder'];

function splitAstro(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  return { front: m ? m[1] : '', template: m ? src.slice(m[0].length) : src };
}

test('no string-literal user-facing attribute values in component templates', () => {
  const bad = [];
  const attrRe = new RegExp(`(?<![\\w:-])(${USER_FACING_ATTRS.join('|')})\\s*=\\s*(["'])([^"']*\\p{L}[^"']*)\\2`, 'gu');
  for (const f of astroFiles) {
    const { template } = splitAstro(readFileSync(new URL(f, root), 'utf8'));
    const markup = template.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
    for (const m of markup.matchAll(attrRe)) bad.push(`${f}: ${m[1]}="${m[3]}"`);
  }
  assert.deepEqual(bad, []);
});

test('no capitalised English string literals in component frontmatter', () => {
  const bad = [];
  for (const f of astroFiles) {
    const { front } = splitAstro(readFileSync(new URL(f, root), 'utf8'));
    const code = front.split('\n').filter((l) => !/^\s*(import|export)\b.*\bfrom\b/.test(l)).join('\n');
    for (const m of code.matchAll(/(['"`])([A-Z][a-z]+[^'"`\n]*)\1/g)) bad.push(`${f}: ${m[0]}`);
  }
  assert.deepEqual(bad, []);
});

test('copy checks detect violations (self-test)', () => {
  const attrRe = new RegExp(`(?<![\\w:-])(${USER_FACING_ATTRS.join('|')})\\s*=\\s*(["'])([^"']*\\p{L}[^"']*)\\2`, 'gu');
  assert.ok('<section aria-label="Proof">'.match(attrRe));
  assert.ok('<A eyebrow="Download" />'.match(attrRe));
  assert.ok(!'<A eyebrow={x.eyebrow} aria-labelledby="hero-heading" />'.match(attrRe));
});

test('no-JS fallback: nav is not hidden unless the js class is present', () => {
  const css = readFileSync(new URL('src/components/Header.astro', root), 'utf8');
  assert.doesNotMatch(css, /\.nav\s*\{[^}]*display:\s*none/);
});

test('footer.supportText is rendered in the footer and the FAQ support answer', () => {
  const html = readFileSync(htmlPath, 'utf8');
  const src = readFileSync(new URL('src/data/site.ts', root), 'utf8');
  const text = src.match(/const supportText = '([^']+)'/)?.[1];
  assert.ok(text, 'supportText constant not found in src/data/site.ts');
  const footer = html.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
  assert.match(footer, new RegExp(`<p class="footer-support[^"]*"[^>]*>${text}</p>`));
  const beforeFooter = html.slice(0, html.indexOf('<footer'));
  assert.ok(beforeFooter.includes(text), 'FAQ support answer no longer contains supportText');
});
