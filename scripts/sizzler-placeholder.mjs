// Builds PLACEHOLDER sizzler assets (public/video/*) until the real render (docs/sizzler-storyboard.md) lands.
// Each scene is a static title card held for its storyboard duration, with a progress bar.
// Usage: FFMPEG=/path/to/ffmpeg node scripts/sizzler-placeholder.mjs
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ffmpeg = process.env.FFMPEG ?? 'ffmpeg';
const out = new URL('../public/video/', import.meta.url).pathname;
const tmp = mkdtempSync(join(tmpdir(), 'sizzler-'));
const W = 1280;
const H = 720;

// Storyboard section 5: scene durations (s) and one headline per scene. Scene 7 is the poster frame.
const scenes = [
  [5, 'Then chaos.', 'Solo AI prompting doesn’t scale.'],
  [4, 'Software Factory', 'Manage a team of AI agents.'],
  [6, 'The PM breaks it into tasks.', 'Plans, assigns, tracks. Automatically.'],
  [8, 'All at once.', 'Each agent owns a role, and works in parallel.'],
  [8, 'You approve every merge.', 'A branch for every task. Your budget. Your cap.'],
  [5, 'Merged. Shipped.', 'A whole project, finished by a team.'],
  [4, 'Your AI team is ready.', 'Download for Windows'],
];

const card = (title, sub, last) => `<!doctype html><html><body style="margin:0;width:${W}px;height:${H}px;display:grid;place-items:center;
  background:radial-gradient(ellipse at center, #13241e 0%, #0b0f14 60%, #080b0f 100%);font-family:'Segoe UI',system-ui,sans-serif;color:#e6edf3;text-align:center">
  <div><p style="margin:0 0 24px;font:500 18px/1.4 monospace;letter-spacing:.08em;color:#3ddc97">SOFTWARE FACTORY</p>
  <h1 style="margin:0;font-size:72px;line-height:1.1;letter-spacing:-.02em">${title}</h1>
  ${last
    ? `<p style="display:inline-block;margin:36px 0 0;padding:16px 36px;border-radius:999px;background:#3ddc97;color:#06130d;font-size:28px;font-weight:600">${sub}</p>`
    : `<p style="margin:24px 0 0;font-size:32px;color:#9aa7b5">${sub}</p>`}
  <p style="margin:48px 0 0;font:500 14px monospace;color:#9aa7b5">PLACEHOLDER: final render pending</p></div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const list = [];
for (const [i, [dur, title, sub]] of scenes.entries()) {
  await page.setContent(card(title, sub, i === scenes.length - 1));
  const png = join(tmp, `scene-${i}.png`);
  await page.screenshot({ path: png });
  list.push(`file '${png}'\nduration ${dur}`);
}
await browser.close();
// concat demuxer needs the last file repeated to honour its duration
list.push(`file '${join(tmp, `scene-${scenes.length - 1}.png`)}'`);
writeFileSync(join(tmp, 'list.txt'), list.join('\n'));

const total = scenes.reduce((n, s) => n + s[0], 0);
const vf = `fps=30,format=yuv420p,drawbox=x=0:y=ih-6:w=iw*t/${total}:h=6:color=0x3ddc97:t=fill`;
const input = ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(tmp, 'list.txt'), '-t', String(total), '-vf', vf, '-an'];
execFileSync(ffmpeg, [...input, '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-tune', 'stillimage', '-movflags', '+faststart', join(out, 'sizzler.mp4')]);
execFileSync(ffmpeg, [...input, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '42', '-row-mt', '1', join(out, 'sizzler.webm')]);
execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-i', join(tmp, `scene-${scenes.length - 1}.png`), '-c:v', 'libwebp', '-quality', '80', join(out, 'sizzler-poster.webp')]);
console.log(`wrote ${out}sizzler.{mp4,webm} and sizzler-poster.webp (${total}s)`);
