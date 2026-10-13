/* Sizzler video scene (TASK-023), implementing docs/sizzler-storyboard.md.
 *
 * Deterministic and frame-accurate: every animated property is a pure function of the
 * frame number. Nothing uses CSS animations, timers or Math.random, so seek(f) renders
 * the same pixels for frame f no matter which frame was shown before.
 *
 * API (used by render.mjs): window.SIZZLER = { fps, frames, ready, seek(f), cues }.
 */
(() => {
  'use strict';

  const FPS = 30;
  const FRAMES = 1200; // 40.0 s
  const SHOTS = '../../public/images/screenshots/';
  // Final site URL for the end card. TODO(PO): final domain. Left empty so no placeholder URL is burned in.
  const SITE_URL = '';

  const C = {
    bgDeep: '#080b0f', bg: '#0b0f14', surface: '#121820', raised: '#1a222d', border: '#2a3441',
    text: '#e6edf3', muted: '#9aa7b5', accent: '#3ddc97', accentTint: '#0f2a21', onAccent: '#06130d',
    info: '#5cb8ff', warn: '#f5b544', danger: '#ff6b6b', violet: '#a78bfa',
  };
  // Native screenshot sizes (public/images/screenshots).
  const IMG = {
    overview: ['overview.webp', 964, 350],
    tasks: ['tasks-board.webp', 1203, 700],
    roles: ['roles.webp', 1200, 795],
    chat: ['agent-chat.webp', 628, 237],
    billing: ['billing-costs.webp', 1203, 780],
  };

  /* ---------- timing helpers ---------- */

  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let lo = 0, hi = 1, t = x;
      for (let i = 0; i < 50; i++) { // bisection: slow but exact and branch-free of NaNs
        if (sx(t) < x) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
      return sy(t);
    };
  }
  const E = {
    lin: (t) => t,
    outExpo: bezier(0.16, 1, 0.3, 1),
    inOut: bezier(0.42, 0, 0.58, 1),
    inQuad: bezier(0.55, 0.085, 0.68, 0.53),
  };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  /** Eased progress of frame f through [a, b]. */
  const P = (f, a, b, ease = E.lin) => (f <= a ? 0 : f >= b ? 1 : ease((f - a) / (b - a)));
  const snapAt = (f, start, values) => (f >= start && f < start + values.length ? values[f - start] : 0);
  function mix(a, b, t) {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return 'rgb(' + pa.map((v, i) => Math.round(lerp(v, pb[i], clamp(t)))).join(',') + ')';
  }
  function rng(seed) { // mulberry32: seeded, so "random" layouts are identical every render
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- DOM helpers ---------- */

  const stage = document.getElementById('stage');
  function el(parent, cls, style = {}, html) {
    const n = document.createElement('div');
    if (cls) n.className = cls;
    for (const [k, v] of Object.entries(style)) n.style[k] = typeof v === 'number' ? v + 'px' : v;
    if (html != null) n.innerHTML = html;
    parent.appendChild(n);
    return n;
  }
  function set(n, props) { for (const k in props) n.style[k] = props[k]; }
  function show(n, opacity) { n.style.opacity = opacity; n.style.visibility = opacity > 0.001 ? 'visible' : 'hidden'; }
  function svg(parent, w, h, inner, style = {}) {
    const holder = el(parent, '', { left: 0, top: 0, width: w, height: h, ...style });
    holder.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" style="left:0;top:0;overflow:visible">${inner}</svg>`;
    return holder;
  }
  /** Draw-on for elements created with pathLength="1". */
  function draw(node, t) { node.style.strokeDasharray = '1 1'; node.style.strokeDashoffset = String(1 - clamp(t)); node.style.opacity = t > 0 ? 1 : 0; }

  /** Screenshot crop shown at `scale`: region (sx, sy, sw, sh) of the native image. */
  function crop(parent, key, x, y, scale, region) {
    const [file, nw, nh] = IMG[key];
    const [sx, sy, sw, sh] = region || [0, 0, nw, nh];
    const box = el(parent, 'crop', { left: x, top: y, width: sw * scale, height: sh * scale });
    const img = document.createElement('img');
    img.src = SHOTS + file;
    img.alt = '';
    Object.assign(img.style, { left: -sx * scale + 'px', top: -sy * scale + 'px', width: nw * scale + 'px', height: nh * scale + 'px' });
    box.appendChild(img);
    return box;
  }
  /** Screenshot in a --surface window frame with a 40 px title bar. */
  function windowShot(parent, key, x, y, scale, title, region) {
    const [, nw, nh] = IMG[key];
    const w = (region ? region[2] : nw) * scale;
    const h = (region ? region[3] : nh) * scale;
    const win = el(parent, 'win', { left: x, top: y, width: w + 2, height: h + 42 });
    const bar = el(win, 'win-bar');
    bar.insertAdjacentHTML('beforeend', '<i style="left:18px"></i><i style="left:38px"></i><i style="left:58px"></i>');
    el(bar, 'win-title', {}, title);
    crop(win, key, 0, 40, scale, region);
    return win;
  }

  /* ---------- shared vector pieces ---------- */

  const AGENT = { violet: C.violet, info: C.info, warn: C.warn, accent: C.accent };
  /** Orchestration-node mark (rounded square + 5 satellite agent nodes), after agent-team.svg. */
  function markSVG(size, animated) {
    const nodes = [-90, -18, 54, 126, 198].map((deg, i) => {
      const r = (deg * Math.PI) / 180;
      return { x: 120 + 96 * Math.cos(r), y: 120 + 96 * Math.sin(r), x0: 120 + 52 * Math.cos(r), y0: 120 + 52 * Math.sin(r),
        c: [C.accent, C.violet, C.info, C.warn, C.accent][i] };
    });
    const pl = animated ? ' pathLength="1"' : '';
    return `<svg width="${size}" height="${size}" viewBox="0 0 240 240" fill="none" style="left:0;top:0;overflow:visible">
      <g stroke-linecap="round" stroke-width="5">
        ${nodes.map((n, i) => `<path class="mk-link" data-i="${i}" d="M${n.x0.toFixed(1)} ${n.y0.toFixed(1)}L${(n.x - (n.x - 120) * 0.15).toFixed(1)} ${(n.y - (n.y - 120) * 0.15).toFixed(1)}" stroke="${C.border}"${pl}/>`).join('')}
        <rect class="mk-box" x="80" y="80" width="80" height="80" rx="20" stroke="${C.accent}" fill="${C.surface}"${pl}/>
        <rect class="mk-core" x="104" y="104" width="32" height="32" rx="8" fill="${C.accent}" stroke="none"/>
        ${nodes.map((n, i) => `<circle class="mk-node" data-i="${i}" cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="15" fill="${C.raised}" stroke="${n.c}"/>`).join('')}
      </g></svg>`;
  }
  const CURSOR = `<svg width="40" height="40" viewBox="0 0 24 24" style="left:0;top:0"><path d="M4 2l15 11.2-6.6.9 3.8 7.4-3 1.5-3.8-7.5L4 20z" fill="${C.text}" stroke="${C.bgDeep}" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
  const CHECK = (c, s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" style="position:relative;vertical-align:-3px"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const WINDOWS = `<svg width="48" height="48" viewBox="0 0 24 24" style="position:relative;vertical-align:-6px;margin-right:20px"><path fill="${C.accent}" d="M3 5.5l7.5-1v7H3zM11.5 4.4L21 3v8.5h-9.5zM3 12.5h7.5v7L3 18.5zM11.5 12.5H21V21l-9.5-1.4z"/></svg>`;

  /* ---------- copy cues (also written to sizzler.vtt) ---------- */

  const cues = [];
  const cue = (start, end, text) => cues.push({ start, end, text });

  /** Kinetic text line: in over `inD` frames (ease-out-expo, rise), out over `outD` before `end`. */
  function kinetic(n, f, start, end, o = {}) {
    const inD = o.inD ?? 12, outD = o.outD ?? 8;
    const tin = P(f, start, start + inD, E.outExpo);
    const tout = end == null ? 0 : P(f, end - outD, end, E.inQuad);
    const rise = o.rise ?? 24;
    const s = lerp(o.scaleFrom ?? 1, 1, tin);
    show(n, tin * (1 - tout));
    n.style.transform = `translate(${o.dx || 0}px, ${(1 - tin) * rise - tout * 12}px) scale(${s})`;
  }
  function textLine(parent, cls, style, html, start, end, text) {
    if (text) cue(start, end ?? FRAMES, text);
    return el(parent, cls, style, html);
  }
  function caption(parent, start, end, text) {
    cue(start, end, text.replace('\n', ' '));
    const wrap = el(parent, 'caption-wrap');
    const c = document.createElement('span');
    c.className = 'caption';
    c.textContent = text;
    wrap.appendChild(c);
    return (f) => kinetic(wrap, f, start, end, { rise: 16 });
  }

  /* ---------- global layers ---------- */

  const bg = el(stage, 'fill');
  const grid = el(bg, 'bg-grid');
  const glow = el(bg, 'bg-glow');
  el(bg, 'bg-vignette');
  const scenesLayer = el(stage, 'layer');
  const bug = el(stage, '', { left: 96, top: 72, height: 56, width: 520 },
    `<div style="left:0;top:0;width:56px;height:56px">${markSVG(56)}</div><div style="left:72px;top:6px;font-size:34px;font-weight:700;letter-spacing:-0.01em;white-space:nowrap">Software Factory</div>`);
  const dim = el(stage, 'fill', { background: C.bgDeep });
  const flash = el(stage, 'fill', { background: '#ffffff' });
  const black = el(stage, 'fill', { background: '#000000' });

  const scenes = [];
  function scene(from, to, build) {
    const root = el(scenesLayer, 'scene');
    scenes.push({ from, to, root, update: build(root) });
  }

  /* ---------- Scene 1: Hook (f0-149) ---------- */
  scene(0, 149, (root) => {
    const cam = el(root, 'cam');
    const r = rng(23);
    const slots = [[860, 190], [1290, 170], [1040, 420], [1420, 450], [840, 660], [1240, 690]];
    const badges = { 1: [C.danger, 'Error'], 3: [C.warn, 'context lost'], 4: [C.danger, 'Error'] };
    const cards = slots.map(([x, y], i) => {
      const card = el(cam, 'card', { left: x + (r() - 0.5) * 60, top: y + (r() - 0.5) * 40, width: 400, height: 250 });
      const rot = (r() * 2 - 1) * 6;
      el(card, '', { left: 0, top: 0, right: 0, height: 48, borderBottom: '1.5px solid ' + C.border });
      [22, 42, 62].forEach((l) => el(card, '', { left: l, top: 18, width: 12, height: 12, borderRadius: '50%', background: C.border }));
      el(card, 'mono muted', { left: 88, top: 10, fontSize: '20px' }, `chat ${i + 1}`);
      for (let j = 0; j < 5; j++) el(card, 'bar', { left: 26, top: 74 + j * 32, width: 348 * (0.35 + r() * 0.6), background: j % 2 ? C.raised : C.border });
      let badge = null;
      if (badges[i]) {
        const [c, t] = badges[i];
        badge = el(card, 'badge', { right: 18, top: 9, color: c, border: `1.5px solid ${c}`, background: C.bg }, t);
      }
      return { card, rot, badge, start: 6 + i * 6, cx: x + 200, cy: y + 125, flashFrom: 46 + i * 7 };
    });
    const cursor = el(cam, 'cursor', {}, CURSOR);
    const order = [0, 2, 1, 3, 5, 4, 2, 0, 3, 1];
    const counter = el(root, '', { left: 1564, top: 96, width: 260, height: 56, borderRadius: '999px', background: C.surface, border: '1.5px solid ' + C.border });
    const counterText = el(counter, 'mono', { left: 0, right: 0, top: 10, fontSize: '26px', textAlign: 'center', color: C.muted });

    const l1 = textLine(root, 'display', { left: 96, top: 300 }, 'One prompt.', 12, 60, 'One prompt.');
    const l2 = textLine(root, 'headline muted', { left: 96, top: 456 }, 'Then another.', 36, 84, 'Then another.');
    const l3 = textLine(root, 'headline', { left: 96, top: 400 }, 'Then <span style="color:var(--danger)">chaos.</span>', 84, 128, 'Then chaos.');
    const chaos = l3.querySelector('span');
    const cap = caption(root, 90, 140, "Solo AI prompting doesn't scale.");

    return (f) => {
      const whip = P(f, 140, 149, E.inQuad);
      cam.style.transform = `translateX(${snapAt(f, 84, [8, -8, 6, -6, 4, -4, 2, -2])}px)`;
      cards.forEach((c) => {
        const t = P(f, c.start, c.start + 6, E.outExpo);
        show(c.card, t);
        c.card.style.transform = `translateX(${-1800 * whip}px) rotate(${c.rot}deg) scale(${lerp(0.82, 1, t)})`;
        if (c.badge) {
          // Flashes at 1.5 Hz (well under the 3 flashes/s limit), then stays on.
          const on = f >= c.flashFrom && (f >= c.flashFrom + 60 || Math.floor((f - c.flashFrom) / 10) % 2 === 0);
          show(c.badge, on ? 1 : 0);
        }
      });
      // Cursor darts between cards every 12 frames.
      const k = clamp(Math.floor((f - 18) / 12), 0, order.length - 1);
      const from = cards[order[Math.max(0, k - 1)]], to = cards[order[k]];
      const mt = P(f, 18 + k * 12, 18 + k * 12 + 8, E.outExpo);
      show(cursor, f >= 18 ? 1 - whip : 0);
      cursor.style.transform = `translate(${lerp(from.cx, to.cx, mt) - 1800 * whip}px, ${lerp(from.cy, to.cy, mt)}px)`;
      counterText.textContent = `tabs open: ${1 + Math.round(13 * P(f, 6, 120))}`;
      show(counter, P(f, 6, 12) * (1 - whip));
      kinetic(l1, f, 12, 60, { scaleFrom: 1.08 });
      kinetic(l2, f, 36, 84);
      kinetic(l3, f, 84, 128, { inD: 1, rise: 0 });
      chaos.style.transform = `translateX(${snapAt(f, 84, [4, -4, 4, -4, 3, -3, 2, -2])}px)`;
      cap(f);
      root.style.filter = `grayscale(${whip})`;
    };
  });

  /* ---------- Scene 2: Brand reveal (f150-269) ---------- */
  scene(150, 289, (root) => {
    const blackout = el(root, 'fill', { background: '#000' });
    const cam = el(root, 'cam', { transformOrigin: '960px 540px' });
    const shot = windowShot(cam, 'overview', 478, 345, 1, 'Software Factory: Overview');
    const brand = el(root, 'layer', { transformOrigin: '960px 470px' });
    const mark = el(brand, '', { left: 840, top: 260, width: 240, height: 240 }, markSVG(240, true));
    const dot = svg(brand, 1920, 1080, `<circle class="dot" cx="960" cy="380" r="0" fill="${C.accent}"/><circle class="ring" cx="960" cy="380" r="10" stroke="${C.accent}" stroke-width="3"/>`);
    const word = textLine(brand, 'display centered', { top: 548 }, '', 176, 269, 'Software Factory');
    const letters = [...'Software Factory'].map((ch) => {
      const s = document.createElement('span');
      s.textContent = ch;
      word.appendChild(s);
      return s;
    });
    const sub = textLine(root, 'headline muted centered', { top: 712, fontSize: '56px' }, 'Manage a team of AI agents.', 200, 255, 'Manage a team of AI agents.');
    const links = [...mark.querySelectorAll('.mk-link')], nodes = [...mark.querySelectorAll('.mk-node')];
    const box = mark.querySelector('.mk-box'), core = mark.querySelector('.mk-core');
    const dotC = dot.querySelector('.dot'), ringC = dot.querySelector('.ring');

    return (f) => {
      show(root, 1 - P(f, 270, 289, E.inOut));
      show(blackout, 1 - P(f, 166, 206, E.inOut));
      const push = lerp(1, 1.08, P(f, 150, 269, E.inOut));
      cam.style.transform = `scale(${push})`;
      // Dot -> ring -> mark draw-on (24 f).
      dotC.setAttribute('r', String(10 * P(f, 150, 156, E.outExpo) * (1 - P(f, 164, 170))));
      ringC.setAttribute('r', String(lerp(10, 70, P(f, 156, 172, E.outExpo))));
      show(ringC, f >= 156 ? 1 - P(f, 160, 174) : 0);
      draw(box, P(f, 160, 184, E.inOut));
      show(core, P(f, 176, 184, E.outExpo));
      links.forEach((l, i) => draw(l, P(f, 166 + i * 2, 180 + i * 2, E.inOut)));
      nodes.forEach((n, i) => {
        const t = P(f, 174 + i * 2, 184 + i * 2, E.outExpo);
        show(n, t);
        n.setAttribute('r', String(15 * t));
      });
      letters.forEach((s, i) => {
        const t = P(f, 176 + i * 2, 188 + i * 2, E.outExpo);
        show(s, t);
        s.style.transform = `translateY(${24 * (1 - t)}px)`;
      });
      kinetic(sub, f, 200, 255);
      // Overview: ghosted and blurred, then sharpens and slides to the right 30% of frame.
      const s = P(f, 228, 256, E.inOut);
      show(shot, 0.25 * P(f, 170, 190, E.inOut) + 0.75 * s);
      shot.style.filter = `blur(${12 * (1 - s)}px)`;
      shot.style.transform = `translateX(${520 * s}px) scale(${lerp(1, 0.6, s)})`;
      // Wordmark + mark move up-left into the 64 px lockup (f245-269), then hand over to the bug.
      const m = P(f, 245, 269, E.inOut);
      brand.style.transform = `translate(${-700 * m}px, ${-370 * m}px) scale(${lerp(push, 0.25, m)})`;
      show(brand, 1 - P(f, 252, 262));
    };
  });

  /* ---------- Scene 3: PM decomposes the objective (f270-449) ---------- */
  scene(262, 457, (root) => {
    const cam = el(root, 'cam', { transformOrigin: '960px 540px' });
    const board = windowShot(cam, 'tasks', 680, 270, 0.914, 'Software Factory: Tasks');
    const obj = el(cam, 'card-raised', { left: 96, top: 440, width: 640, height: 130 });
    el(obj, 'label muted', { left: 30, top: 18, fontSize: '22px' }, 'OBJECTIVE');
    const typed = el(obj, 'mono', { left: 30, top: 62, fontSize: '28px', color: C.text });
    const OBJECTIVE = 'Build a website for my product';
    cue(282, 449, OBJECTIVE); // starts with the 'Give it a goal.' headline so the caption reads headline first
    const TASKS = [['Design', C.violet], ['Frontend', C.info], ['DevOps', C.warn], ['QA', C.accent], ['SEO', C.violet]];
    const pmX = 830, pmY = 505;
    const lines = svg(cam, 1920, 1080,
      `<path class="c0" d="M736 ${pmY}H${pmX - 40}" stroke="${C.accent}" stroke-width="3" stroke-linecap="round" pathLength="1"/>` +
      TASKS.map(([, c], i) => `<path class="ct" d="M${pmX + 40} ${pmY}C960 ${pmY} 960 ${302 + i * 124} 1060 ${302 + i * 124}" stroke="${c}" stroke-width="3" stroke-linecap="round" pathLength="1"/>`).join(''));
    const pm = el(cam, '', { left: pmX - 40, top: pmY - 40, width: 80, height: 80 });
    el(pm, 'avatar', { left: 0, top: 0, width: 80, height: 80, borderColor: C.accent, color: C.accent, fontSize: '30px', lineHeight: '74px' }, 'M');
    el(pm, 'mono muted', { left: -40, top: 92, width: 160, textAlign: 'center', fontSize: '22px' }, 'Maya · PM');
    const cards = TASKS.map(([name, c], i) => {
      const card = el(cam, 'card', { left: 1060, top: 250 + i * 124, width: 560, height: 104, borderLeft: `6px solid ${c}` });
      el(card, 'mono muted', { left: 26, top: 14, fontSize: '22px' }, `TASK-00${i + 1}`);
      el(card, '', { left: 26, top: 44, fontSize: '34px', fontWeight: 600 }, name);
      el(card, '', { right: 26, top: 36, width: 30, height: 30, borderRadius: '50%', border: `3px solid ${c}`, background: C.raised });
      return { card, dx: pmX - 1060, dy: pmY - (250 + i * 124 + 52) };
    });
    const c0 = lines.querySelector('.c0'), cts = [...lines.querySelectorAll('.ct')];
    const h1 = textLine(root, 'headline', { left: 96, top: 150 }, 'Give it a goal.', 282, 330, 'Give it a goal.');
    const h2 = textLine(root, 'headline', { left: 96, top: 150 }, 'The PM breaks it into <span style="color:var(--accent)">tasks.</span>', 340, 400, 'The PM breaks it into tasks.');
    const cap = caption(root, 390, 440, 'Plans, assigns, tracks. Automatically.');

    return (f) => {
      const out = P(f, 441, 449, E.inOut);
      show(root, P(f, 266, 278, E.inOut) * (1 - out));
      const push = f < 354 ? lerp(1, 1.06, P(f, 330, 354, E.outExpo)) : lerp(1.06, 1, P(f, 354, 410, E.inOut));
      cam.style.transform = `translateX(${-120 * P(f, 270, 449, E.inOut)}px) scale(${push * lerp(1, 0.94, out)})`;
      show(board, lerp(0.2, 0.32, P(f, 380, 430, E.inOut)));
      const n = clamp(f - 276 + 1, 0, OBJECTIVE.length);
      const caret = n < OBJECTIVE.length || Math.floor(f / 15) % 2 === 0;
      typed.innerHTML = `<span style="color:var(--accent)">&gt; </span>${OBJECTIVE.slice(0, n)}<span style="color:var(--accent);opacity:${caret ? 1 : 0}">▍</span>`;
      show(obj, P(f, 270, 282, E.outExpo));
      draw(c0, P(f, 306, 316, E.inOut));
      const pt = P(f, 312, 324, E.outExpo);
      show(pm, pt);
      pm.style.transform = `scale(${lerp(0.4, 1, pt)})`;
      cards.forEach((c, i) => {
        draw(cts[i], P(f, 330 + i * 4, 350 + i * 4, E.inOut));
        const t = P(f, 334 + i * 4, 352 + i * 4, E.outExpo);
        show(c.card, t);
        c.card.style.transform = `translate(${c.dx * (1 - t)}px, ${c.dy * (1 - t)}px) scale(${lerp(0.3, 1, t)})`;
      });
      kinetic(h1, f, 282, 330);
      kinetic(h2, f, 340, 400);
      cap(f);
    };
  });

  /* ---------- Scene 4: Roles work in parallel (f450-689) ---------- */
  scene(442, 700, (root) => {
    const cam = el(root, 'cam', { transformOrigin: '960px 320px' });
    const ROLES = [
      { role: 'Designer', ini: 'DS', c: C.violet, status: 'designing', lines: ['palette → tokens.css', 'type scale: 8 steps', 'hero layout v2', 'contrast check 4.5:1'] },
      { role: 'Frontend', ini: 'FE', c: C.info, status: 'coding', lines: ['src/pages/index.astro', '+ Hero.astro', '+ Features.astro', 'build ok · 0 errors'] },
      { role: 'DevOps', ini: 'DO', c: C.warn, status: 'building', lines: ['docker build .', 'nginx.conf: headers', 'ci: build → test', 'image ready'] },
      { role: 'QA', ini: 'QA', c: C.accent, status: 'testing', lines: ['nav.spec passed', 'hero.spec passed', 'a11y: 0 violations', '24 passed, 0 failed'], checks: true },
      { role: 'SEO', ini: 'SE', c: C.violet, status: 'optimising', lines: ['title + meta description', 'sitemap.xml', 'og:image 1200x630', 'json-ld: SoftwareApp'] },
    ];
    const POS = [[200, 170], [720, 170], [1240, 170], [460, 500], [980, 500]];
    const panels = ROLES.map((r, i) => {
      const lit = 456 + i * 8;
      const p = el(cam, 'card', { left: POS[i][0], top: POS[i][1], width: 480, height: 300 });
      const halo = el(p, '', { inset: '-1.5px', borderRadius: '18px', border: `2px solid ${r.c}`, boxShadow: `0 0 40px -8px ${r.c}` });
      const av = el(p, 'avatar', { left: 26, top: 26, width: 64, height: 64, fontSize: '22px', lineHeight: '58px', color: C.muted });
      el(p, '', { left: 108, top: 24, fontSize: '32px', fontWeight: 600 }, r.role);
      el(p, 'mono muted', { left: 108, top: 66, fontSize: '20px' }, `task/TASK-00${i + 1}`);
      const chip = el(p, 'chip', { right: 24, top: 30 }, `<i style="background:${r.c}"></i>${r.status}`);
      el(p, '', { left: 26, top: 116, width: 428, height: 8, borderRadius: '4px', background: C.raised });
      const fill = el(p, '', { left: 26, top: 116, width: 428, height: 8, borderRadius: '4px', background: r.c, transformOrigin: '0 0' });
      const rows = r.lines.map((t, j) => ({ t, n: el(p, 'mono', { left: 26, top: 142 + j * 36, fontSize: '22px', color: j === 3 ? C.text : C.muted }), at: lit + 12 + j * 18 }));
      return { ...r, i, lit, p, halo, av, chip, fill, rows, phase: i * 17 };
    });
    const head = textLine(root, 'headline centered', { top: 856 }, '', 462, 510, 'Designer. Frontend. DevOps. QA. SEO.');
    const wordEls = ROLES.map((r, i) => {
      const s = document.createElement('span');
      s.textContent = `${r.role}.` + (i < 4 ? ' ' : '');
      head.appendChild(s);
      return s;
    });
    const all = textLine(root, 'display centered', { top: 812 }, 'All at once.', 540, 610, 'All at once.');
    // Zoomed agent-chat window (1.4x) with a streaming message.
    const chat = el(root, 'win', { left: 520, top: 250, width: 881, height: 456 });
    const bar = el(chat, 'win-bar');
    el(bar, 'win-title', {}, 'Frontend · agent chat');
    crop(chat, 'chat', 0, 40, 1.4);
    el(chat, '', { left: 0, right: 0, top: 372, height: 1, background: C.border });
    const stream = el(chat, 'mono', { left: 28, top: 394, fontSize: '24px', color: C.text });
    const MSG = 'Frontend: building the hero on task/TASK-002';
    const roles = windowShot(root, 'roles', 1184, 360, 640 / 1200, 'Software Factory: Roles');
    const cap = caption(root, 620, 680, 'Each agent owns a role,\nand works in parallel.');

    return (f) => {
      const dimOut = P(f, 682, 690, E.inOut);
      show(root, P(f, 442, 452, E.inOut) * (1 - P(f, 690, 700, E.inOut)));
      const dive = f < 620 ? P(f, 560, 590, E.inOut) : 1 - P(f, 620, 660, E.inOut);
      const drift = lerp(1, 1.02, P(f, 450, 690, E.inOut));
      cam.style.transform = `scale(${lerp(1, 1.4, dive) * drift})`;
      panels.forEach((pn) => {
        const t = P(f, pn.lit, pn.lit + 10, E.outExpo);
        const focus = pn.i === 1 ? 1 : 1 - 0.8 * dive;
        show(pn.p, lerp(0.3, 1, t) * focus * (1 - 0.6 * dimOut));
        show(pn.halo, 0.55 * t);
        set(pn.av, { borderColor: mix(C.border, pn.c, t), color: mix(C.muted, pn.c, t) });
        pn.av.textContent = pn.ini;
        show(pn.chip, t);
        const cyc = ((f - pn.lit + pn.phase) % 90 + 90) % 90;
        pn.fill.style.transform = `scaleX(${f < pn.lit ? 0 : lerp(0.08, 1, E.inOut(cyc / 90))})`;
        pn.rows.forEach((row) => {
          const n = clamp(Math.floor((f - row.at) * 1.5), 0, row.t.length);
          const done = n === row.t.length;
          const mark = pn.checks && n > 0 ? CHECK(done ? C.accent : C.border, 22) + ' ' : '';
          row.n.innerHTML = mark + row.t.slice(0, n);
        });
      });
      wordEls.forEach((s, i) => {
        const at = 462 + i * 8;
        const t = P(f, at, at + 8, E.outExpo);
        show(s, t);
        s.style.transform = `translateY(${20 * (1 - t)}px) scale(${lerp(1.15, 1, t)})`;
        s.style.color = mix(ROLES[i].c, C.text, P(f, at + 12, at + 24));
      });
      kinetic(head, f, 462, 510, { inD: 1, rise: 0 });
      kinetic(all, f, 540, 610, { scaleFrom: 1.1 });
      const ci = P(f, 566, 586, E.outExpo), co = P(f, 616, 630, E.inQuad);
      show(chat, ci * (1 - co));
      chat.style.transform = `translateY(${80 * (1 - ci) + 40 * co}px)`;
      const n = clamp(Math.floor((f - 580) * 1.6), 0, MSG.length);
      stream.innerHTML = `<span style="color:var(--info)">${MSG.slice(0, Math.min(n, 9))}</span>${MSG.slice(9, n)}<span style="color:var(--info);opacity:${Math.floor(f / 8) % 2 ? 0 : 1}">▍</span>`;
      const ri = P(f, 640, 646, E.outExpo), ro = P(f, 654, 660, E.inQuad);
      show(roles, ri * (1 - ro));
      roles.style.transform = `scale(${lerp(0.9, 1, ri)})`;
      roles.style.transformOrigin = '100% 100%';
      cap(f);
    };
  });

  /* ---------- Scene 5: Branches, approval gates, budget (f690-929) ---------- */
  let trackX = 0; // read by the background for parallax
  scene(686, 931, (root) => {
    const strip = el(root, '', { left: 0, top: 0, width: 5760, height: 1080 });
    const BR = [C.violet, C.info, C.warn, C.accent, C.violet];
    // 5a: branch per task
    const a = el(strip, 'layer', { left: 0 });
    const gA = svg(a, 1920, 1080,
      `<path class="main" d="M160 700H1760" stroke="${C.muted}" stroke-width="4" stroke-linecap="round" pathLength="1"/>` +
      BR.map((c, i) => {
        const x0 = 280 + i * 200, y = 320 + i * 72;
        return `<path class="br" d="M${x0} 700C${x0 + 70} 700 ${x0 + 50} ${y} ${x0 + 130} ${y}H1560" stroke="${c}" stroke-width="4" stroke-linecap="round" pathLength="1"/>` +
          `<circle class="nd" cx="${x0}" cy="700" r="8" fill="${c}"/><circle class="ne" cx="1560" cy="${y}" r="9" fill="${C.bg}" stroke="${c}" stroke-width="4"/>`;
      }).join(''));
    const labels = BR.map((c, i) => el(a, 'label', { left: 280 + i * 200 + 150, top: 320 + i * 72 - 44, color: c }, `task/TASK-00${i + 1}`));
    const hA = textLine(a, 'headline', { left: 96, top: 150 }, 'A branch for every task.', 696, 766, 'A branch for every task.');
    // 5b: approval gate
    const b = el(strip, 'layer', { left: 1920 });
    const gB = svg(b, 1920, 1080,
      `<path d="M0 760H1920" stroke="${C.muted}" stroke-width="4"/>` +
      `<path d="M140 760C210 760 190 520 260 520H716" stroke="${C.info}" stroke-width="4" stroke-linecap="round"/>` +
      `<circle cx="140" cy="760" r="8" fill="${C.info}"/>` +
      `<path class="merge" d="M844 520H900C970 520 950 760 1020 760" stroke="${C.accent}" stroke-width="4" stroke-linecap="round" pathLength="1"/>` +
      `<circle class="gate" cx="780" cy="520" r="64" fill="${C.raised}" stroke-width="4"/>` +
      `<path class="shield" d="M780 486l-26 10v20c0 18 11 30 26 36 15-6 26-18 26-36v-20z" stroke-width="4" stroke-linejoin="round"/>` +
      `<path class="tick" d="M762 520l12 12 24-24" stroke="${C.accent}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`);
    const gate = gB.querySelector('.gate'), shield = gB.querySelector('.shield'), tick = gB.querySelector('.tick'), merge = gB.querySelector('.merge');
    const rc = el(b, 'card-raised', { left: 1100, top: 380, width: 660, height: 290, boxShadow: 'var(--shadow-mock)' });
    const rav = el(rc, '', { left: 32, top: 32, width: 60, height: 60, borderRadius: '50%', border: '4px solid', background: C.surface });
    const ripple = el(rc, 'ring', { left: 32, top: 32, width: 60, height: 60, color: C.accent });
    el(rc, 'mono', { left: 116, top: 30, fontSize: '30px', fontWeight: 600 }, 'Review requested');
    el(rc, 'mono muted', { left: 116, top: 74, fontSize: '22px' }, 'task/TASK-002 · Frontend');
    el(rc, '', { left: 32, right: 32, top: 136, height: 1, background: C.border });
    const approve = el(rc, 'btn', { left: 32, top: 178, width: 220, height: 64, lineHeight: '64px', fontSize: '28px', background: C.accent, color: C.onAccent }, 'Approve');
    el(rc, 'btn', { left: 276, top: 178, width: 300, height: 64, lineHeight: '60px', fontSize: '28px', border: `2px solid ${C.border}`, color: C.muted }, 'Request changes');
    const cursor = el(b, 'cursor', {}, CURSOR);
    const hB = textLine(b, 'headline', { left: 96, top: 150 }, 'You <span style="color:var(--accent)">approve</span> every merge.', 776, 846, 'You approve every merge.');
    // 5c: budget
    const c = el(strip, 'layer', { left: 3840 });
    const bill = windowShot(c, 'billing', 209, 290, 1.3, 'Software Factory: Billing', [25, 190, 1155, 226]);
    const budget = el(c, 'card', { left: 209, top: 668, width: 1504, height: 196 });
    const counter = el(budget, 'mono', { left: 36, top: 26, fontSize: '44px', fontWeight: 600 });
    el(budget, '', { left: 36, top: 126, width: 1432, height: 20, borderRadius: '10px', background: C.raised });
    const meter = el(budget, '', { left: 36, top: 126, width: 1432, height: 20, borderRadius: '10px', transformOrigin: '0 0' });
    el(budget, '', { left: 1466, top: 112, width: 4, height: 48, background: C.text, borderRadius: '2px' });
    el(budget, 'label muted', { right: 60, top: 70, fontSize: '22px' }, 'cap');
    const hC = textLine(c, 'headline', { left: 96, top: 150 }, 'Your budget. Your <span style="color:var(--warn)">cap.</span>', 856, 926, 'Your budget. Your cap.');
    cue(862, 926, '$12.40 / $50.00');
    // Continuity label (does not track with the camera).
    const tokens = ['branch-per-task', 'approval-gates', 'budget-control'];
    const cont = el(root, 'label', { left: 96, bottom: 96 });
    const tokEls = tokens.map((t, i) => {
      const s = document.createElement('span');
      s.textContent = t;
      cont.appendChild(s);
      if (i < 2) { const d = document.createElement('span'); d.textContent = ' · '; d.style.color = C.muted; cont.appendChild(d); }
      return s;
    });
    const main = gA.querySelector('.main'), brs = [...gA.querySelectorAll('.br')], nds = [...gA.querySelectorAll('.nd')], nes = [...gA.querySelectorAll('.ne')];

    return (f) => {
      const enter = P(f, 686, 702, E.outExpo);
      show(root, enter * (1 - P(f, 922, 931, E.inOut)));
      trackX = -1920 * (P(f, 756, 780, E.inOut) + P(f, 836, 860, E.inOut));
      strip.style.transform = `translateX(${trackX + 400 * (1 - enter)}px)`;
      // 5a
      draw(main, P(f, 690, 706, E.inOut));
      brs.forEach((br, i) => {
        draw(br, P(f, 700 + i * 4, 716 + i * 4, E.inOut));
        show(nds[i], P(f, 700 + i * 4, 704 + i * 4));
        show(nes[i], P(f, 714 + i * 4, 718 + i * 4));
        show(labels[i], P(f, 712 + i * 4, 722 + i * 4, E.outExpo));
      });
      kinetic(hA, f, 696, 766);
      // 5b
      const ok = P(f, 818, 824, E.outExpo);
      const gc = mix(C.warn, C.accent, ok);
      gate.setAttribute('stroke', gc);
      shield.setAttribute('stroke', gc);
      show(shield, 1 - ok);
      show(tick, ok);
      draw(merge, P(f, 824, 844, E.inOut));
      rav.style.borderColor = gc;
      const rp = P(f, 818, 830, E.outExpo);
      show(ripple, f >= 818 ? 1 - rp : 0);
      ripple.style.transform = `scale(${lerp(1, 2.4, rp)})`;
      const ci = P(f, 776, 790, E.outExpo);
      show(rc, ci);
      rc.style.transform = `scale(${lerp(0.94, 1, ci)})`;
      const press = f >= 814 && f < 820 ? 0.94 : 1;
      approve.style.transform = `scale(${press})`;
      const m = P(f, 792, 810, E.outExpo);
      show(cursor, P(f, 788, 794) * (1 - P(f, 836, 846)));
      cursor.style.transform = `translate(${lerp(1760, 1232, m)}px, ${lerp(980, 592, m)}px) scale(${f >= 814 && f < 820 ? 0.85 : 1})`;
      kinetic(hB, f, 776, 846);
      // 5c
      const bi = P(f, 846, 868, E.outExpo);
      bill.style.transform = `translateX(${200 * (1 - bi)}px)`;
      show(bill, bi);
      counter.textContent = `$${(12.4 * P(f, 862, 892, E.outExpo)).toFixed(2)} / $50.00`; // app format, e.g. Budget $0.00 / $5.00
      const fill = P(f, 866, 906, E.inOut);
      meter.style.transform = `scaleX(${Math.max(0.001, fill)})`;
      meter.style.background = mix(C.accent, C.warn, P(fill, 0.78, 0.82));
      budget.style.transform = `translateX(${snapAt(f, 906, [6, -6, 4, -4, 2, -2])}px)`;
      kinetic(hC, f, 856, 926);
      const active = f < 770 ? 0 : f < 850 ? 1 : 2;
      tokEls.forEach((s, i) => { s.style.color = i === active ? C.accent : C.muted; });
      show(cont, P(f, 696, 708));
    };
  });

  /* ---------- Scene 6: Merged result (f930-1079) ---------- */
  scene(912, 1079, (root) => {
    const BR = [C.violet, C.info, C.warn, C.accent, C.violet];
    const conv = svg(root, 1920, 1080, BR.map((c, i) =>
      `<path d="M-20 ${260 + i * 140}C700 ${260 + i * 140} 1200 540 1700 540" stroke="${c}" stroke-width="4" stroke-linecap="round" pathLength="1"/>`).join('') +
      `<circle class="pt" cx="1700" cy="540" r="14" fill="${C.accent}"/>`);
    const convPaths = [...conv.querySelectorAll('path')], pt = conv.querySelector('.pt');
    const cam = el(root, 'cam', { transformOrigin: '960px 540px' });
    const shot = windowShot(cam, 'overview', 333, 313, 1.3, 'Software Factory: Overview');
    shot.style.transformOrigin = '960px 560px';
    const chip = el(cam, '', { left: 560, top: 778, width: 800, height: 64, borderRadius: '999px', background: C.accentTint, border: `2px solid ${C.accent}` },
      `<div style="left:0;right:0;top:12px;text-align:center;font-size:30px;font-weight:600;color:var(--accent);white-space:nowrap">${CHECK(C.accent, 30)} Merged<span class="mono" style="color:var(--text);font-weight:500;font-size:28px">   5 / 5 tasks merged</span></div>`);
    const dots = Array.from({ length: 12 }, () => el(cam, '', { left: 954, top: 804, width: 12, height: 12, borderRadius: '50%', background: C.accent }));
    const title = textLine(root, 'display centered', { top: 130 }, 'Merged. <span style="color:var(--accent)">Shipped.</span>', 944, 990, 'Merged. Shipped.');
    const cap = caption(root, 1000, 1060, 'A whole project, finished by a team.');
    cue(950, 1056, '5 / 5 tasks merged');

    return (f) => {
      show(root, 1);
      convPaths.forEach((p, i) => draw(p, P(f, 914 + i * 2, 928 + i * 2, E.inOut)));
      show(conv, 1 - P(f, 934, 946));
      show(pt, P(f, 926, 930));
      const pull = f < 1000 ? lerp(1.15, 1, P(f, 930, 1000, E.outExpo)) : lerp(1, 1.02, P(f, 1000, 1079, E.inOut));
      cam.style.transform = `scale(${pull})`;
      show(cam, P(f, 930, 942, E.inOut));
      const dimmed = P(f, 1056, 1080, E.inOut);
      show(shot, lerp(1, 0.15, dimmed));
      shot.style.transform = `scale(${lerp(1, 1.04, P(f, 930, 1079, E.inOut))})`;
      const ct = P(f, 950, 962, E.outExpo);
      show(chip, ct * (1 - dimmed));
      chip.style.transform = `scale(${lerp(0.6, 1, ct)})`;
      const rp = P(f, 952, 982, E.outExpo);
      dots.forEach((d, i) => {
        const a = (i / 12) * Math.PI * 2;
        show(d, f >= 952 ? 1 - P(f, 966, 982) : 0);
        d.style.transform = `translate(${Math.cos(a) * 460 * rp}px, ${Math.sin(a) * 170 * rp}px)`;
      });
      kinetic(title, f, 944, 990);
      cap(f);
    };
  });

  /* ---------- Scene 7: CTA end card (f1080-1199) ---------- */
  scene(1080, 1199, (root) => {
    // Ghosted overview, same geometry as the end of Scene 6 (camera 1.02 x shot 1.04).
    const ghostCam = el(root, 'cam', { transformOrigin: '960px 540px', transform: 'scale(1.02)' });
    const ghost = windowShot(ghostCam, 'overview', 333, 313, 1.3, 'Software Factory: Overview');
    set(ghost, { transformOrigin: '960px 560px', transform: 'scale(1.04)' });
    const lock = el(root, '', { left: 0, top: 140, width: 1920, height: 80 },
      `<div style="left:0;right:0;top:0;text-align:center;white-space:nowrap"><span style="width:80px;height:80px;position:relative;vertical-align:middle">${markSVG(80)}</span><span style="font-size:52px;font-weight:700;letter-spacing:-0.01em;vertical-align:middle;margin-left:20px">Software Factory</span></div>`);
    const head = textLine(root, 'display centered', { top: 372 }, 'Your AI team is ready.', 1086, null, 'Your AI team is ready.');
    // Plain text, not a button (TASK-030): this frame is the poster, where a burned-in pill looks
    // clickable but is only pixels and competes with the real play and download controls.
    const dl = el(root, 'headline centered', { top: 600, fontSize: '56px', color: C.text },
      `${WINDOWS}Download for Windows`);
    cue(1104, FRAMES, 'Download for Windows');
    // TODO(PO): confirm requirements; mirrors download.platformNote in src/data/site.ts.
    const plat = textLine(root, 'label muted centered', { top: 700 }, 'Windows 10 and 11', 1120, null, 'Windows 10 and 11');
    const url = SITE_URL ? textLine(root, 'label centered', { top: 752 }, SITE_URL, 1126, null, SITE_URL) : null;

    return (f) => {
      show(root, 1);
      show(ghost, lerp(0.15, 0.18, P(f, 1080, 1092)));
      const lt = P(f, 1080, 1094, E.outExpo);
      show(lock, lt);
      lock.style.transform = `translateY(${16 * (1 - lt)}px)`;
      kinetic(head, f, 1086, null);
      const dt = P(f, 1104, 1120, E.outExpo);
      show(dl, dt);
      dl.style.transform = `translateY(${16 * (1 - dt)}px)`;
      kinetic(plat, f, 1120, null);
      if (url) kinetic(url, f, 1126, null);
    };
  });

  /* ---------- global per-frame state ---------- */

  function glowAt(f) {
    if (f < 150) return 0;
    if (f < 270) return 0.9 * P(f, 165, 205, E.inOut);
    if (f < 930) return lerp(0.9, 0.75, P(f, 270, 300));
    if (f < 1080) return lerp(1, 0.75, P(f, 930, 960, E.inOut));
    if (f >= 1140) return 1; // all motion stops at f1140
    return 0.6 + 0.4 * (0.5 + 0.5 * Math.cos((2 * Math.PI * (f - 1140)) / FPS)); // 1 Hz pulse
  }

  function seek(frame) {
    const f = clamp(Math.round(frame), 0, FRAMES - 1);
    for (const s of scenes) {
      const on = f >= s.from && f <= s.to;
      s.root.style.display = on ? 'block' : 'none';
      if (on) s.update(f);
    }
    const motion = Math.min(f, 1140);
    const drift = -((motion * 12) / FPS) % 96; // grid drifts 12 px/s
    const parallax = f >= 686 && f <= 931 ? (trackX * 0.5) % 96 : 0;
    grid.style.transform = `translate(${drift + parallax}px, ${drift * 0.5}px)`;
    show(glow, glowAt(f));
    show(bug, P(f, 254, 266) * (1 - P(f, 1080, 1088)));
    show(dim, 0.7 * P(f, 140, 149, E.inQuad) * (f < 150 ? 1 : 0));
    show(flash, f >= 930 && f < 934 ? 0.12 : 0);
    show(black, f === 0 || f === 149 ? 1 : 0);
    return f;
  }

  const imgs = [...document.images];
  const ready = Promise.all([
    document.fonts.ready,
    ...imgs.map((i) => i.decode().catch(() => { throw new Error('Image failed to load: ' + i.src); })),
  ]).then(() => true);

  cues.sort((a, b) => a.start - b.start || a.end - b.end);
  window.SIZZLER = { fps: FPS, frames: FRAMES, ready, seek, cues };

  // Manual preview: scene.html?f=1140 shows one frame, scene.html?play plays in real time.
  const q = new URLSearchParams(location.search);
  if (q.has('f')) ready.then(() => seek(Number(q.get('f'))));
  else if (q.has('play')) ready.then(() => { const t0 = performance.now(); const tick = () => { seek(((performance.now() - t0) / 1000) * FPS % FRAMES); requestAnimationFrame(tick); }; tick(); });
  else seek(0);
})();
