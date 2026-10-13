# Sizzler video: concept, storyboard and motion spec (TASK-022)

Status: spec for the production tasks that follow. Authored for Opus 5.5 production.
Source of truth for colour, type and spacing: `src/styles/tokens.css`. Copy marked `TODO(PO)` follows the site's existing convention for unconfirmed claims.

## 1. Concept

**Working title:** "One goal. A whole team."
**Logline:** Solo AI prompting is chaos; Software Factory turns it into a managed team that ships a reviewed, merged project.
**Tone:** confident, fast, tactile. Dark, precise, a single green accent. Motion is snappy and mechanical (UI-native), never bouncy or playful.

## 2. Technical format

| Item | Value |
|---|---|
| Duration | **40.0 s** (1200 frames) |
| Frame | 16:9, 1920x1080 |
| Frame rate | 30 fps |
| Safe area | 96 px margin (5%) all sides; captions inside it |
| Audio | None required. Every message is carried by burned-in captions. Music optional (section 9) |
| Deliverables | `sizzler.mp4` (H.264, ≤ 8 MB target), `sizzler.webm` (VP9), `sizzler-poster.png`; captions burned in, plus a `.vtt` of the same lines for accessibility |
| Loop | Last frame cross-dissolves to the poster look (Scene 7 is a held end card), no loop required |

## 3. Palette, type and easing (tied to tokens.css)

### Colour

