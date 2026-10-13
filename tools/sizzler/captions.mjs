// Turns the scene's on-screen text cues into a caption track with no overlapping cues (TASK-029).
// The scene records every on-screen line, and lines often share the screen (headline + caption,
// title + subtitle, end card). The native track would then stack separate cue boxes.
// Rule: a line that starts within MERGE_WITHIN frames of the previous line in the group joins it
// (one cue, one line each, in start order). Otherwise the current cue ends where the next begins.
export const MERGE_WITHIN = 30; // frames (1 s at 30 fps)

/** @param {{start:number,end:number,text:string}[]} cues frames, any order @returns same shape, sorted, non-overlapping */
export function captionCues(cues, frames = Infinity) {
  const sorted = [...cues].sort((a, b) => a.start - b.start || a.end - b.end);
  const out = [];
  let last = -Infinity; // start of the most recent line in the current group
  for (const c of sorted) {
    const cur = out[out.length - 1];
    const end = Math.min(c.end, frames);
    if (cur && c.start - last < MERGE_WITHIN) {
      cur.text += '\n' + c.text;
      cur.end = Math.max(cur.end, end);
    } else {
      if (cur) cur.end = Math.min(cur.end, c.start);
      out.push({ start: c.start, end, text: c.text });
    }
    last = c.start;
  }
  return out;
}

const ts = (f, fps) => {
  const ms = Math.round((f / fps) * 1000);
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)}.${p(ms % 1000, 3)}`;
};

/** WebVTT text for the scene cues (frames -> timestamps). */
export function toVtt(cues, fps, frames) {
  return ['WEBVTT', '', ...captionCues(cues, frames).map((c) => `${ts(c.start, fps)} --> ${ts(c.end, fps)}\n${c.text}\n`)].join('\n');
}
