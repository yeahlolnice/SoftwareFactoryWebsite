# Design Brief — Software Factory Website

Status: v1 (TASK-001) · Owner: Designer · Consumers: Frontend Lead, Frontend Content Dev, SEO Specialist, QA

A single-page, statically generated Astro site that shows off a **Windows desktop app for managing a team of AI agents that completes an entire project together**. There are no real screenshots, so the hero is a CSS/HTML/SVG "app mock" (section 6). All copy lives in `src/data/site.ts` (section 9); components never hard-code text.

**Placeholders the product owner must confirm before launch** (all flagged `TODO(PO)` in `site.ts`): product name, tagline wording, download URL, installer version, Windows version support, any claim marked *(confirm)* below. Copy below describes capabilities that are evident from the product description (Windows desktop app; a team of AI agents with roles; managed through to a finished project; a human stays in charge). Do **not** add pricing, model/vendor names, performance numbers, testimonials or logos until the owner supplies them.

---

## 1. Goals and audience

| | |
|---|---|
| Primary goal | Visitor understands "a team of AI agents, run from my Windows PC, that ships a whole project" in under 10 seconds and clicks **Download for Windows**. |
| Secondary goal | Visitor who isn't ready to download can skim how it works, see the agent roles, and get FAQ answers. |
| Audience | Developers, technical founders, and tinkerers who already use AI coding assistants and want to coordinate several of them. Comfortable with terminals and git; skeptical of hype. |
| Tone | Confident, concrete, engineer-to-engineer. Short sentences. Verbs over adjectives. No "revolutionary", "magic", "supercharge". |
| Conversion event | Click on any element with `data-cta="download"`. Exactly one primary action per viewport. |

## 2. Page structure and copy outline

One page, `src/pages/index.astro`. Sections render in this order, each as `<section id="…" aria-labelledby="…-heading">`. Exactly one `<h1>` (hero); each section has one `<h2>`. Placeholders in `{braces}` come from `site.ts`.

### 2.0 Skip link + Header (`id="top"`)
- Skip link: "Skip to main content" (first focusable element, visible on focus).
- Header (sticky, 64px tall desktop / 56px mobile, `--bg` at 85% opacity + 1px bottom border `--border`; no backdrop-filter dependency):
  - Left: logo mark (SVG gear/conveyor glyph, 28px) + `{productName}` wordmark.
  - Center/right nav (desktop ≥1024): **How it works** `#how-it-works` · **Features** `#features` · **Agent team** `#team` · **FAQ** `#faq`.
  - Right: primary button **Download** → `#download` (the nav button scrolls to the download section; the hero button downloads directly).
  - Mobile (<1024): wordmark + **Download** button + menu button (44×44) toggling a full-width panel with the four links. Menu works with CSS only via `<details>`/`<summary>` or a ≤15-line vanilla script; must close on link click and Esc, and remain usable with JS disabled (links appear inline in the footer anyway).

### 2.1 Hero (`id="hero"`)
- Eyebrow (mono, accent): `Windows desktop app`
- **H1:** "Run a whole team of AI agents. Ship a whole project."
- Supporting copy (lead size, max 60ch): "{productName} lets you assemble AI agents with real roles — project manager, designer, developers, QA — hand them a goal, and watch them plan, build, test and deliver. You stay in charge of the plan; they do the work."
- Primary CTA: **Download for Windows** → `{download.url}` (`data-cta="download"`), with icon (Windows glyph, inline SVG).
- Secondary CTA: **See how it works** → `#how-it-works` (ghost button).
- Micro-copy under CTAs (small, muted): `{download.version} · {download.platformNote}` e.g. "v0.0.0 (placeholder) · Windows 10/11, 64-bit *(confirm)*".
- Visual: the **app mock** (section 6), always full width *below* the copy (the 1040px window needs the full container width at every breakpoint).
- Tagline in `site.ts` (`tagline`) is used for `<meta name="description">` prefix, OG title and the footer; the H1 may differ from it.

### 2.2 Proof strip (`id="proof"`, optional, only if owner provides content)
Hidden by default (`site.proof` empty array → section not rendered). If populated: one line "Built for people who ship" + up to 4 text stats/logos. Keep in the data model so content can be added without a code change.

### 2.3 How it works (`id="how-it-works"`)
- Eyebrow: `How it works`
- **H2:** "From goal to shipped project in three steps"
- Supporting: "You set direction. The team handles the handoffs."
- Three numbered steps (cards, horizontal ≥768, vertical below), each with number, icon, title, 1–2 sentence body:
  1. **Describe the project** — "Tell your Project Manager agent what you want built. It turns the goal into a plan of scoped, prioritised tasks."
  2. **Assemble your team** — "Pick the roles you need — designer, frontend, backend, DevOps, QA. Each agent works its own task in its own isolated workspace."
  3. **Watch it ship** — "Follow the task board and live log as agents hand work to each other, run tests and report back. Step in, redirect or approve whenever you like."
- CTA: text link **Download and try it** → `#download`.

### 2.4 Features (`id="features"`)
- Eyebrow: `Features`
- **H2:** "Everything you need to run an AI team"
- Supporting: "One desktop app. No glue scripts, no tab-juggling between assistants."
- Grid of 6 feature cards (3×2 desktop, 2×3 tablet, 1×6 mobile). Each: 24px icon in a 40px tinted square, title (h3), body ≤ 25 words. Copy (final text lives in `site.features.items`):
  1. **Agent roles** — "Give every agent a job: PM, architect, designer, developers, QA. Roles keep work focused and handoffs clear."
  2. **Task board** — "A live board tracks every task from backlog to done, with priorities, owners and status at a glance."
  3. **Live activity log** — "See what each agent is doing as it happens — commands run, files changed, messages sent."
  4. **Isolated workspaces** — "Agents work on their own task branches in sandboxed environments, so your main code stays safe until you merge."
  5. **Built-in review and testing** — "QA agents write and run tests; completed work is reported with what was verified, not just what was attempted."
  6. **You stay in control** — "Approve plans, answer questions from your team and redirect work at any point. The product owner is always you."
