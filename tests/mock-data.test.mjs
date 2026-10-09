import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('mock data: log is long enough to stream and counts agree', async () => {
  const src = readFileSync(new URL('../src/data/site.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  const start = src.indexOf('log: [\n      { time:');
  assert.ok(start > -1, 'mock.log block not found in src/data/site.ts');
  const log = src.slice(start, src.indexOf('\n    ],', start));
  const lines = (log.match(/\{ time: '/g) ?? []).length;
  assert.ok(lines >= 12, 'mock.log needs enough lines to overflow the log panel so the stream scrolls');
  const css = readFileSync(new URL('../src/styles/appmock.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /am-log-\d/, 'the log streams from the inline script, not per-line keyframes');
  const done = src.match(/id: 'done',\s*label: 'Done',\s*total: (\d+)/)[1];
  const from = src.match(/progress: '(\d+) \/ 12/)[1];
  const to = src.match(/progressFinal: '(\d+) \/ 12/)[1];
  assert.equal(from, done, 'status bar start count must equal the Done column total');
  assert.equal(Number(to), Number(from) + 1);
});

test('mock progress values map to the CSS modifier set (no inline styles)', () => {
  const src = readFileSync(new URL('../src/data/site.ts', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../src/styles/appmock.css', import.meta.url), 'utf8');
  for (const m of src.matchAll(/progress(?:From)?: (\d+)/g)) {
    const n = Number(m[1]);
    assert.equal(n % 10, 0, `progress ${n} must be a multiple of 10`);
    assert.ok(css.includes(`.am-fill[data-p="${n}"]`), `appmock.css lacks a rule for data-p="${n}"`);
    assert.ok(css.includes(`.am-fill[data-p0="${n}"]`), `appmock.css lacks a rule for data-p0="${n}"`);
  }
});
