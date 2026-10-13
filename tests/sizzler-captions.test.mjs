// TASK-029 regression: the caption track must not show two cues at once, and must use the app's money format.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { captionCues, toVtt } from '../tools/sizzler/captions.mjs';

const vttPath = fileURLToPath(new URL('../public/video/sizzler.vtt', import.meta.url));
const scenePath = fileURLToPath(new URL('../tools/sizzler/scene.html', import.meta.url));
const secs = (t) => { const [h, m, s] = t.split(':'); return +h * 3600 + +m * 60 + +s; };
const parse = (vtt) => vtt.trim().split(/\n\n+/).slice(1).map((block) => {
  const [timing, ...text] = block.split('\n');
  const [start, end] = timing.split(' --> ').map(secs);
  return { start, end, text: text.join('\n') };
});

test('sizzler.vtt cues do not overlap and are long enough to read', () => {
  const cues = parse(readFileSync(vttPath, 'utf8'));
  assert.ok(cues.length >= 10, `only ${cues.length} cues`);
  cues.forEach((c, i) => {
    assert.ok(c.end - c.start >= 1, `cue ${i} "${c.text}" lasts ${(c.end - c.start).toFixed(3)} s`);
    if (i) assert.ok(c.start >= cues[i - 1].end, `cue "${c.text}" (${c.start}) overlaps "${cues[i - 1].text}" (ends ${cues[i - 1].end})`);
  });
});

test('sizzler.vtt keeps the reported lines, with the budget in the app format', () => {
  const vtt = readFileSync(vttPath, 'utf8');
  for (const line of ['Then chaos.', "Solo AI prompting doesn't scale.", 'Software Factory', 'Manage a team of AI agents.',
    'Build a website for my product', 'Give it a goal.', 'Your budget. Your cap.', '$12.40 / $50.00']) {
    assert.ok(vtt.includes(line), `missing "${line}"`);
  }
  assert.ok(!/\$ \d/.test(vtt), 'money is written $12.40, not $ 12.40');
});

test('captionCues merges lines that appear together and trims the rest', () => {
  const out = captionCues([
    { start: 84, end: 128, text: 'Then chaos.' },
    { start: 90, end: 140, text: "Solo AI prompting doesn't scale." },
    { start: 340, end: 400, text: 'The PM breaks it into tasks.' },
    { start: 390, end: 440, text: 'Plans, assigns, tracks. Automatically.' },
    { start: 1086, end: 1300, text: 'Your AI team is ready.' },
  ], 1200);
  assert.deepEqual(out, [
    { start: 84, end: 140, text: "Then chaos.\nSolo AI prompting doesn't scale." },
    { start: 340, end: 390, text: 'The PM breaks it into tasks.' },
    { start: 390, end: 440, text: 'Plans, assigns, tracks. Automatically.' },
    { start: 1086, end: 1200, text: 'Your AI team is ready.' },
  ]);
});

test('committed sizzler.vtt matches the scene (regenerate with node tools/sizzler/render.mjs --vtt)', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(scenePath).href);
    const meta = await page.evaluate(async () => { await window.SIZZLER.ready; return { fps: window.SIZZLER.fps, frames: window.SIZZLER.frames, cues: window.SIZZLER.cues }; });
    assert.equal(readFileSync(vttPath, 'utf8').replace(/\r\n/g, '\n'), toVtt(meta.cues, meta.fps, meta.frames));
  } finally {
    await browser.close();
  }
});