- Features 4–6 reflect behaviour visible in the product's team workflow *(confirm each with owner)*.
- CTA: none inside the grid (avoid competing CTAs); closing line under grid links to `#team`.

### 2.5 Agent team (`id="team"`)
- Eyebrow: `Agent team`
- **H2:** "A team with real roles, not one chatbot"
- Supporting: "Each agent has a defined responsibility, its own task, and a clear place in the handoff chain."
- Layout: role cards (2 cols mobile → 4 cols desktop; 7 roles → last row left-aligned). Each: avatar (SVG circle with initials/glyph in the role's colour, 40px), role name (h3), one-line responsibility, 2–3 "typical output" chips (mono, e.g. `plan`, `tasks`).
- Roles (data in `site.team.roles`): Project Manager, Architect, Designer, Frontend Developer, Backend Developer, DevOps Engineer, QA Engineer. (SEO Specialist is optional: include as an 8th role to make a clean 4×2 grid.)
- Below the grid, a one-line "handoff" diagram (inline SVG): `Plan → Design → Build → Test → Ship`, with the role colours. Decorative, `aria-hidden`, with the sequence repeated as a visually-hidden sentence.
- CTA: **Meet your team — download {productName}** (secondary button) → `{download.url}`.

### 2.6 FAQ (`id="faq"`)
- Eyebrow: `FAQ`
- **H2:** "Questions, answered"
- Supporting: none.
- Accordion using native `<details>/<summary>` (no JS). One column, max 760px, centered. Each item: question (summary, 18px/600, 56px min height), answer (muted text, `max-width: 65ch`). First item open by default? **No** — all closed; keep page short.
- Questions (final answers in `site.faq.items`; answers marked *(confirm)* need owner input — until then they must use the neutral wording shown):
  1. **What is {productName}?** — "A Windows desktop app for managing a team of AI agents. You give the team a goal and it plans, builds, tests and delivers a project while you supervise."
  2. **Which platforms are supported?** — "Windows desktop. {download.platformNote} Other platforms: not available yet." *(confirm)*
  3. **Do I need to write code to use it?** — "You describe what you want; the agents do the implementation. Reading code and using git helps you review what they produce."
  4. **Can I step in while agents are working?** — "Yes. You can follow the live log, answer questions from the team, redirect work and approve results at any point."
  5. **Is my code safe?** — "Agents work on separate task branches in isolated workspaces, so nothing lands in your main branch until you merge it." *(confirm)*
  6. **How much does it cost?** — "Pricing details will be published here before launch." *(placeholder — do not invent)*
  7. **Where do I get help or report a bug?** — "{footer.supportText}" (default: "Contact details coming soon.")
- Emit FAQ as `FAQPage` JSON-LD from the same data (SEO Specialist owns the schema; Designer requires that visible text and JSON-LD match).

### 2.7 Download CTA (`id="download"`)
- A full-width banded panel (`--surface` with an accent radial glow at top, 1px border).
- **H2:** "Put your AI team to work"
- Supporting: "Download {productName} for Windows and run your first project today."
- Primary CTA (large): **Download for Windows** → `{download.url}` (`data-cta="download"`).
- Beneath: `{download.version} · {download.platformNote}` and a small text link "Release notes" → `{download.releaseNotesUrl}` (omitted if empty).
- Hint line (mono, muted): the checksum / "SmartScreen may ask you to confirm" is **not** to be added unless the owner supplies it.

### 2.8 Footer
- Wordmark + `{tagline}` (muted, max 40ch).
- Link columns: **Product** (How it works, Features, Agent team) · **Help** (FAQ, Support/contact `{footer.supportUrl}`) · **Legal** (Privacy, Terms — rendered only if URLs set in `site.legal`).
- Bottom row: `© {year} {companyName}. All rights reserved.` Year computed at build time.
- No newsletter form, no social icons unless `site.social` has entries.

### Section rhythm
Backgrounds alternate to create visible banding: hero `--bg` + grid/glow · how-it-works `--bg` · features `--surface` · team `--bg` · faq `--surface` · download `--bg` with panel · footer `--bg-deep`. Every section has `padding-block: var(--section-pad)` and an `h2` with top eyebrow, 12px gap, then supporting text.

---

## 3. Visual language

**Concept: "software factory" control room.** A dark, precise, industrial-technical UI. Think assembly line + terminal: panels with hairline borders, mono labels, status LEDs, a faint blueprint grid, conveyor-style progress. Calm and dense rather than flashy.

Principles
1. **Dark first, only dark.** One theme (`color-scheme: dark`). No light mode toggle in v1.
2. **Signal green is the only brand accent** (the "running/OK" LED). Other hues are reserved for *meaning*: blue = info/working, amber = in progress/review, red = error, violet = architect/design role colour.
3. **Hairlines over shadows.** Depth comes from 4 surface tones and 1px borders; shadows are used only to lift the hero mock (one large, soft, low-opacity shadow).
4. **Mono for machine things.** Labels, logs, statuses, version strings, eyebrows use the mono stack; prose uses sans.
5. **Motion explains work.** Animation is limited to the hero mock and small hover/focus transitions (≤200ms). Everything respects `prefers-reduced-motion`.
6. **Texture, restrained.** Hero background has a 48px blueprint grid (1px lines at 4% white) masked with a radial fade, plus one soft green glow (`radial-gradient`, ≤12% alpha) behind the mock. Pure CSS; no images.

Iconography: inline SVG, 24×24 viewBox, 1.75px stroke, round caps/joins, `currentColor`. Provide a single `Icon.astro` that selects from an internal path map; no icon font, no external library.

Shape: radius `--radius-sm 6px` (chips, inputs), `--radius-md 10px` (cards, buttons), `--radius-lg 16px` (panels, mock window). Mock window uses 12px to resemble Windows 11.

## 4. Colour palette

Defined as CSS custom properties in `src/styles/tokens.css`. All ratios computed with the WCAG 2.x relative-luminance formula (script run during this task; recompute if a value changes).

### 4.1 Surfaces and borders

| Token | Hex | Use |
|---|---|---|
| `--bg-deep` | `#080B0F` | footer, code/log wells |
| `--bg` | `#0B0F14` | page background |
| `--surface` | `#121820` | alternate sections, cards |
| `--surface-raised` | `#1A222D` | cards on `--surface`, mock panels |
| `--surface-overlay` | `#222C39` | menus, hover state of raised, tooltips |
| `--border` | `#2A3441` | decorative hairlines (not required for comprehension; 1.5:1 on `--bg`, intentionally subtle) |
| `--border-control` | `#66768A` | borders of interactive controls (ghost button, summary focus outline fallback, menu button): ≥3:1 on all four surfaces (4.14 / 3.84 / 3.45 / 3.04) |

### 4.2 Text and accent — contrast of foreground on each background

WCAG AA thresholds: **4.5:1** normal text, **3:1** large text (≥24px, or ≥18.66px bold) and UI components/graphics. ✅ = passes AA for normal text.

| Token | Hex | on `--bg` | on `--surface` | on `--surface-raised` | on `--surface-overlay` | Allowed use |
|---|---|---|---|---|---|---|
| `--text` | `#E6EDF3` | 16.27 ✅ | 15.10 ✅ | 13.56 ✅ | 11.95 ✅ | Headings, body |
| `--text-muted` | `#9AA7B5` | 7.84 ✅ | 7.28 ✅ | 6.54 ✅ | 5.76 ✅ | Supporting copy, captions |
| `--text-subtle` | `#7D8A99` | 5.46 ✅ | 5.07 ✅ | 4.55 ✅ | **4.01 ❌** | Tertiary labels. **Only on `--bg`, `--surface`, `--surface-raised`. Never on `--surface-overlay`; never below 12px.** |
| `--accent` | `#3DDC97` | 10.87 ✅ | 10.09 ✅ | 9.07 ✅ | 7.99 ✅ | Links, eyebrows, focus ring, LEDs |
| `--accent-hover` | `#6AE8B2` | 12.63 ✅ | 11.72 ✅ | 10.53 ✅ | 9.28 ✅ | Link/ghost hover |
| `--info` | `#5CB8FF` | 8.93 ✅ | 8.29 ✅ | 7.44 ✅ | 6.56 ✅ | "working" status, Developer role |
| `--warn` | `#F5B544` | 10.59 ✅ | 9.83 ✅ | 8.83 ✅ | 7.78 ✅ | "in review/in progress" status |
| `--danger` | `#FF6B6B` | 6.93 ✅ | 6.43 ✅ | 5.77 ✅ | 5.09 ✅ | Errors, failed test line in the log |
| `--violet` | `#A78BFA` | 7.06 ✅ | 6.55 ✅ | 5.89 ✅ | 5.19 ✅ | Architect/Designer role colour |

### 4.3 Inverse and component pairs

| Pair | Ratio | Use |
|---|---|---|
| `#06130D` text on `--accent` `#3DDC97` | **10.74** ✅ | Primary button label |
| `#06130D` text on `--accent-hover` `#6AE8B2` | **12.47** ✅ | Primary button hover |
| `--accent` on tint `#0F2A21` (`--accent-tint`) | **8.65** ✅ | Badge/chip with green text |
| `--text-muted` on `--bg-deep` `#080B0F` | 8.05 ✅ | Log well body text |
| `--text` / `--text-subtle` / `--accent` / `--danger` on `--bg-deep` | 16.69 / 5.60 / 11.16 / 7.10 ✅ | Log timestamps, tags, success and failure lines |
| `--border-control` on `--bg` | 4.14 (≥3 ✅) | Ghost button border, menu button border |
| `--accent` focus ring (2px, 2px offset) on every surface | ≥7.99 (≥3 ✅) | `:focus-visible` |

Rules
- White text on `--danger` or on `--warn` fills **fails** (e.g. white on `#FF6B6B` = 2.78). Use danger/warn as **text or icon colour on dark**, or dark text (`#1A0A0A` / `#1F1500`) on a filled chip — never white on them.
- Colour is never the only carrier of meaning: every status has a text label or distinct icon/shape (LED + word).
- Do not place `--text-subtle`, `--border` or any colour at <4.5:1 on top of the hero grid/glow without re-checking; the glow is capped at 12% alpha so backgrounds stay within ±2% luminance of `--bg`.

### 4.4 Role colours (avatars, board card left-borders, log prefixes)

All are existing tokens so ratios above apply (text on dark).

| Role | Colour token |
|---|---|
| Project Manager | `--accent` |
| Architect | `--violet` |
| Designer | `--violet` (outlined glyph vs Architect's filled, so they're distinguishable without colour) |
| Frontend Developer | `--info` |
| Backend Developer | `--info` (different glyph) |
| DevOps Engineer | `--warn` |
| QA Engineer | `--accent-hover` with a check glyph (`--danger` is reserved for failures) |
| SEO Specialist | `--warn` (different glyph) |

## 5. Typography, spacing, layout

### 5.1 Font stacks (no web fonts: zero font requests, zero CLS, Windows-native look)
```
--font-sans: "Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
--font-mono: "Cascadia Mono", "Cascadia Code", "JetBrains Mono", Consolas, "SF Mono", Menlo, monospace;
```
Rationale: target users are on Windows where Segoe UI and Cascadia ship with the OS. Fallbacks cover design review on other machines/CI screenshots.

### 5.2 Type scale (fluid between 360px and 1280px viewport; clamp values computed linearly)

| Token | 360px → 1280px | `font-size` | line-height | weight | tracking | Use |
|---|---|---|---|---|---|---|
| `--text-h1` | 34 → 56px | `clamp(2.125rem, 1.587rem + 2.391vw, 3.5rem)` | 1.08 | 700 | -0.02em | Hero H1 |
| `--text-h2` | 28 → 42px | `clamp(1.75rem, 1.4076rem + 1.522vw, 2.625rem)` | 1.15 | 700 | -0.015em | Section H2 |
| `--text-h3` | 20 → 24px | `clamp(1.25rem, 1.1522rem + 0.435vw, 1.5rem)` | 1.25 | 600 | -0.01em | Card titles |
| `--text-lead` | 17 → 20px | `clamp(1.0625rem, 0.9891rem + 0.326vw, 1.25rem)` | 1.55 | 400 | 0 | Hero/section supporting copy |
| `--text-base` | 16px | `1rem` | 1.6 | 400 | 0 | Body |
| `--text-sm` | 14px | `0.875rem` | 1.5 | 400 | 0 | Card secondary, footer links |
| `--text-xs` | 12px | `0.75rem` | 1.4 | 500 | 0.04em | Eyebrows (uppercase, mono), chips, mock UI. Minimum size on the site. |

Rules: body text ≥16px; prose `max-width: 65ch`; headings `text-wrap: balance`, paragraphs `text-wrap: pretty`; no justified text; no all-caps except mono eyebrows/chips.

### 5.3 Spacing (4px base)
`--space-1 4px · -2 8px · -3 12px · -4 16px · -5 20px · -6 24px · -8 32px · -10 40px · -12 48px · -16 64px · -20 80px · -24 96px`
- `--section-pad`: `clamp(4rem, 2.6304rem + 6.087vw, 7.5rem)` (64 → 120px)
- `--gutter`: `clamp(1.25rem, 0.9565rem + 1.304vw, 2rem)` (20 → 32px)
- Section header → content gap: 40px mobile / 56px desktop. Eyebrow → H2: 12px. H2 → supporting: 16px.
- Card padding: 20px mobile / 28px desktop. Grid gap: 16px mobile / 24px desktop.

### 5.4 Layout
- `--container: 1200px` max, centered, `padding-inline: var(--gutter)`. Hero mock may extend to `1120px`.
- Prose columns: 65ch. FAQ column: 760px.
- Use CSS grid with `repeat(auto-fit, minmax(…))` only where noted; otherwise explicit breakpoint columns (section 8) so QA can assert on them.

## 6. Hero "app mock" specification

Purpose: communicate "agent team + task board + live activity" at a glance without screenshots. Built from semantic-free HTML `<div>`s + inline SVG icons/avatars, styled by `src/styles/mock.css` (or scoped `<style>`), animated with CSS keyframes only. Component: `AppMock.astro`.

**Accessibility:** wrap in `<figure aria-labelledby="mock-caption">`; the mock itself has `aria-hidden="true"` and `role="presentation"`; `<figcaption id="mock-caption" class="sr-only">` reads: "Illustration of the {productName} app: an agent team panel on the left, a task board in the middle and a live activity log on the right, showing agents handing tasks from planning through to testing." Mock text is non-interactive (`pointer-events: none; user-select: none`), and not focusable. All mock text still meets 4.5:1 for design consistency.

### 6.1 Window frame (fixed design size 1040 × 620)
The mock is authored at 1040×620 px and scaled **as a unit** with `transform: scale(var(--mock-scale))` so type stays proportional. Wrapper: `aspect-ratio: 1040 / 620; width: 100%; max-width: 1040px; overflow: hidden`. Inner element: `width: 1040px; height: 620px; transform-origin: top left`. `--mock-scale` is `container-width / 1040`, set by a ≤5-line `ResizeObserver` script on the wrapper (typed-length division via `100cqw / 1040px` is not reliably supported, so don't depend on it). Without JS the wrapper falls back to the **static mobile variant** layout, so there is never a clipped or overflowing desktop window. The scaled desktop mock is used only at **≥1024px** (container ≥ 960px → scale ≥ 0.92, so 11px mock text renders at ≥ 10px). Below 1024px the **mobile variant** (6.6) is used, because scaling to ≤0.68 would make text illegible.

- Window: `--surface` `#121820`, 1px `--border`, radius 12px, shadow `0 40px 80px -20px rgb(0 0 0 / 0.6), 0 0 0 1px rgb(255 255 255 / 0.03)`. Behind it a green glow: `radial-gradient(60% 50% at 50% 0%, rgb(61 220 151 / 0.12), transparent)`.
- **Title bar** (height 36px, `--bg-deep`, bottom border `--border`):
  - Left: 16px logo glyph (accent), title text mono 12px `--text-muted`: `{productName} — acme-storefront` (project name is fictional).
  - Right: three Windows-style caption buttons, each 46×36 px with a 10px line icon: minimise (—), maximise (□), close (×), stroke `--text-muted`; no hover state.
- **Body** below title bar: 1040×584, CSS grid `grid-template-columns: 224px 1fr 300px; ` with 1px `--border` separators; each panel has a 36px header (mono 11px uppercase `--text-subtle` label on `--surface`, bottom border).
- **Status bar** (height 24px inside the 584: i.e. panels are 560px tall): `--bg-deep`, mono 11px `--text-subtle`; left: `● 4 agents working` (LED accent, pulsing); middle: `6 / 12 tasks done`; right: `main · 3 branches`.

### 6.2 Left panel — "Agent team" (224px)
Header label: `AGENT TEAM`, right side badge `5 online` (mono 11px, `--accent` on `--accent-tint`, radius 999px, padding 2px 8px).

Five agent rows, each 64px tall, padding 12px, 1px `--border` bottom, content:
- 32px circular avatar (role colour at 18% alpha fill, 1.5px role-colour ring, 16px role glyph centered).
- Name (13px/600 `--text`) and role (11px `--text-muted`) stacked; right-aligned status pill: LED (8px circle) + word (11px mono).
- Under name/role, a 2px-tall progress track (`--surface-overlay`) with fill in role colour at the progress below (40px offset left to align with text, right padding 12px).

| # | Name | Role | Colour | Status (LED + word) | Progress fill |
|---|---|---|---|---|---|
| 1 | Maya | Project Manager | `--accent` | accent LED, `planning` | 70% |
| 2 | Theo | Architect | `--violet` | grey LED (`--text-subtle`), `idle` | 100% |
| 3 | Iris | Frontend Developer | `--info` | info LED pulsing, `coding` | 55% (animates 20→90%) |
| 4 | Jonas | DevOps Engineer | `--warn` | warn LED pulsing, `building` | 40% |
| 5 | Quinn | QA Engineer | `--accent-hover` | accent-hover LED, `testing` | 25% (animates 0→100%) |

Row 3 (Iris) has a `--surface-raised` background and a 2px left inner accent bar (role colour) to show it's the "selected" agent. A footer inside the panel: dashed-border 40px "+ Add agent" ghost row (`--text-subtle`, 12px).

### 6.3 Centre panel — "Task board"
Header: `TASK BOARD` left; right: three small mono chips `All`, `Mine`, `Blocked` (`All` selected: `--surface-overlay` bg, `--text`). Decorative only.

Four columns separated by 12px gaps, padding 12px: **Backlog (3)** · **In progress (2)** · **Review (1)** · **Done (6)**. Column header: label (mono 11px uppercase `--text-muted`) + count; 2px top rule in column colour (Backlog `--text-subtle`, In progress `--info`, Review `--warn`, Done `--accent`). Columns are ≈ 120px wide (centre panel = 1040−224−300−2 = 514px → (514−24 padding−36 gaps)/4 ≈ 113px) — so cards are compact: 113px wide, 64–84px tall, 8px padding, `--surface-raised`, 1px `--border`, radius 8px, 3px left border in the owner role's colour.

Card content: task ID (mono 10px `--text-subtle`, e.g. `TASK-014`), title (12px/500 `--text`, 2 lines max, ellipsis), footer row: 14px owner avatar dot + priority tag (mono 10px; `high` amber text, `med` muted text; text not colour only).

Card inventory (11 shown: 3 + 2 + 1 + 5 visible Done cards; header counts above are totals, extras are implied):
- Backlog: `TASK-016 Write onboarding copy`, `TASK-017 Add dark-mode tokens`, `TASK-018 Set up analytics`.
- In progress: `TASK-013 Checkout page UI` (Iris, high), `TASK-014 CI pipeline` (Jonas, med).
- Review: `TASK-012 Cart API tests` (Quinn, high) — this is the card that animates.
- Done (5 visible): `TASK-001 Design brief`, `TASK-002 Project scaffold`, `TASK-005 Product API`, `TASK-006 Auth flow`, `TASK-008 Cart state`.

### 6.4 Right panel — "Live log" (300px)
Header: `LIVE LOG` left; right: LED + `streaming` (accent, mono 11px).

Body: `--bg-deep`, padding 12px, mono 11.5px/1.55, lines up to 3 lines wrapping at 276px. Each line: time `12:04:11` (`--text-subtle`), role-coloured agent tag `[Iris]`, message `--text-muted` (key nouns in `--text`). Visible window shows ≈ 18 lines; new lines push the stack upward (container `overflow: hidden; display:flex; flex-direction:column; justify-content:flex-end`). Final line has a blinking 7×13px accent caret.

Script (the 12 lines that cycle; times increment by 2–5 s):
```
12:04:02 [Maya]  Plan approved. 12 tasks created.
12:04:05 [Maya]  Assigned TASK-013 → Iris, TASK-014 → Jonas
12:04:09 [Iris]  Creating src/pages/checkout.astro
12:04:14 [Iris]  Committed "Add checkout layout" on task/TASK-013
12:04:18 [Jonas] Running docker build …
12:04:23 [Jonas] Build ok in 41s
12:04:27 [Quinn] Running 24 tests for TASK-012
12:04:33 [Quinn] ✕ cart.spec: expected 2 items, got 1     ← --danger
12:04:36 [Iris]  Fix pushed: cart quantity merge
12:04:41 [Quinn] ✓ 24 passed, 0 failed                     ← --accent
12:04:42 [Maya]  TASK-012 → Done. Next: TASK-016
12:04:44 [Maya]  Waiting for your approval on release plan ▌
```
The failed-then-fixed beat is intentional: it shows the team testing and self-correcting. `✕`/`✓` glyphs accompany the colour.

### 6.5 Animation (CSS only, 14s infinite loop, `animation-timing-function: steps()` for log, `ease-in-out` for movement)
Single master loop of **14s**; all child animations share `animation-duration: 14s; animation-iteration-count: infinite` with keyframe percentages so they stay in sync (no JS).

| Time | Event |
|---|---|
| 0–1s | Window fades/rises in once on load (`opacity 0→1; translateY(16px→0)`, 600ms; only once, not part of the loop) |
| continuous | Activity log streams independently of the 14s board loop (tiny inline script in AppMock.astro): every 1.5s the oldest line is recycled to the bottom with a continuing timestamp, the stack slides up 380ms and the new line fades in. Older lines are pushed out at the top (fade mask); the log never clears. Not started under reduced motion. |
| 3–5s | Iris's progress bar 20%→90%; TASK-013 shimmer border (accent at 40% alpha sweeping, 1.6s) |
| 6–8s | Quinn's progress bar 0%→100%; status word cross-fades `testing`; |
| 8–9s | TASK-012 card flashes `--danger` left border for 400ms then returns to its owner colour, matching line 8 |
| 10–11s | TASK-012 card slides from Review to Done (translate to Done column top, 600ms ease-in-out); counts update by cross-fading numbers (`Review (1)`→`(0)`, `Done (6)`→`(7)`); status bar `6 / 12 tasks done` fades to `7 / 12` |
| 13–14s | Everything holds, then the board loop restarts from state 0 (the log keeps streaming) |

Continuous ambient: LEDs on active agents pulse (`opacity 1↔0.45`, 1.6s, `ease-in-out`, infinite); caret blinks (`steps(2)`, 1s).

**Implementation constraints:** animate only `transform` and `opacity` (plus progress `transform: scaleX()` rather than `width`) to avoid layout; `will-change` only on the moving card. Pause with `animation-play-state: paused` when the mock is off-screen via an `IntersectionObserver` (≤10 lines of JS, optional enhancement — the mock must work without it). No layout shift: mock reserves its aspect-ratio box before styles/JS load.

**`prefers-reduced-motion: reduce`:** disable all keyframes and render the **final-state frame** (all log lines visible, TASK-012 in Done, progress bars at their final values, LEDs static, no caret blink, no entry animation). Also provide this static frame as the no-JS/no-CSS-animation default state, so the animation is progressive enhancement over a complete static frame.

### 6.6 Compact variant (<1024px: mobile and tablet) — same data, simplified layout
Because the scaled desktop window would be illegible below 1024px, render a purpose-built compact window (full container width, `max-width: 560px`, centred; same title bar without caption buttons: only logo + title):
1. **Agent strip**: horizontally arranged 5 avatars (40px, overlap −8px) with status LED dots + text `5 agents online` (mono 12px).
2. **Mini board**: three equal columns **In progress · Review · Done** (each a header with count chip and, below it, a slot). Only the animating card (`TASK-012 Cart API tests`) is drawn: it sits in Review and slides into Done as in 6.5; other cards omitted. At 360px columns are ≈ 100px wide, so the card shows ID and a 2-line title at 12px. (Height ≈ 120px.)
3. **Live log**: the last 6 lines of the script (lines 7–12), mono 12px, wrapping allowed; same animation subset (lines appear, card moves, LED pulse).
Total height ≈ 380px. At tablet widths the same compact window is shown at its 560px max width (centred) with 16px type in the log and 48px avatars; it is not scaled.

## 7. Component inventory

Every component is an Astro component in `src/components/` unless noted. "Data" = props/fields from `site.ts`.

| Component | Purpose | Variants / states | Data |
|---|---|---|---|
| `Layout.astro` | `<html>` shell, `<head>` (title, meta, OG, canonical, JSON-LD slot), skip link, `<slot/>` | — | `site.productName`, `tagline`, `seo` |
| `Header.astro` | Sticky nav + mobile menu | default, scrolled (border opacity ↑), menu open | `site.nav` |
| `Button.astro` | All buttons/links-as-buttons | `primary` (accent fill, `#06130D` text), `secondary` (surface-raised fill, `--text`), `ghost` (transparent, `--border-control` border, hover `--accent-hover` text); sizes `md` 44px (min-h), `lg` 56px; states: default/hover/active (translateY 1px)/focus-visible (2px accent ring, 2px offset)/disabled (`aria-disabled`, 50% opacity but still ≥3:1)/loading (not needed) | label, href, icon, `data-cta` |
| `Icon.astro` | Inline SVG icon set | 24px / 16px; `aria-hidden` unless `label` passed | `name` |
| `Eyebrow.astro` | Mono uppercase section label | accent colour | text |
| `SectionHeader.astro` | Eyebrow + H2 + supporting copy | left (default), center | `eyebrow`, `title`, `lead` |
| `Hero.astro` | H1, lead, CTAs, microcopy, mock | — | `site.hero` |
| `AppMock.astro` | The animated mock (section 6) | `desktop`, `mobile`, `static` (reduced motion) | `site.mock` (agents, cards, log) |
| `Steps.astro` / `StepCard` | How-it-works steps | numbered 1–3 | `site.howItWorks.steps` |
| `FeatureCard.astro` | Icon + title + body | default, hover (border → `--border-control`, `translateY(-2px)`) | `site.features.items[]` |
| `RoleCard.astro` | Avatar, role, responsibility, outputs chips | by role colour | `site.team.roles[]` |
| `HandoffDiagram.astro` | Plan→Ship SVG chain | static | `site.team.handoff[]` |
| `Chip.astro` | Mono tag | neutral, accent, role-coloured | text |
| `FaqList.astro` / `FaqItem` | `<details>` accordion | closed, open (chevron rotates 180°, 150ms), focus-visible, hover | `site.faq.items[]` |
| `DownloadPanel.astro` | Final CTA band | — | `site.download` |
| `Footer.astro` | Links, copyright | — | `site.footer`, `site.legal` |
| `StatusLed.astro` | 8px status dot (+ visible/hidden label) | `ok`, `info`, `warn`, `danger`, `idle`; pulsing optional | status |
| `Logo.astro` | SVG glyph + wordmark | with/without wordmark | `productName` |

Interaction details
- **Focus:** 2px `--accent` outline, 2px offset, on every interactive element (`:focus-visible`); never `outline: none` without replacement. Skip link visible on focus.
- **Hit targets:** ≥44×44px on touch (buttons, menu toggle, `<summary>`, nav links in the mobile panel).
- **Links in prose:** `--accent`, underline (`text-underline-offset: 3px`); hover `--accent-hover`.
- **Smooth scroll:** `scroll-behavior: smooth` only inside `@media (prefers-reduced-motion: no-preference)`; anchor targets use `scroll-margin-top: 80px` to clear the sticky header.
- **Hover is never required** to reveal information.
- **Download behaviour:** primary buttons are plain `<a href download>` links with `rel="noopener"`; no JS. If `downloadUrl` is the placeholder, the build should still render a working link (`#download`), and QA treats a placeholder host (`example.com`) as a known TODO, not a bug.

## 8. Responsive behaviour

Mobile-first CSS; breakpoints (min-width): **sm 640px · md 768px · lg 1024px · xl 1280px**. Design checkpoints: **360px (mobile)**, **768px (tablet)**, **1280px (desktop)**. Also verify 320px (no horizontal scroll) and 1920px (content stays ≤1200px, centred). No horizontal scrolling at any width ≥320px.

### 8.1 Matrix

| Element | Mobile 360px (<640) | Tablet 768px (640–1023) | Desktop 1280px+ (≥1024) |
|---|---|---|---|
| Container padding | 20px | 24px | 32px |
| Header | Logo + Download button + menu toggle (56px tall) | Same as mobile but menu panel is 2-col grid | Logo + inline nav + Download button (64px) |
| Hero layout | Single column, left-aligned: eyebrow, H1 (34px), lead (17px), CTAs **stacked full-width** (primary then ghost), microcopy, then compact mock | Single column centred, copy max 720px, CTAs inline side-by-side, compact mock below | Copy centered max 800px at top, CTAs inline, then scaled 1040px mock below with overlap of glow; (no side-by-side split — the wide mock needs the full width) |
| Hero H1 | 34px / 1.08 | ≈ 40–45px (fluid) | 56px (max) |
| App mock | Compact variant (6.6), full width | Compact variant (6.6), 560px max, centred | Scaled desktop mock (6.1): scale ≥0.92 at 1024px, 1.0 at ≥1072px container |
| How it works | Steps stacked, number left of text | 3 columns | 3 columns with connector line between number badges |
| Features grid | 1 column | 2 columns | 3 columns |
| Agent team grid | 2 columns, compact (avatar above text; outputs chips hidden) | 3 columns | 4 columns (4×2 with 8 roles) |
| Handoff diagram | Vertical list (5 items, down-arrows) | Horizontal, wraps to 2 rows if needed | Horizontal single row |
| FAQ | Full width, summary 56px min | Centered 680px | Centered 760px |
| Download panel | Padding 32px 20px; CTA full width | Padding 48px; CTA auto width centered | Padding 72px; CTA large (56px high) centered |
| Footer | Stacked columns (1), wordmark first | 2 columns | 4 columns (brand + 3 link groups) |
| Section padding | 64px | ≈ 80–92px | 120px |

### 8.2 Rules
- **Typography** is fluid via the clamps in 5.2; do not add breakpoint overrides for font sizes.
- Buttons: full-width (`width:100%`) below 480px when stacked; otherwise `inline-flex` with `min-width: 200px` for primary.
- Images/SVG: set explicit `width`/`height` or `aspect-ratio` to prevent layout shift (CLS < 0.05 target).
- Do not hide primary content on mobile. The only content hidden on mobile are decorative: role "typical output" chips, the board columns in the mock, hero grid texture detail.
- Hover-only effects (card lift) gated by `@media (hover: hover)`.
- The sticky header must not cover anchor targets (see `scroll-margin-top`).
- Mobile menu: opens below header, full-width, `--surface` background, 1px top border, links 56px tall; body scroll not locked (keeps it JS-free).

## 9. Content data model — `src/data/site.ts`

Single exported, typed, `as const`-friendly object. All visible copy, URLs and structured data come from here; components may format but not invent text. Types are exported so tests can import them.

```ts
export type RoleColor = 'accent' | 'violet' | 'info' | 'warn' | 'danger';
export type IconName =
  | 'users' | 'board' | 'terminal' | 'branch' | 'shield-check' | 'steer'
  | 'plan' | 'palette' | 'code' | 'server' | 'cloud' | 'bug' | 'search'
  | 'windows' | 'download' | 'chevron-down' | 'menu' | 'close' | 'check' | 'arrow-right';

export interface Link { label: string; href: string }          // href: '#id' | absolute https URL
export interface Cta  { label: string; href: string; icon?: IconName; external?: boolean }

export interface Site {
  /** Identity */
  productName: string;          // PLACEHOLDER 'Software Factory'  — TODO(PO)
  companyName: string;          // PLACEHOLDER, used in © line — TODO(PO)
  tagline: string;              // 'Run a whole team of AI agents.' (≤ 70 chars) — TODO(PO)
  siteUrl: string;              // canonical origin, PLACEHOLDER 'https://example.com'
  locale: string;               // 'en'

  /** Download */
  download: {
    url: string;                // PLACEHOLDER 'https://example.com/downloads/software-factory-setup.exe' — TODO(PO)
    label: string;              // 'Download for Windows'
    version: string;            // PLACEHOLDER 'v0.0.0'
    platformNote: string;       // 'Windows 10/11, 64-bit' — confirm
    releaseNotesUrl?: string;   // optional; omit link if undefined
    heading: string;            // 'Put your AI team to work'
    lead: string;               // supporting copy for download section
  };

  /** Navigation (header + footer "Product" column) */
  nav: Link[];                  // 4 anchors: how-it-works, features, team, faq

  /** SEO — consumed by Layout.astro and SEO Specialist */
  seo: {
    title: string;              // ≤ 60 chars
    description: string;        // 120–160 chars
    ogImage: string;            // path in /public (placeholder SVG/PNG allowed)
    keywords?: string[];
  };

  /** Hero */
  hero: {
    eyebrow: string;            // 'Windows desktop app'
    headline: string;           // H1
    lead: string;
    primaryCta: Cta;            // → download.url
    secondaryCta: Cta;          // → '#how-it-works'
    microcopy: string;          // may use download.version/platformNote; built in code or pre-composed here
  };

  /** Mock content (section 6) — everything the AppMock renders */
  mock: {
    windowTitle: string;        // 'acme-storefront'
    agents: MockAgent[];        // 5
    columns: MockColumn[];      // 4 (Backlog, In progress, Review, Done)
    log: MockLogLine[];         // 12
    statusBar: { working: string; progress: string; branch: string };
    caption: string;            // sr-only figcaption text
  };

  /** Optional proof strip; empty array = section not rendered */
  proof: { text: string; href?: string }[];

  /** How it works */
  howItWorks: { eyebrow: string; title: string; lead: string; cta: Link; steps: Step[] };  // 3 steps

  /** Features */
  features: { eyebrow: string; title: string; lead: string; items: Feature[] };            // 6 items

  /** Agent team */
  team: { eyebrow: string; title: string; lead: string; cta: Cta; roles: AgentRole[]; handoff: string[] };

  /** FAQ */
  faq: { eyebrow: string; title: string; items: FaqItem[] };                                // 7 items

  /** Footer */
  footer: {
    columns: { heading: string; links: Link[] }[];         // Product, Help, Legal(optional)
    supportText: string;                                    // default 'Contact details coming soon.'
    supportUrl?: string;
  };
  legal?: { privacyUrl?: string; termsUrl?: string };
  social?: Link[];              // empty/undefined → no icons rendered
}

export interface Step     { number: 1 | 2 | 3; title: string; body: string; icon: IconName }
export interface Feature  { id: string; title: string; body: string; icon: IconName }       // body ≤ 25 words
export interface AgentRole {
  id: string;                   // kebab-case, unique: 'project-manager'
  name: string;                 // 'Project Manager'
  summary: string;              // one line, ≤ 14 words
  outputs: string[];            // 2–3 mono chips: ['plan', 'tasks']
  color: RoleColor;             // per 4.4
  icon: IconName;
}
export interface FaqItem  { id: string; question: string; answer: string }                  // answer plain text; no HTML (also feeds FAQPage JSON-LD)

export interface MockAgent { name: string; role: string; color: RoleColor; status: string; statusTone: 'ok' | 'info' | 'warn' | 'idle'; progress: number /* 0–100 final value */; selected?: boolean }
export interface MockCard  { id: string; title: string; owner?: string /* MockAgent.name */; priority?: 'high' | 'med' | 'low'; color: RoleColor | 'none'; animates?: boolean }
export interface MockColumn{ id: 'backlog' | 'in-progress' | 'review' | 'done'; label: string; total: number; cards: MockCard[]; tone: 'subtle' | 'info' | 'warn' | 'accent' }
export interface MockLogLine{ time: string; agent: string; color: RoleColor; message: string; tone?: 'default' | 'danger' | 'success' }
```

Constraints (QA can assert against these):
- `features.items.length === 6`, `team.roles.length` ∈ {7, 8}, `faq.items.length >= 5`, `howItWorks.steps.length === 3`, `mock.agents.length === 5`, `mock.log.length === 12`, `mock.columns.length === 4`.
- All `href`s are `#`-anchors that exist as section ids, or absolute `https://` URLs.
- `id`s unique within their arrays.
- No field contains HTML; components escape text. Line-breaks aren't used.
- Placeholder markers: any value that the owner must supply carries a `// TODO(PO)` comment in `site.ts`, and a single exported `PLACEHOLDERS` array lists their dotted paths (`['productName', 'download.url', …]`) so QA/DevOps can fail a release build while any remain.

## 10. Accessibility and quality bar

- Target **WCAG 2.2 AA**; axe-core with zero serious/critical violations at 360 and 1280px.
- Landmarks: `<header>`, `<nav aria-label="Primary">`, `<main id="main">`, `<footer>`. Sections labelled by their H2.
- Heading order strictly h1 → h2 → h3, no skipped levels.
- Language `<html lang="en">`; page `<title>` and one meta description from `seo`.
- All icons `aria-hidden` unless solely conveying meaning (none are).
- Reduced motion fully honoured (6.5); no auto-playing content longer than 5s that cannot be paused other than the decorative, `aria-hidden` mock, which is also paused when off-screen and static for reduced-motion users. (WCAG 2.2.2 — this mock is decorative and non-essential; the pause-on-offscreen behaviour is the mitigation. If QA wants a user control, add a "Pause animation" ghost button under the mock.)
- Minimum text 12px (mock/eyebrows/chips only); body ≥16px.
- Performance budget: total transferred HTML+CSS+JS ≤ 60 KB gzip (excluding favicon/OG image); JS ≤ 3 KB (menu, mock scale, IntersectionObserver); no web fonts; no third-party scripts; LCP element is the H1 text.

## 11. Handoff notes

- **Frontend Lead:** `tokens.css` from sections 4–5 (exact hex and clamp values), `Layout`, `Header`, `Button`, `Icon`, `AppMock` (build static frame first, then keyframes), responsive matrix 8.1.
- **Frontend Content Dev:** author `site.ts` per section 9 using the copy in section 2 verbatim; mark placeholders; implement section components.
- **SEO Specialist:** `seo`, FAQ JSON-LD (`FAQPage`), `SoftwareApplication` JSON-LD (`operatingSystem: Windows`, `applicationCategory: DeveloperApplication`, offers omitted until pricing exists), sitemap/robots, OG image placeholder. Visible copy and structured data must match.
- **QA:** assertions listed under 9 constraints; axe at 360/1280; no horizontal overflow at 320/360/768/1280/1920; reduced-motion renders static final frame; keyboard path: skip link → nav → CTA → FAQ summaries all reachable with visible focus.
- **Open questions for the Project Manager / product owner:** final product name and tagline; real download URL and version; Windows version support; confirmation of features 4–6 and FAQ answers marked *(confirm)*; pricing/support/legal links; whether to commission real screenshots to replace the mock later (the `AppMock` is isolated so it can be swapped for an `<img>` without touching other sections).
