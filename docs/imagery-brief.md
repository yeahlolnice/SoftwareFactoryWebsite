# Imagery brief: product imagery and screenshot showcase plan

> **Screenshots received.** Four real app screenshots were supplied in `/vault/context` (README: "screen grabs from the product"). This brief maps each to a page section. They contain sensitive data and must be cropped/redacted before use (see Redaction). The owner also said the numbers on the billing/cost image may be "fluffed up a little" in a *graphic*; that applies to a redrawn graphic only, not to the raw capture (see IMG-S3).

Design language: `src/styles/tokens.css` (dark surfaces `#080b0f`/`#0b0f14`/`#121820`, border `#2a3441`, accent `#3ddc97`, info `#5cb8ff`, warn `#f5b544`, violet `#a78bfa`). The real app is a dark UI with a navy-black background, a blue/violet gradient for cost bars, a blue primary button, green "RUNNING" status and red notification badges. It sits comfortably next to the site palette; the Windows frame (title bar "AI Software Factory", min/max/close) is already part of each capture.

## The four supplied screenshots

| ID | Source file | What it shows | Alt text | Section | Treatment |
|----|-------------|---------------|----------|---------|-----------|
| IMG-S1 | `Softwarefactory-1.png` | Overview of a running project: status "RUNNING", budget bar, "Waiting for you" project-review card with Accept / Request more work, stat tiles (10/12 tasks complete, 1/9 agents active, spent, blocked), team list and project activity stream | "The Software Factory Overview screen: a running project with a review card waiting for approval, task and budget stats, the agent team and a live activity feed." | Hero (primary) and Proof | Framed screenshot in the AppMock Windows frame. Replaces the animated AppMock in the Hero or sits beside it. |
| IMG-S2 | `Softwarefactory-agent-chat-1.png` | Chat tab: direct messages with the Project Manager and specialist agents, task-tagged replies, escalation to the human | "Direct chat with the Project Manager agent, who escalates a blocked task to the human for a decision." | HowItWorks (the "you stay in charge" / review step) | Framed screenshot. Needs the heaviest redaction (a full Windows profile path is visible). |
| IMG-S3 | `softwarefactory-project-cost-1.png` | Billing & Cost Control: totals, spend-by-project bars, usage detail table (requests, tokens, cache, cost, billed) | "The Billing and Cost Control screen showing spend by project and a usage table of tokens and costs." | Features (budget control) and Proof | Framed screenshot, cropped; also a good source for a redrawn "cost" graphic with demo numbers (see below). |
| IMG-S4 | `softwarefactory-roles-1.png` | Roles library: 17 built-in role cards with tier badges, "Create Custom Role" | "The Roles screen: a library of built-in agent roles such as Project Manager, Architect, Developer, QA and SEO, each with a model tier." | AgentRoles | Framed screenshot. Lowest risk: contains no personal data. |

## Illustrations and graphics (SVG, stay illustrations)

| ID | Image | Alt text | Section | File |
|----|-------|----------|---------|------|
| IMG-03 | Orchestration flow | "Four steps: describe the objective, review the plan, agents build on separate branches, then review and ship." | HowItWorks | `public/images/orchestration-flow.svg` |
| IMG-04 | Agent-team diagram | "A Project Manager agent coordinating Architect, Designer, Frontend, Backend, DevOps, QA and SEO agents." | AgentRoles | `public/images/agent-team.svg` |
| IMG-06 | Feature: agent orchestration | "Central node connected to four agent nodes." | Features | `features/agent-orchestration.svg` |
| IMG-07 | Feature: task decomposition | "One large task split into three smaller tasks." | Features | `features/task-decomposition.svg` |
| IMG-08 | Feature: budget control | "A gauge showing spend against a budget limit." | Features | `features/budget-control.svg` |
| IMG-09 | Feature: approval gates | "A checkpoint gate with a tick that work must pass." | Features | `features/approval-gates.svg` |
| IMG-10 | Feature: sandboxed execution | "A dashed boundary containing a terminal prompt." | Features | `features/sandboxed-execution.svg` |
| IMG-11 | Feature: git branch per task | "A main line with task branches merging back." | Features | `features/branch-per-task.svg` |
| IMG-13 | Social card | "Software Factory: run a whole team of AI agents." | Meta | `public/og.png` (1200x630), source `public/images/og-source.svg` |

## Slot table: framed screenshot vs illustration

| Section | Framed real screenshot (AppMock Windows frame) | Illustration kept |
|---|---|---|
| Hero | IMG-S1 (replaces/complements the animated AppMock) | none |
| Features | IMG-S3 (budget control spotlight) | IMG-06 to IMG-11 icons |
| HowItWorks | IMG-S2 | IMG-03 flow graphic |
| AgentRoles | IMG-S4 | IMG-04 team diagram |
| Proof | IMG-S1 (a cropped second view) or IMG-S3 | none |
| Meta | none | IMG-13 og card |

