import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('mock data: log is capped at 12 lines (keyframes are hard-coded) and counts agree', async () => {
  const src = readFileSync(new URL('../src/data/site.ts', import.meta.url), 'utf8');
  const end = src.indexOf("statusBar: {\n      working");
  const log = src.slice(src.lastIndexOf('log: [', end), end);
  const lines = (log.match(/\{ time: '/g) ?? []).length;
  assert.equal(lines, 12, 'mock.log must have exactly 12 lines; appmock.css defines keyframes am-log-1..12');
  const css = readFileSync(new URL('../src/styles/appmock.css', import.meta.url), 'utf8');
  assert.match(css, /am-log-12/);
  assert.doesNotMatch(css, /am-log-13/);
  const done = src.match(/id: 'done',\s*label: 'Done',\s*total: (\d+)/)[1];
  const from = src.match(/progress: '(\d+) \/ 12/)[1];
  const to = src.match(/progressFinal: '(\d+) \/ 12/)[1];
  assert.equal(from, done, 'status bar start count must equal the Done column total');
  assert.equal(Number(to), Number(from) + 1);
});
