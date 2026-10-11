import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Regression (TASK-016): docs must describe redactions without repeating the sensitive values.
const banned = [/matthew/i, /williams/i, /fly[\s-]?by[\s-]?fly[\s-]?buys/i, /flybuys/i, /C:[\\/]Users[\\/](?!<user>)[^\\/\s`]+/i, /D:[\\/]Documents/i];
for (const f of ['docs/imagery-brief.md', 'qa/report.md']) {
  test(`${f} contains no real username, path or client name`, () => {
    const text = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
    for (const re of banned) assert.doesNotMatch(text, re, `${f} matches ${re}`);
  });
}