| Role in video | Token | Hex |
|---|---|---|
| Canvas | `--bg-deep` (vignette edge) → `--bg` (centre) | #080b0f → #0b0f14 |
| Panels / cards | `--surface`, `--surface-raised` | #121820, #1a222d |
| Hairlines | `--border` | #2a3441 |
| Background grid | `--grid-line` (4% white), 96 px pitch | |
| Headline text | `--text` | #e6edf3 |
| Secondary text | `--text-muted` | #9aa7b5 |
| Hero accent / success / merge | `--accent` (glow `--glow-accent`, tint `--accent-tint`) | #3ddc97 |
| Chaos / failure | `--danger` | #ff6b6b |
| Budget / caution | `--warn` | #f5b544 |
| Info | `--info` | #5cb8ff |
| Agent colours | PM `--accent`, Architect `--violet`, Frontend `--info`, DevOps `--warn`, QA `--accent`, SEO `--violet` (matches `src/data/site.ts` agent colours) | |
| CTA button | fill `--accent`, label `--on-accent` (#06130d) | |

Rule: one accent per beat. Chaos scenes use `--danger` + `--warn` only; from Scene 2 on, green leads and other hues appear only as agent identity or status. Contrast: all caption text is `--text` or `--text-muted` on `--bg`/`--surface` (≥ 4.5:1); never use `--text-subtle` in video.

### Type

Video sizes are px at 1920x1080 (the site scale is rem/fluid; these are the equivalent fixed values).
Fonts are the site stacks, `--font-sans` (Segoe UI Variable) for display/captions and `--font-mono` (Cascadia Mono) for code, branches, costs. No web fonts; render on a machine with Segoe UI/Cascadia installed so the video matches the site.

| Style | Size / leading | Weight | Tracking | Use |
|---|---|---|---|---|
| Display | 128 / 1.08 (`--leading-h1`) | 700 | -0.02em (`--tracking-h1`) | Hook line, brand, CTA |
| Headline | 80 / 1.15 (`--leading-h2`) | 600 | -0.015em (`--tracking-h2`) | Beat statements |
| Caption | 40 / 1.4, max 2 lines, ≤ 42 chars/line | 500 | 0 | Sub-lines under headline |
| Label (mono) | 28 / 1.4 | 500 | 0.04em (`--tracking-xs`) | Branch names, costs, tags |

### Easing and timing (video equivalents of tokens)

The site uses `--ease: ease-in-out` and 150/200 ms durations for UI; the video uses slower, cinematic versions with the same character.

| Name | Curve | Use |
|---|---|---|
| `ease-out-expo` | cubic-bezier(0.16, 1, 0.3, 1) | Entrances, text reveals, card flies (default) |
| `ease-in-out` | cubic-bezier(0.42, 0, 0.58, 1) (= CSS `ease-in-out`, token `--ease`) | Camera moves, crossfades, progress bars |
| `ease-in-quad` | cubic-bezier(0.55, 0.085, 0.68, 0.53) | Exits, glitch-out |
| `snap` | 4-frame linear hard cut | Chaos jitter, stinger hits |

Durations: text line in 12 f (400 ms), text out 8 f (270 ms), stagger between items 4 f (130 ms), camera moves 24-45 f, crossfade between scenes 8 f. Nothing static for more than 1.5 s: always a slow 2% scale drift (ease-in-out) on the active panel.

## 4. Visual assets to reuse

- **Screenshots** (`public/images/screenshots/`): `overview.webp` (hero in Scenes 2, 6), `tasks-board.webp` (Scene 3), `roles.webp` (Scene 4), `agent-chat.webp` (Scene 4), `billing-costs.webp` (Scene 5). Each is shown in a `--surface` window frame with `--radius-lg` (16 px, scale to 24 px at 1080p), `--shadow-mock`. Never upscale beyond 1.0x of native width without noting softness; crop-zoom up to 1.6x only on flat UI areas. Redact anything per `docs/imagery-brief.md` checklist.
- **SVG language** (`public/images/agent-team.svg`, `orchestration-flow.svg`, `features/*.svg`): rounded rects on `--surface`, 1.5-2 px `--border` strokes, small circular agent nodes with coloured rings, connector lines with node dots. Rebuild these as vector layers (import the SVGs directly where possible) so lines can draw on via stroke-dashoffset. `features/task-decomposition.svg`, `branch-per-task.svg`, `approval-gates.svg`, `budget-control.svg` map 1:1 to Scenes 3 and 5.
- **Background:** `--bg` with radial `--glow-accent` (centre, 60% of frame) and the 96 px `--grid-line` grid, slow parallax drift (grid moves 12 px per second).

## 5. Scene-by-scene storyboard

Timecodes are `mm:ss.f` plus frame numbers at 30 fps. Total = **40.0 s**.

| # | Scene | Time | Frames | Dur |
|---|---|---|---|---|
| 1 | Hook: solo prompting chaos | 0:00.0 - 0:05.0 | 0-149 | 5.0 s |
| 2 | Brand reveal | 0:05.0 - 0:09.0 | 150-269 | 4.0 s |
| 3 | PM decomposes the objective | 0:09.0 - 0:15.0 | 270-449 | 6.0 s |
| 4 | Roles work in parallel | 0:15.0 - 0:23.0 | 450-689 | 8.0 s |
| 5 | Branches, approval gates, budget | 0:23.0 - 0:31.0 | 690-929 | 8.0 s |
| 6 | Merged result | 0:31.0 - 0:36.0 | 930-1079 | 5.0 s |
| 7 | CTA end card | 0:36.0 - 0:40.0 | 1080-1199 | 4.0 s |
|   | **Total** | | | **40.0 s** |

### Scene 1: Hook (0:00.0-0:05.0, f0-149)

**Intent:** instantly relatable pain: one person, many AI chats, no control.
**Visual:** Black-to-`--bg` cut-in. 6 chat-window cards (`--surface`, mono text lines, no real content) pop in at random positions/rotations (±6°) every 6 f starting f6, overlapping and piling up. Cursor icon darts between them. Red `--danger` error badges and amber `--warn` "context lost" tags flash on 3 cards. A tab counter in the corner climbs 1 → 14.
**Text (kinetic):**
1. f12-60: "One prompt." (Display, `--text`, ease-out-expo, scale 1.08 → 1.0)
2. f36-84: "Then another." (Headline, `--text-muted`, stacked below, 24 f stagger)
3. f84-128: "Then chaos." ("chaos" in `--danger`, snap-in, 4 px horizontal jitter for 8 f)
Caption line (f90-140): "Solo AI prompting doesn't scale."
**Camera:** Locked, 3% handheld-style jitter via snap keyframes at f84 (impact on "chaos"). Last 10 f: cards whip away with `ease-in-quad` to the left while the frame desaturates to `--bg-deep`.
**Transition out:** Hard cut to black at f149 (1-frame black), builds tension for the reveal.

### Scene 2: Brand reveal (0:05.0-0:09.0, f150-269)

**Intent:** relief; product name lands.
**Visual:** Black. A single `--accent` dot at frame centre (f150) expands into a thin ring, then draws the orchestration-node motif (rounded square + 5 satellite nodes from `agent-team.svg`) with a stroke draw-on (24 f, ease-in-out). The `--glow-accent` radial blooms behind it. Logo/wordmark "Software Factory" resolves in at f180. Behind, `overview.webp` fades up at 25% opacity, blurred 12 px, then sharpens to 100% and slides to the right 30% of frame by f250 as the window frame.
**Text:**
1. f176-230: "Software Factory" (Display, `--text`; per-letter reveal, 2 f stagger, ease-out-expo, rising 24 px)
2. f200-255: "Manage a team of AI agents." (Caption/Headline 56, `--text-muted`, fade+rise)
**Camera:** Push-in from 100% to 108% over the whole scene (ease-in-out).
**Transition out:** Wordmark moves up-left to a 64 px top-left lockup (f245-269, ease-in-out); the lockup persists as a small bug through Scene 6.

### Scene 3: PM decomposes the objective (0:09.0-0:15.0, f270-449)

**Intent:** show planning: one goal becomes tasks.
**Visual:** Left: a prompt-style objective card (`--surface-raised`, mono): `Build a website for my product`. Types out at 1 char/f from f276. At f312 Maya (PM, `--accent` ring avatar) node appears; the card "splits" along `task-decomposition.svg` lines into 5 task cards that fly out on connector paths (stroke draw 20 f, card travel 18 f, 4 f stagger, ease-out-expo): Design, Frontend, DevOps, QA, SEO. Each card has an agent-colour left border and mono ID `TASK-001` … `TASK-005`. Behind (20% opacity, clean): `tasks-board.webp`, which the cards settle into as columns by f430.
**Text:**
1. f282-330: "Give it a goal." (Headline, `--text`)
2. f340-400: "The PM breaks it into tasks." (Headline, "tasks" in `--accent`)
Caption (f390-440): "Plans, assigns, tracks. Automatically."
**Camera:** Slow pan right 120 px (f270-449, ease-in-out); micro push on split moment (f330-354, scale 1.0 → 1.06, ease-out-expo, then settle).
**Transition out:** 8 f crossfade; the task cards remain and shrink into the Scene 4 grid.

### Scene 4: Roles work in parallel (0:15.0-0:23.0, f450-689)

**Intent:** the headline value: a team, working simultaneously.
**Visual:** Five agent panels in a staggered 3+2 grid (each 480x300, `--surface`, agent-colour ring avatar, role label, status chip: designing / coding / building / testing / optimising). Panels light up in sequence at 8 f stagger (f456 onward): Designer (`--violet`), Frontend (`--info`), DevOps (`--warn`), QA (`--accent`), SEO (`--violet`). Each panel runs its own looping micro-animation: mini progress bar fill (ease-in-out, 90 f, different phases), streaming mono lines, QA ticking green checks. Midway (f560) the camera dives into Frontend: `agent-chat.webp` crop slides in as a zoomed window (1.4x) with a streaming message, then pulls back at f620. Roles screen `roles.webp` flashes as a 20 f picture-in-picture at f640 (bottom right, 640 px wide).
**Text:**
1. f462-510: "Designer. Frontend. DevOps. QA. SEO." (Headline; each word pops in on its panel's light-up, in that agent's colour; others `--text`)
2. f540-610: "All at once." (Display, `--text`, centre-lower; ease-out-expo, scale 1.1 → 1.0)
Caption (f620-680): "Each agent owns a role, and works in parallel."
**Camera:** Start wide; dolly-in to Frontend (f560-590, 45 f ease-in-out to 1.4x), hold, pull back (f620-660). Subtle 2% drift otherwise.
**Transition out:** Panels dim to 40% (8 f) as Scene 5 elements slide in over them.

### Scene 5: Branches, approval gates, budget (0:23.0-0:31.0, f690-929)

**Intent:** trust: control without micromanagement. Three sub-beats of ~2.7 s.
**5a Branch per task (f690-769):** Git-graph: `main` line horizontal in `--text-muted`; 5 coloured branches peel off (draw-on 16 f each, 4 f stagger) labelled mono `task/TASK-001`… Text: "A branch for every task." (Headline). Based on `branch-per-task.svg`.
**5b Approval gates (f770-849):** One branch reaches a gate node (shield/lock icon from `approval-gates.svg`); a card "Review requested" appears with `--warn` ring; cursor clicks Approve; ring turns `--accent`, check ripple (12 f). Text: "You approve every merge." (Headline, "approve" in `--accent`).
**5c Budget control (f850-929):** `billing-costs.webp` slides in (cropped to the cost chart, 1.3x). A mono counter `$12.40 / $50.00` counts up (ease-out-expo), meter fills `--accent` → `--warn` at 80% and stops at the cap with a small shake (snap, 6 f). Text: "Your budget. Your cap." (Headline, `--warn` for "cap"). Dollar values are illustrative: `TODO(PO): confirm no pricing/cost claims`.
Caption continuity (bottom-left, mono Label): `branch-per-task · approval-gates · budget-control` — each token highlights `--accent` as its sub-beat plays.
**Camera:** Lateral track right through the three sub-beats (parallax: foreground 1.0x, background 0.5x), ease-in-out, 80 f per hand-off.
**Transition out:** 8 f crossfade; all gate and branch lines converge to a point on the right and flash `--accent` (the merge).

### Scene 6: Merged result (0:31.0-0:36.0, f930-1079)

**Intent:** payoff: finished project.
**Visual:** Branch lines converge into `main` with a flash (4 f white 12% overlay + `--glow-accent` pulse). A "Merged" status chip pops in (`--accent-tint` fill, `--accent` text) with a count: `5 / 5 tasks merged`. `overview.webp` scales up to hero size at centre (1.0x → 1.04x), all columns showing Done. Confetti is NOT used; instead 12 small accent dots ripple outward in a ring (ease-out-expo, 30 f).
**Text:**
1. f944-990: "Merged. Shipped." (Display, `--text`; "Shipped." in `--accent`)
2. f1000-1060: "A whole project, finished by a team." (Caption, `--text-muted`)
**Camera:** Pull back from 1.15x to 1.0x (f930-1000, ease-out-expo), then slow drift.
**Transition out:** Screenshot dims to 15%, grid and glow remain (24 f, ease-in-out).

### Scene 7: CTA end card (0:36.0-0:40.0, f1080-1199)

**Intent:** clear, single call to action; also the poster look.
**Visual:** Centre stack: lockup (wordmark), headline, download line. The download line is plain text, not a button (TASK-030): `--text` label with a 48 px `--accent` Windows icon, no fill, border or pill shape, rising in (ease-out-expo, 16 f). This frame is the poster, and a burned-in button looks clickable but is only pixels; it competed with the real Play control and the page's download CTA. Below it, mono Label: site URL `TODO(PO): final domain`. Soft `--glow-accent` pulse at 1 Hz (opacity 0.6 → 1.0, ease-in-out). All motion stops at f1140; hold final 2 s.
**Text:**
1. f1086-1120: "Your AI team is ready." (Display, `--text`)
2. f1104-1140: "Download for Windows" (plain text, 56 px, weight 600, `--text`; no button styling)
3. f1120-1160: "Windows 10 and 11" (Label, `--text-muted`; `TODO(PO): confirm requirements`, mirrors `download.platformNote` in `src/data/site.ts`)
**Camera:** Locked. Final 20 f: nothing moves (clean last frame).
**End:** Hold to f1199, no fade-out (so the last frame can serve as the poster).

## 6. Complete on-screen copy (every line)

| Scene | Line | Style |
|---|---|---|
| 1 | One prompt. | Display |
| 1 | Then another. | Headline, muted |
| 1 | Then chaos. | Headline, "chaos" danger |
| 1 | Solo AI prompting doesn't scale. | Caption |
| 2 | Software Factory | Display |
| 2 | Manage a team of AI agents. | Headline 56, muted |
| 3 | Build a website for my product (typed objective) | Mono |
| 3 | Give it a goal. | Headline |
| 3 | The PM breaks it into tasks. | Headline |
| 3 | Plans, assigns, tracks. Automatically. | Caption |
| 3 | Design / Frontend / DevOps / QA / SEO; TASK-001 … TASK-005 | Task card labels |
| 4 | Designer. Frontend. DevOps. QA. SEO. | Headline |
| 4 | All at once. | Display |
| 4 | Each agent owns a role, and works in parallel. | Caption |
| 4 | designing, coding, building, testing, optimising | Status chips |
| 5a | A branch for every task. | Headline |
| 5a | task/TASK-001 … task/TASK-005 | Mono labels |
| 5b | Review requested; Approve | Mono / button UI |
| 5b | You approve every merge. | Headline |
| 5c | Your budget. Your cap. | Headline |
| 5c | $12.40 / $50.00 | Mono counter |
| 5 | branch-per-task · approval-gates · budget-control | Mono Label |
| 6 | Merged. Shipped. | Display |
| 6 | 5 / 5 tasks merged | Chip |
| 6 | A whole project, finished by a team. | Caption |
| 7 | Your AI team is ready. | Display |
| 7 | Download for Windows | Plain text, not a button (exact label from `site.download.label`) |
| 7 | Windows 10 and 11 | Label |
| 7 | site URL | Label, TODO(PO) |

All copy: sentence case, no more than 7 words per Display/Headline line, captions ≤ 42 chars per line. The words "Windows" and "Download for Windows" must match the site CTA label exactly.

## 7. Poster frame

- **Source frame:** f1140 (Scene 7 held end card) exported at 1920x1080 as `sizzler-poster.png` and a 1280x720 WebP.
- **Why:** it shows brand, value statement and CTA in one frame, and is legible without motion.
- **Composition:** `--bg` + glow, wordmark lockup top-centre, "Your AI team is ready." Display centre, `overview.webp` ghosted at 18% opacity behind, plain "Download for Windows" line below. No chaos elements and no burned-in buttons: the only clickable controls on the poster are the real HTML ones (Play, native video controls). Regression test: `tests/sizzler-poster.test.mjs`.
- **Alt text for the `<video>` poster / fallback image:** "Software Factory: your AI team is ready. Download for Windows."
- Use as `poster` attribute and as the LCP-safe static image; `preload="none"` until in viewport.

## 8. prefers-reduced-motion fallback

When `(prefers-reduced-motion: reduce)` matches:

1. **Do not autoplay.** Show the poster frame with a visible play button (44x44 px min target, `--tap-target`); video starts only on explicit click, with native controls shown and captions on.
2. **Static storyboard strip alternative** (shown under the poster): the 7 scenes as a static, keyboard-focusable sequence of 7 frames (from frames f100, f240, f420, f600, f800, f1000, f1140), each with its one-line headline as visible text: "Then chaos." / "Software Factory" / "The PM breaks it into tasks." / "All at once." / "You approve every merge." / "Merged. Shipped." / "Your AI team is ready." Use the single-column stack below 1024px and a 2x2-plus grid from 1024px, matching the reduced-motion rule in `docs/design.md` section 12.
3. **Played video in reduced motion:** if the user does press play, use a calmer cut: no camera moves, no jitter, no flashes (Scene 1 jitter and Scene 6 flash removed), crossfades only. Provide this as the same file played at `playbackRate` 1 only if a separate `sizzler-calm.mp4` is not produced; preferred is a calm export (production note).
4. Safety: no flashing above 3 per second anywhere in the standard cut either (only the 4 f flash at f930 and the 6 f shake exist).
5. Provide the transcript (all lines in section 6) in a `<details>` for screen-reader users, and a `.vtt` with the same lines.

## 9. Optional music (separate from the no-audio design)

Video must work muted and defaults to muted/`playsinline`. If music is added: licence-free instrumental, 100-115 BPM, minimal electronic/synth pulse, build at Scene 4, drop at Scene 6, clean tail at Scene 7; sources to evaluate: Pixabay Music, YouTube Audio Library, Free Music Archive (CC0/CC-BY only; record licence and attribution in the vault). Beat markers align at f150 (reveal), f450 (parallel), f930 (merge). Peak −14 LUFS. Music is a separate, removable track and never carries information.

## 10. Production notes and open items

- Build order: vector scenes in a motion tool (After Effects / Remotion-like code render at 30 fps) using the exact hex values above; export loops at constant frame rate.
- Verify every text line stays inside the 96 px safe area and is readable at 640 px wide (mobile): smallest text is the 28 px Label (≈ 9 px at 640 wide, treat as decorative, never essential).
- File size: aim for ≤ 8 MB MP4 and ≤ 5 MB WebM; poster ≤ 150 KB.
- Open items for the owner (`TODO(PO)`): final URL on end card, whether illustrative cost figures may appear, platform requirements line, whether music is wanted.
- Screenshots are 1446-1452 px wide sources; zooms above 1.0x at 1920 px will look soft, so keep zoom crops on large flat UI (headers, charts), and prefer vector recreations of UI chrome for any 1.4x+ shot.
