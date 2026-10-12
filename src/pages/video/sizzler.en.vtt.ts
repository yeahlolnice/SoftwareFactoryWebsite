import type { APIRoute } from 'astro';
import { site } from '../../data/site';

const stamp = (s: number) => {
  const ms = Math.round(s * 1000);
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)}.${pad(ms % 1000, 3)}`;
};

// Captions are generated from the same cues as the visible transcript, so the two never drift.
export const GET: APIRoute = () =>
  new Response(
    `WEBVTT\n\n${site.sizzler.cues.map((c, i) => `${i + 1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`).join('\n')}`,
    { headers: { 'Content-Type': 'text/vtt; charset=utf-8' } },
  );