## Swap procedure

1. Redact and crop each file per the next section; export PNG (or WebP) to `public/images/screenshots/` as `overview.png`, `agent-chat.png`, `billing-costs.png`, `roles.png`.
2. Render inside the existing AppMock Windows-window frame (`--shadow-mock`). The captures already include the app title bar, so show them in the frame without a second fake title bar, or crop the bar and let the frame supply it.
3. Add `width`/`height`, `loading="lazy"` (not for the Hero image), and the alt text above.
4. Re-check Lighthouse CLS and update the Reference notes in this table.

## Redaction (per screenshot)

Global: crop out the desktop edge visible at the window borders (a blue desktop strip shows at the top and sides in S3/S4). No taskbar or clock appears in any capture, and no notification toasts or other windows are visible, so only the crop of the desktop edge is needed there. No API keys, tokens or emails are visible in any of the four.

- **IMG-S1 Overview**
  - A local project path in the review card: redact, or replace with a fictional path such as `D:\Projects\<project>`. Drive letter and folder names reveal the user's layout.
  - Project and repo names: the real client project name, plus "Software Factory Webs…" and "Demo — Task Manager" in the sidebar, and agent names such as "Riley Research (Programs & Redempti…)" and "Sam Research (Cards & Earn)". These look like a real client project; replace with demo names (e.g. "Acme Storefront").
  - Activity stream: the sandbox name and task text mention the real project; edit or crop the stream.
  - Costs are `$0.00`/`$20.00` budget; harmless.
- **IMG-S2 Agent chat**
  - **Must redact**: the message contains an absolute Windows path under `C:/Users/<user>/AppData/...` that exposes a real username (full name), plus a local worktree path on another drive. Replace the text with fictional paths (`C:/Users/<user>/...`), or choose a different conversation.
  - Project and agent names as in S1.
  - The conversation is a blocked-task escalation; check it fits the marketing story before use.
- **IMG-S3 Billing & costs**
  - Real spend figures ($30.97, $11.56, $0.47, $0.40, token counts, `$0.4655`, `$30.9662`) are real usage. The owner allows inflating numbers, but only in a redrawn graphic or edited demo data, and any framed screenshot with edited numbers must not be presented as a genuine capture without the owner agreeing. Recommended: use a redrawn illustration for numbers and keep the screenshot with demo project names.
  - Real client project names and the blank-name row: replace with demo names.
  - Sidebar project list: as S1.
- **IMG-S4 Roles**
  - No personal data. The role names differ slightly from `site.team.roles` ("Software Architect", "UI/UX Designer", "Full Stack Developer" in the app). Page copy should either match the app wording or keep the site wording consistently; this brief recommends keeping `site.team.roles` and letting the screenshot show the app wording.
  - Real sidebar project names: crop the sidebar, or replace with demo names.

## SVG audit against the screenshots

- All nine SVGs now carry `<title>` and `<desc>` and `role="img"` (og-source.svg was missing both and was fixed in this pass).
- `agent-team.svg` roster checked against `site.team.roles` (Project Manager, Architect, Designer, Frontend Developer, Backend Developer, DevOps Engineer, QA Engineer, SEO Specialist): all eight are present (PM plus seven). The earlier note that one role was missing was wrong; no roster change was needed. Labels are shortened (Frontend, Backend, DevOps, QA), consistent with the site and the app.
- Colour check: the SVGs use the tokens.css palette. The real app uses a navy-black background with blue/violet cost bars; the tokens are close enough and no recolouring is needed.
- SVG text uses system fonts (Segoe UI fallback); outline the text if exact rendering matters. Only og-source.svg has been rendered (to `og.png`); the other SVGs are not wired into pages.

## Additional screenshot: Tasks board (`chcklist.png`)

| ID | Source file | What it shows | Alt text | Section | Treatment |
|----|-------------|---------------|----------|---------|-----------|
| IMG-S5 | `chcklist.png` | Tasks tab: kanban board (Backlog / Ready / In Progress / Review) with task cards, priority badges, per-task budget, agent list in the sidebar | "The Tasks board: task cards moving through Backlog, Ready, In Progress and Review, each assigned to an agent with a per-task budget." | Features (task decomposition) or HowItWorks (agents build) | Framed screenshot in the AppMock Windows frame |

Redaction: shows the project names "Software Factory Website" and a real client project in the sidebar (crop or replace), real per-task spend figures and Docker/provider status text in the footer strip (crop). No usernames, paths, keys or emails visible. Crop the desktop strip at the window edge. Planned file: `public/images/screenshots/tasks-board.png`.
