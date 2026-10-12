// Locates ffmpeg/ffprobe for the sizzler render and tests.
// Order: $FFMPEG_PATH / $FFPROBE_PATH, then a cached static build in tools/sizzler/.bin,
// then the system PATH. On Linux x64, ensureFfmpeg() downloads a static build into .bin when nothing is found.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const BIN_DIR = join(here, '.bin');
const STATIC_URL = 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz';

function works(bin) {
  try {
    execFileSync(bin, ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/** Path to `name` (ffmpeg or ffprobe), or null if none is available. Never downloads. */
export function findBinary(name) {
  const env = process.env[name === 'ffmpeg' ? 'FFMPEG_PATH' : 'FFPROBE_PATH'];
  const candidates = [env, join(BIN_DIR, name), name].filter(Boolean);
  return candidates.find(works) ?? null;
}

/** Like findBinary for both tools, but fetches a static build on Linux x64 when missing. */
export async function ensureFfmpeg() {
  let ffmpeg = findBinary('ffmpeg');
  let ffprobe = findBinary('ffprobe');
  if (ffmpeg && ffprobe) return { ffmpeg, ffprobe };
  if (process.platform !== 'linux' || process.arch !== 'x64') {
    throw new Error('ffmpeg/ffprobe not found. Install ffmpeg (with libx264, libvpx-vp9, libwebp) or set FFMPEG_PATH and FFPROBE_PATH.');
  }
  console.log(`ffmpeg not found; downloading a static build from ${STATIC_URL}`);
  const res = await fetch(STATIC_URL);
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  const tmp = join(BIN_DIR, 'download');
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  const archive = join(tmp, 'ffmpeg.tar.xz');
  writeFileSync(archive, Buffer.from(await res.arrayBuffer()));
  execFileSync('tar', ['-xJf', archive, '-C', tmp]);
  const dir = readdirSync(tmp).find((d) => d.startsWith('ffmpeg-'));
  for (const name of ['ffmpeg', 'ffprobe']) {
    if (existsSync(join(BIN_DIR, name))) rmSync(join(BIN_DIR, name));
    renameSync(join(tmp, dir, name), join(BIN_DIR, name));
  }
  rmSync(tmp, { recursive: true, force: true });
  ffmpeg = findBinary('ffmpeg');
  ffprobe = findBinary('ffprobe');
  if (!ffmpeg || !ffprobe) throw new Error('Downloaded ffmpeg build does not run on this machine.');
  return { ffmpeg, ffprobe };
}

/** ffprobe summary of the first video stream plus container duration and size. */
export function probe(ffprobe, file) {
  const out = execFileSync(ffprobe, [
    '-v', 'error', '-select_streams', 'v:0', '-count_frames',
    '-show_entries', 'stream=codec_name,width,height,pix_fmt,r_frame_rate,nb_read_frames:format=duration,size,format_name',
    '-of', 'json', file,
  ]).toString();
  const j = JSON.parse(out);
  const s = j.streams[0];
  const [num, den] = s.r_frame_rate.split('/').map(Number);
  return {
    codec: s.codec_name, width: s.width, height: s.height, pixFmt: s.pix_fmt,
    fps: num / den, frames: Number(s.nb_read_frames),
    duration: Number(j.format.duration), size: Number(j.format.size), format: j.format.format_name,
  };
}
