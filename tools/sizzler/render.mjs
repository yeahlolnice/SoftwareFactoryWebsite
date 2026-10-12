// Renders the sizzler video (TASK-023): steps tools/sizzler/scene.html frame by frame in
// Playwright Chromium, saves PNGs, then encodes with ffmpeg.
//
//   npm run render:sizzler                  full render -> public/video/
//   node tools/sizzler/render.mjs --frames 0,240,1140 --out /tmp/stills   PNG stills only
//
// Outputs: public/video/sizzler.mp4 (H.264, yuv420p, faststart, <= 8 MB), sizzler.webm (VP9),
// sizzler-poster.webp (frame 1140) and sizzler.vtt (every on-screen line, for accessibility).
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { ensureFfmpeg, probe } from './ffmpeg.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const OUT = join(root, 'public/video');
const FRAMES_DIR = join(here, '.frames');
const POSTER_FRAME = 1140;
const MP4_MAX = 8 * 1024 * 1024;
const WEBM_TARGET = 5 * 1024 * 1024;
const POSTER_TARGET = 150 * 1024;

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };

async function openScene() {
  const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('requestfailed', (r) => errors.push(`request failed: ${r.url()}`));
  await page.goto(pathToFileURL(join(here, 'scene.html')).href);
  await page.evaluate(() => window.SIZZLER.ready);
  if (errors.length) throw new Error('Scene errors:\n' + errors.join('\n'));
  const meta = await page.evaluate(() => ({ fps: window.SIZZLER.fps, frames: window.SIZZLER.frames, cues: window.SIZZLER.cues }));
  return { browser, page, meta, errors };
}

async function capture(page, f, file) {
  await page.evaluate((n) => window.SIZZLER.seek(n), f);
  await page.screenshot({ path: file, type: 'png', animations: 'disabled', caret: 'initial' });
}

const ts = (f, fps) => {
  const ms = Math.round((f / fps) * 1000);
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)}.${p(ms % 1000, 3)}`;
};

function ffmpegRun(ffmpeg, argv) {
  execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...argv], { stdio: 'inherit' });
}

async function stills(list, outDir) {
  mkdirSync(outDir, { recursive: true });
  const { browser, page } = await openScene();
  for (const f of list) await capture(page, f, join(outDir, `f${String(f).padStart(4, '0')}.png`));
  await browser.close();
  console.log(`Wrote ${list.length} still(s) to ${outDir}`);
}

async function full() {
  const { ffmpeg, ffprobe } = await ensureFfmpeg();
  rmSync(FRAMES_DIR, { recursive: true, force: true });
  mkdirSync(FRAMES_DIR, { recursive: true });
  mkdirSync(OUT, { recursive: true });

  const { browser, page, meta, errors } = await openScene();
  const t0 = Date.now();
  for (let f = 0; f < meta.frames; f++) {
    await capture(page, f, join(FRAMES_DIR, `f${String(f).padStart(4, '0')}.png`));
    if (f % 150 === 0) console.log(`frame ${f}/${meta.frames} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  await browser.close();
  if (errors.length) throw new Error('Scene errors during render:\n' + errors.join('\n'));

  const input = ['-framerate', String(meta.fps), '-i', join(FRAMES_DIR, 'f%04d.png')];
  const common = ['-an', '-r', String(meta.fps), '-pix_fmt', 'yuv420p', '-map_metadata', '-1', '-fflags', '+bitexact'];

  // H.264: raise CRF until the file fits the 8 MB budget.
  const mp4 = join(OUT, 'sizzler.mp4');
  for (let crf = 20; ; crf += 2) {
    ffmpegRun(ffmpeg, [...input, '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', String(crf),
      '-profile:v', 'high', '-level', '4.1', '-g', '60', '-threads', '1', ...common, '-movflags', '+faststart', mp4]);
    const size = statSync(mp4).size;
    console.log(`mp4 crf ${crf}: ${(size / 1048576).toFixed(2)} MB`);
    if (size <= MP4_MAX || crf >= 36) break;
  }

  // VP9 fallback: constant quality, raised until it is within the 5 MB target.
  const webm = join(OUT, 'sizzler.webm');
  for (let crf = 34; ; crf += 4) {
    ffmpegRun(ffmpeg, [...input, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String(crf), '-row-mt', '1',
      '-deadline', 'good', '-cpu-used', '2', '-g', '120', ...common, webm]);
    const size = statSync(webm).size;
    console.log(`webm crf ${crf}: ${(size / 1048576).toFixed(2)} MB`);
    if (size <= WEBM_TARGET || crf >= 50) break;
  }

  // Poster: the held CTA end card.
  const poster = join(OUT, 'sizzler-poster.webp');
  const posterPng = join(FRAMES_DIR, `f${String(POSTER_FRAME).padStart(4, '0')}.png`);
  for (let q = 85; ; q -= 10) {
    ffmpegRun(ffmpeg, ['-i', posterPng, '-c:v', 'libwebp', '-quality', String(q), '-compression_level', '6', '-map_metadata', '-1', poster]);
    if (statSync(poster).size <= POSTER_TARGET || q <= 45) break;
  }

  const vtt = ['WEBVTT', '', ...meta.cues.map((c) => `${ts(c.start, meta.fps)} --> ${ts(Math.min(c.end, meta.frames), meta.fps)}\n${c.text}\n`)].join('\n');
  writeFileSync(join(OUT, 'sizzler.vtt'), vtt);

  for (const file of [mp4, webm]) {
    const p = probe(ffprobe, file);
    console.log(`${file.replace(root + '/', '')}: ${p.codec} ${p.width}x${p.height} ${p.fps} fps ${p.duration.toFixed(2)} s ${(p.size / 1048576).toFixed(2)} MB`);
  }
  console.log(`poster: ${(statSync(poster).size / 1024).toFixed(0)} KB; done in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  if (!args.includes('--keep-frames')) rmSync(FRAMES_DIR, { recursive: true, force: true });
}

const frameList = opt('--frames');
if (frameList) await stills(frameList.split(',').map(Number), resolve(opt('--out') ?? join(here, '.stills')));
else await full();
