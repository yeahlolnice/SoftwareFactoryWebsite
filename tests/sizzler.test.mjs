// TASK-023: rendered sizzler video outputs (regenerate with `npm run render:sizzler`).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { findBinary, probe } from '../tools/sizzler/ffmpeg.mjs';

const file = (name) => fileURLToPath(new URL(`../public/video/${name}`, import.meta.url));
const ffprobe = findBinary('ffprobe');
const skip = ffprobe ? false : 'ffprobe not installed (set FFPROBE_PATH or run npm run render:sizzler once)';

test('sizzler outputs exist within size limits', () => {
  const limits = { 'sizzler.mp4': 8 * 1024 * 1024, 'sizzler.webm': 8 * 1024 * 1024, 'sizzler-poster.webp': 300 * 1024 };
  for (const [name, max] of Object.entries(limits)) {
    assert.ok(existsSync(file(name)), `missing public/video/${name}`);
    const size = statSync(file(name)).size;
    assert.ok(size > 10 * 1024, `${name} is suspiciously small (${size} B)`);
    assert.ok(size <= max, `${name} is ${size} B, over the ${max} B limit`);
  }
});

for (const [name, codec] of [['sizzler.mp4', 'h264'], ['sizzler.webm', 'vp9']]) {
  test(`${name}: ${codec}, 1920x1080, 30 fps, yuv420p, 30-45 s`, { skip }, () => {
    const p = probe(ffprobe, file(name));
    assert.equal(p.codec, codec);
    assert.equal(p.width, 1920);
    assert.equal(p.height, 1080);
    assert.equal(p.fps, 30);
    assert.equal(p.pixFmt, 'yuv420p');
    assert.ok(p.duration >= 30 && p.duration <= 45, `duration ${p.duration} s`);
    assert.ok(Math.abs(p.frames - p.duration * 30) <= 1, `frame count ${p.frames} vs duration ${p.duration}`);
  });
}

test('sizzler.mp4 is faststart (moov before mdat)', () => {
  const head = readFileSync(file('sizzler.mp4')).subarray(0, 64 * 1024);
  const moov = head.indexOf('moov');
  const mdat = head.indexOf('mdat');
  assert.ok(moov > 0 && (mdat < 0 || moov < mdat), 'moov atom must precede mdat');
});

test('poster is a 1920x1080 WebP', { skip }, () => {
  const p = probe(ffprobe, file('sizzler-poster.webp'));
  assert.equal(p.codec, 'webp');
  assert.equal(p.width, 1920);
  assert.equal(p.height, 1080);
});
