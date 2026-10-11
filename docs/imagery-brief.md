# Imagery brief: product imagery and screenshot showcase plan

> **PROVISIONAL: no real app screenshots were supplied (/vault/context empty as of 2026-10-11). All items are marked `no screenshot reference`. Revisit when the owner uploads screenshots.**

Design language: `src/styles/tokens.css` (dark surfaces `#080b0f`/`#0b0f14`/`#121820`, border `#2a3441`, accent `#3ddc97`, info `#5cb8ff`, warn `#f5b544`, violet `#a78bfa`). Windows-app framing: the existing Windows-window frame from `AppMock`. No fake "real UI" captures are produced; the SVGs below are stylised illustrations.

## Image inventory

| ID | Image | Alt text | Section | Treatment | Reference |
|----|-------|----------|---------|-----------|-----------|
| IMG-01 | Main app window (project board with agents) | "The Software Factory desktop app showing a task board with AI agents working in parallel." | Hero | Framed screenshot (PLACEHOLDER slot, currently the animated AppMock) | no screenshot reference |
| IMG-02 | Plan review / task decomposition view | "The plan review screen listing the tasks an agent team proposes, ready for approval." | HowItWorks | Framed screenshot (PLACEHOLDER slot, currently the stylised SVG `orchestration-flow.svg`) | no screenshot reference |
| IMG-03 | Orchestration flow graphic | "Four steps: describe the objective, review the plan, agents build on separate branches, then review and ship." | HowItWorks | Stylised SVG illustration: `public/images/orchestration-flow.svg` | no screenshot reference |
| IMG-04 | Agent-team diagram | "A Project Manager agent coordinating Architect, Designer, Frontend, Backend, DevOps, QA and SEO agents." | AgentRoles | Stylised SVG illustration: `public/images/agent-team.svg` | no screenshot reference |
| IMG-05 | Agent roster / activity view | "The agent roster showing each agent's role, current task and status." | AgentRoles | Framed screenshot (PLACEHOLDER slot, currently IMG-04) | no screenshot reference |
| IMG-06 | Feature: agent orchestration | "Central node connected to four agent nodes." | Features | Stylised SVG illustration: `public/images/features/agent-orchestration.svg` | no screenshot reference |
| IMG-07 | Feature: task decomposition | "One large task split into three smaller tasks." | Features | Stylised SVG illustration: `features/task-decomposition.svg` | no screenshot reference |
| IMG-08 | Feature: budget control | "A gauge showing spend against a budget limit." | Features | Stylised SVG illustration: `features/budget-control.svg` | no screenshot reference |
| IMG-09 | Feature: approval gates | "A checkpoint gate with a tick that work must pass." | Features | Stylised SVG illustration: `features/approval-gates.svg` | no screenshot reference |
| IMG-10 | Feature: sandboxed execution | "A dashed boundary containing a terminal prompt." | Features | Stylised SVG illustration: `features/sandboxed-execution.svg` | no screenshot reference |
| IMG-11 | Feature: git branch per task | "A main line with task branches merging back." | Features | Stylised SVG illustration: `features/branch-per-task.svg` | no screenshot reference |
| IMG-12 | Finished project / review-and-merge view | "The review screen showing a completed task with its diff and an approve button." | Proof | Framed screenshot (PLACEHOLDER slot, currently the AppMock) | no screenshot reference |
| IMG-13 | Social card | "Software Factory: run a whole team of AI agents." (og:image:alt) | Meta (all pages) | Stylised SVG rendered to PNG: `public/og.png` (1200x630), source `public/images/og-source.svg` | no screenshot reference |

## Slot table: screenshots vs illustrations

| Becomes a real framed Windows-window screenshot once supplied | Stays an illustration |
|---|---|
| IMG-01 Hero, IMG-02 HowItWorks, IMG-05 AgentRoles, IMG-12 Proof | IMG-03, IMG-04 (diagrams); IMG-06 to IMG-11 (feature icons); IMG-13 (og card) |

Real screenshots go in `public/images/screenshots/` and are shown inside the existing Windows-window frame from `AppMock` (title bar, window controls, `--shadow-mock`). Until then, placeholder slots keep the current SVG or animated AppMock. Swap procedure: drop the PNG in, add `width`/`height`, `loading="lazy"` (not on the Hero), keep the alt text above, and re-check Lighthouse CLS.

## New graphics (created in this task)

All use exact tokens.css hex values, carry `<title>`/`<desc>` plus `role="img"`, and are not wired into pages yet.

- `public/images/features/*.svg`: six 160x120 feature illustrations (IMG-06 to IMG-11), matching `site.features.items[].id`.
- `public/images/agent-team.svg`: 640x360 PM-to-roles diagram (IMG-04). Eight roles in `site.team.roles`; the diagram shows seven plus the PM. Backend is shown, so all roles are covered.
- `public/images/orchestration-flow.svg`: 720x200, four steps matching `howItWorks.steps` (IMG-03). Step copy is TODO(PO) in site.ts; update labels if it changes.
- `public/og.png` regenerated at 1200x630 from `public/images/og-source.svg` (favicon mark, headline, mini team diagram). Re-render with Playwright at a 1200x630 viewport after editing the source.

Note: SVG text uses system fonts (Segoe UI fallback); outline text if exact rendering matters.

## Redaction checklist (for when real screenshots arrive)

- [ ] Windows usernames and user-profile paths (`C:\Users\<name>`), including title bars, file pickers and breadcrumbs
- [ ] Real project and repo names (use fictional ones, e.g. "Acme Storefront")
- [ ] API keys, tokens and secrets in settings or logs (use fictional demo values, or hide the field)
- [ ] Provider account emails and org names
- [ ] Billing and budget figures that are not demo data
- [ ] Windows taskbar and clock
- [ ] Notification toasts and other open windows
- [ ] Crop to the app window only; use fictional demo data throughout; check agent output text for pasted secrets
