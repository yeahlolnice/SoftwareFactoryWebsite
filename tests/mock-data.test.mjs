import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('mock data: log is long enough to stream and counts agree', async () => {
  const src = readFileSync(new URL('../src/data/site.ts', import.meta.url), 'utf8');
  const end = src.indexOf("statusBar: {\n      working");
  const log = src.slice(src.lastIndexOf('log: [', end), end);
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
