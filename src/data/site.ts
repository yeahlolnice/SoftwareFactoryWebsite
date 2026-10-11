// All editable copy lives here. Components format this data but never invent text.
//
// PLACEHOLDERS: values the product owner must supply or confirm before launch.
// Each is also marked TODO(PO) next to its value below.
//   - productName, companyName, tagline, siteUrl: identity and canonical origin (example.com until set)
//   - download.url: real installer URL (currently example.com)
//   - download.version: installer version (currently v0.0.0)
//   - download.platformNote, download.requirements: confirm Windows 10/11 support; add RAM/storage if known
//   - faq.items.platforms, faq.items.code-safe: confirm wording
//   - faq.items.pricing: placeholder answer, no pricing yet
//   - faq.items.support, footer.supportText: no contact details yet
//   - howItWorks.steps (marked TODO(PO)): confirm the four step titles and copy
//   - features.items (marked TODO(PO)): confirm the six feature claims
//   - screenshots: redacted captures live in public/images/screenshots (see docs/imagery-brief.md); all alt text and captions are in `imagery`.
//     The hero overview is Softwarefactory-1.png with project names/path swapped for demo names (disclosed in its caption).
//     The billing capture keeps real spend figures. TODO(PO): confirm they may be public.

export type Img = { src: string; width: number; height: number; alt: string; caption?: string };
export type RoleColor = 'accent' | 'violet' | 'info' | 'warn' | 'danger';
export type IconName =
  | 'users' | 'board' | 'terminal' | 'branch' | 'shield-check' | 'steer'
  | 'plan' | 'palette' | 'code' | 'server' | 'cloud' | 'bug' | 'search'
  | 'windows' | 'download' | 'chevron-down' | 'menu' | 'close' | 'check' | 'arrow-right';

export interface Link { label: string; href: string }
export interface Cta { label: string; href: string; icon?: IconName; external?: boolean }
export interface Step { number: 1 | 2 | 3 | 4; title: string; body: string; icon: IconName }
export interface Feature { id: string; title: string; body: string; icon: IconName }
export interface AgentRole {
  id: string;
  name: string;
  summary: string;
  outputs: string[];
  color: RoleColor;
  icon: IconName;
}
export interface FaqItem { id: string; question: string; answer: string }
export interface MockAgent {
  name: string;
  role: string;
  color: RoleColor;
  status: string;
  statusTone: 'ok' | 'info' | 'warn' | 'idle';
  progress: number;
  progressFrom?: number;
  icon: IconName;
  selected?: boolean;
}
export interface MockCard {
  id: string;
  title: string;
  owner?: string;
  priority?: 'high' | 'med' | 'low';
  color: RoleColor | 'none';
  animates?: boolean;
  active?: boolean;
}
export interface MockColumn {
  id: 'backlog' | 'in-progress' | 'review' | 'done';
  label: string;
  total: number;
  cards: MockCard[];
  tone: 'subtle' | 'info' | 'warn' | 'accent';
}
export interface MockLogLine {
  time: string;
  agent: string;
  color: RoleColor;
  message: string;
  tone?: 'default' | 'danger' | 'success';
}

export interface Site {
  productName: string;
  companyName: string;
  tagline: string;
  siteUrl: string;
  locale: string;
  download: {
    url: string;
    label: string;
    version: string;
    platformNote: string;
    releaseNotesUrl?: string;
    releaseNotesLabel: string;
    requirementsLabel: string;
    requirements: { label: string; value: string }[];
    eyebrow: string;
    heading: string;
    lead: string;
  };
  nav: Link[];
  seo: {
    title: string;
    description: string;
    ogImage: string;
    ogImageAlt: string;
    keywords?: string[];
  };
  hero: {
    eyebrow: string;
    headline: string;
    lead: string;
    primaryCta: Cta;
    secondaryCta: Cta;
    microcopy: string;
  };
  mock: {
    windowTitle: string;
    agents: MockAgent[];
    columns: MockColumn[];
    log: MockLogLine[];
    statusBar: { working: string; progress: string; progressFinal: string; branch: string };
    ui: {
      agentsPanel: string;
      agentsBadge: string;
      addAgent: string;
      boardPanel: string;
      filters: string[];
      logPanel: string;
      logStatus: string;
      agentsOnline: string;
    };
    caption: string;
  };
  proof: { text: string; href?: string }[];
  imagery: {
    windowTitle: string;
    overview: Img;
    agentChat: Img;
    billing: Img;
    tasksBoard: Img;
    roles: Img;
    flow: Img;
    teamDiagram: Img;
  };
  howItWorks: { eyebrow: string; title: string; lead: string; cta: Link; steps: Step[] };
  features: { eyebrow: string; title: string; lead: string; closing: Link; items: Feature[] };
  team: { eyebrow: string; title: string; lead: string; cta: Cta; roles: AgentRole[]; handoff: string[] };
  faq: { eyebrow: string; title: string; items: FaqItem[] };
  layout: {
    skipLinkLabel: string;
    primaryNavLabel: string;
    menuLabel: string;
    downloadNavLabel: string;
    logoLabel: string;
    proofLabel: string;
  };
  footer: {
    columns: { heading: string; links: Link[] }[];
    supportText: string;
    copyright: string;
  };
  notFound: { title: string; heading: string; body: string; homeCta: string };
  social?: Link[];
}

// TODO(PO): dotted paths of every placeholder value below.
export const PLACEHOLDERS = [
  'productName',
  'companyName',
  'tagline',
  'siteUrl',
  'download.url',
  'download.version',
  'download.platformNote',
  'download.requirements',
  'howItWorks.steps',
  'features.items',
  'faq.items.platforms',
  'faq.items.code-safe',
  'faq.items.pricing',
  'faq.items.support',
  'footer.supportText',
] as const;

const productName = 'Software Factory'; // TODO(PO)
const downloadUrl = 'https://example.com/downloads/software-factory-setup.exe'; // TODO(PO)
const version = 'v0.0.0'; // TODO(PO)
const platformNote = 'Windows 10/11, 64-bit'; // TODO(PO): confirm supported Windows versions
const supportText = 'Contact details coming soon.'; // TODO(PO)

export const site: Site = {
  productName,
  companyName: 'Software Factory', // TODO(PO)
  tagline: 'Run a whole team of AI agents.', // TODO(PO)
  siteUrl: 'https://example.com', // TODO(PO)
  locale: 'en',

  download: {
    url: downloadUrl,
    label: 'Download for Windows',
    version,
    platformNote,
    releaseNotesLabel: 'Release notes',
    requirementsLabel: 'System requirements',
    requirements: [
      { label: 'Operating system', value: 'Windows 10 or Windows 11, 64-bit' }, // TODO(PO): add RAM and storage once confirmed
    ],
    eyebrow: 'Download',
    heading: 'Put your AI team to work',
    lead: `Download ${productName} for Windows and run your first project today.`,
  },

  nav: [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Agent team', href: '#team' },
    { label: 'FAQ', href: '#faq' },
  ],

  seo: {
    title: `${productName} — Run a whole team of AI agents`,
    description:
      'A Windows desktop app that manages a team of AI agents with real roles. Hand them a goal and watch them plan, build, test and deliver a whole project.',
    ogImage: '/og.png',
    ogImageAlt: 'Software Factory card: the headline "Run a whole team of AI agents" beside a screenshot of the app\'s Overview screen.',
    keywords: ['AI agents', 'agent orchestration', 'Windows desktop app', 'AI software team'],
  },

  hero: {
    eyebrow: 'Windows desktop app',
    headline: 'Run a whole team of AI agents. Ship a whole project.',
    lead: `${productName} lets you assemble AI agents with real roles — project manager, designer, developers, QA — hand them a goal, and watch them plan, build, test and deliver. You stay in charge of the plan; they do the work.`,
    primaryCta: { label: 'Download for Windows', href: downloadUrl, icon: 'windows', external: true },
    secondaryCta: { label: 'See how it works', href: '#how-it-works' },
    microcopy: `${version} (placeholder) · ${platformNote}`,
  },

  mock: {
    windowTitle: 'acme-storefront',
    agents: [
      { name: 'Maya', role: 'Project Manager', color: 'accent', status: 'planning', statusTone: 'ok', progress: 70, icon: 'plan' },
      { name: 'Theo', role: 'Architect', color: 'violet', status: 'idle', statusTone: 'idle', progress: 100, icon: 'branch' },
      { name: 'Iris', role: 'Frontend Developer', color: 'info', status: 'coding', statusTone: 'info', progress: 90, progressFrom: 20, icon: 'code', selected: true },
      { name: 'Jonas', role: 'DevOps Engineer', color: 'warn', status: 'building', statusTone: 'warn', progress: 40, icon: 'server' },
      { name: 'Quinn', role: 'QA Engineer', color: 'accent', status: 'testing', statusTone: 'ok', progress: 100, progressFrom: 0, icon: 'bug' },
    ],
    columns: [
      {
        id: 'backlog',
        label: 'Backlog',
        total: 3,
        tone: 'subtle',
        cards: [
          { id: 'TASK-016', title: 'Write onboarding copy', color: 'none' },
          { id: 'TASK-017', title: 'Add dark-mode tokens', color: 'none' },
          { id: 'TASK-018', title: 'Set up analytics', color: 'none' },
        ],
      },
      {
        id: 'in-progress',
        label: 'In progress',
        total: 2,
        tone: 'info',
        cards: [
          { id: 'TASK-013', title: 'Checkout page UI', owner: 'Iris', priority: 'high', color: 'info', active: true },
          { id: 'TASK-014', title: 'CI pipeline', owner: 'Jonas', priority: 'med', color: 'warn' },
        ],
      },
      {
        id: 'review',
        label: 'Review',
        total: 1,
        tone: 'warn',
        cards: [
          { id: 'TASK-012', title: 'Cart API tests', owner: 'Quinn', priority: 'high', color: 'accent', animates: true },
        ],
      },
      {
        id: 'done',
        label: 'Done',
        total: 6,
        tone: 'accent',
        cards: [
          { id: 'TASK-001', title: 'Design brief', color: 'violet' },
          { id: 'TASK-002', title: 'Project scaffold', color: 'info' },
          { id: 'TASK-005', title: 'Product API', color: 'info' },
          { id: 'TASK-006', title: 'Auth flow', color: 'info' },
          { id: 'TASK-008', title: 'Cart state', color: 'info' },
        ],
      },
    ],
    log: [
      { time: '12:03:41', agent: 'Maya', color: 'accent', message: 'Reading brief: acme-storefront' },
      { time: '12:03:46', agent: 'Theo', color: 'accent', message: 'Architecture drafted: Astro + Stripe checkout' },
      { time: '12:03:51', agent: 'Theo', color: 'accent', message: 'Decision recorded: static site, hosted checkout' },
      { time: '12:03:58', agent: 'Maya', color: 'accent', message: 'Plan ready for your review' },
      { time: '12:04:02', agent: 'Maya', color: 'accent', message: 'Plan approved. 12 tasks created.' },
      { time: '12:04:05', agent: 'Maya', color: 'accent', message: 'Assigned TASK-013 → Iris, TASK-014 → Jonas' },
      { time: '12:04:09', agent: 'Iris', color: 'info', message: 'Creating src/pages/checkout.astro' },
      { time: '12:04:14', agent: 'Iris', color: 'info', message: 'Committed "Add checkout layout" on task/TASK-013' },
      { time: '12:04:18', agent: 'Jonas', color: 'warn', message: 'Running docker build …' },
      { time: '12:04:23', agent: 'Jonas', color: 'warn', message: 'Build ok in 41s' },
      { time: '12:04:27', agent: 'Quinn', color: 'accent', message: 'Running 24 tests for TASK-012' },
      { time: '12:04:33', agent: 'Quinn', color: 'accent', message: '✕ cart.spec: expected 2 items, got 1', tone: 'danger' },
      { time: '12:04:36', agent: 'Iris', color: 'info', message: 'Fix pushed: cart quantity merge' },
      { time: '12:04:41', agent: 'Quinn', color: 'accent', message: '✓ 24 passed, 0 failed', tone: 'success' },
      { time: '12:04:42', agent: 'Maya', color: 'accent', message: 'TASK-012 → Done. Next: TASK-016' },
      { time: '12:04:44', agent: 'Maya', color: 'accent', message: 'Waiting for your approval on release plan' },
    ],
    statusBar: {
      working: '4 agents working',
      progress: '6 / 12 tasks done',
      progressFinal: '7 / 12 tasks done',
      branch: 'main · 3 branches',
    },
    ui: {
      agentsPanel: 'Agent team',
      agentsBadge: '5 online',
      addAgent: '+ Add agent',
      boardPanel: 'Task board',
      filters: ['All', 'Mine', 'Blocked'],
      logPanel: 'Live log',
      logStatus: 'streaming',
      agentsOnline: '5 agents online',
    },
    caption: `Illustration of the ${productName} app: an agent team panel on the left, a task board in the middle and a live activity log on the right, showing agents handing tasks from planning through to testing.`,
  },

  proof: [],
  imagery: {
    windowTitle: 'AI Software Factory',
    overview: { src: '/images/screenshots/overview.webp', width: 964, height: 350, alt: 'The Software Factory Overview screen: a running project with a review card waiting for approval and task, agent and budget stats.', caption: 'The app: a finished project waiting for your review. Project names and paths are replaced with demo names.' },
    agentChat: { src: '/images/screenshots/agent-chat.webp', width: 628, height: 237, alt: 'A direct message thread with the Project Manager agent, who replies to a specialist agent and keeps the work moving.', caption: 'Chat with any agent directly, and stay in charge of every decision.' },
    billing: { src: '/images/screenshots/billing-costs.webp', width: 1203, height: 780, alt: 'The Billing and Cost Control screen showing spend by project and a usage table of requests, tokens and costs.', caption: 'Spend by project, agent, model or task, with a budget you control.' },
    tasksBoard: { src: '/images/screenshots/tasks-board.webp', width: 1203, height: 700, alt: 'The Tasks board: task cards in the Backlog, Ready and In Progress columns, each assigned to an agent with a per-task budget.', caption: 'A task board your agents work through, one branch per task.' },
    roles: { src: '/images/screenshots/roles.webp', width: 1200, height: 795, alt: 'The Roles screen: a library of built-in agent roles such as Project Manager, Software Architect, Full Stack Developer, QA and SEO, each with a model tier.', caption: '17 built-in roles, plus custom roles you define.' },
    flow: { src: '/images/orchestration-flow.svg', width: 720, height: 200, alt: 'Four steps: describe the objective, review the plan, agents build on separate branches, then review and ship.' },
    teamDiagram: { src: '/images/agent-team.svg', width: 640, height: 360, alt: 'A Project Manager agent coordinating Architect, Designer, Frontend, Backend, DevOps, QA and SEO agents.' },
  },

  howItWorks: {
    eyebrow: 'How it works',
    title: 'From goal to shipped project in four steps',
    lead: 'You set direction. The team handles the handoffs.',
    cta: { label: 'Download and try it', href: '#download' },
    steps: [
      {
        number: 1,
        title: 'Describe your objective', // TODO(PO): confirm
        body: 'Tell your Project Manager agent what you want built, in plain language.', // TODO(PO): confirm
        icon: 'plan',
      },
      {
        number: 2,
        title: 'Review the plan', // TODO(PO): confirm
        body: 'It breaks the goal into scoped, prioritised tasks. Approve or adjust the plan before any work starts.', // TODO(PO): confirm
        icon: 'steer',
      },
      {
        number: 3,
        title: 'Agents build', // TODO(PO): confirm
        body: 'Your team works each task in its own isolated workspace, running tests and handing work to the next role.', // TODO(PO): confirm
        icon: 'users',
      },
      {
        number: 4,
        title: 'Review and ship', // TODO(PO): confirm
        body: 'Check the finished work, approve it, and merge when you are happy.', // TODO(PO): confirm
        icon: 'branch',
      },
    ],
  },

  features: {
    eyebrow: 'Features',
    title: 'Everything you need to run an AI team',
    lead: 'One desktop app. No glue scripts, no tab-juggling between assistants.',
    closing: { label: 'Meet the agent roles', href: '#team' },
    items: [
      {
        id: 'agent-orchestration',
        title: 'Orchestrate a team of AI agents', // TODO(PO): confirm
        body: 'Assign each agent a role, such as PM, designer, developers or QA, and manage the whole team from one desktop app.', // TODO(PO): confirm
        icon: 'users',
      },
      {
        id: 'task-decomposition',
        title: 'Task decomposition', // TODO(PO): confirm
        body: 'The PM agent turns your goal into scoped, prioritised tasks that the team works through.', // TODO(PO): confirm
        icon: 'plan',
      },
      {
        id: 'budget-control',
        title: 'Budget control', // TODO(PO): confirm
        body: 'Set a spend limit for the project and watch the cost as agents work.', // TODO(PO): confirm
        icon: 'shield-check',
      },
      {
        id: 'approval-gates',
        title: 'Human approval gates', // TODO(PO): confirm
        body: 'Approve the plan, answer questions and redirect work at key points, so you stay the product owner.', // TODO(PO): confirm
        icon: 'steer',
      },
      {
        id: 'sandboxed-execution',
        title: 'Sandboxed execution', // TODO(PO): confirm
        body: 'Agents run commands in isolated environments, away from your main setup.', // TODO(PO): confirm
        icon: 'terminal',
      },
      {
        id: 'branch-per-task',
        title: 'Git branch per task', // TODO(PO): confirm
        body: 'Every task gets its own branch, so main stays safe until you merge.', // TODO(PO): confirm
        icon: 'branch',
      },
    ],
  },

  team: {
    eyebrow: 'Agent team',
    title: 'A team with real roles, not one chatbot',
    lead: 'Each agent has a defined responsibility, its own task, and a clear place in the handoff chain.',
    cta: { label: `Meet your team — download ${productName}`, href: downloadUrl, external: true },
    roles: [
      {
        id: 'project-manager',
        name: 'Project Manager',
        summary: 'Turns your goal into a plan and keeps tasks moving.',
        outputs: ['plan', 'tasks'],
        color: 'accent',
        icon: 'plan',
      },
      {
        id: 'architect',
        name: 'Architect',
        summary: 'Chooses the structure and technology the team builds on.',
        outputs: ['design', 'decisions'],
        color: 'violet',
        icon: 'cloud',
      },
      {
        id: 'designer',
        name: 'Designer',
        summary: 'Defines the look, layout and content outline.',
        outputs: ['brief', 'tokens'],
        color: 'violet',
        icon: 'palette',
      },
      {
        id: 'frontend-developer',
        name: 'Frontend Developer',
        summary: 'Builds the interface, client state and accessibility.',
        outputs: ['ui', 'components', 'tests'],
        color: 'info',
        icon: 'code',
      },
      {
        id: 'backend-developer',
        name: 'Backend Developer',
        summary: 'Builds APIs, data models and server logic.',
        outputs: ['api', 'data'],
        color: 'info',
        icon: 'server',
      },
      {
        id: 'devops-engineer',
        name: 'DevOps Engineer',
        summary: 'Sets up builds, containers and delivery pipelines.',
        outputs: ['ci', 'docker'],
        color: 'warn',
        icon: 'cloud',
      },
      {
        id: 'qa-engineer',
        name: 'QA Engineer',
        summary: 'Writes and runs tests, and reports what was verified.',
        outputs: ['tests', 'reports'],
        color: 'accent',
        icon: 'bug',
      },
      {
        id: 'seo-specialist',
        name: 'SEO Specialist',
        summary: 'Makes the finished site easy for search engines to find.',
        outputs: ['meta', 'schema'],
        color: 'warn',
        icon: 'search',
      },
    ],
    handoff: ['Plan', 'Design', 'Build', 'Test', 'Ship'],
  },

  faq: {
    eyebrow: 'FAQ',
    title: 'Questions, answered',
    items: [
      {
        id: 'what-is-it',
        question: `What is ${productName}?`,
        answer:
          'A Windows desktop app for managing a team of AI agents. You give the team a goal and it plans, builds, tests and delivers a project while you supervise.',
      },
      {
        id: 'platforms',
        question: 'Which platforms are supported?', // TODO(PO): confirm
        answer: `Windows desktop. ${platformNote}. Other platforms: not available yet.`,
      },
      {
        id: 'need-code',
        question: 'Do I need to write code to use it?',
        answer:
          'You describe what you want; the agents do the implementation. Reading code and using git helps you review what they produce.',
      },
      {
        id: 'step-in',
        question: 'Can I step in while agents are working?',
        answer:
          'Yes. You can follow the live log, answer questions from the team, redirect work and approve results at any point.',
      },
      {
        id: 'code-safe',
        question: 'Is my code safe?', // TODO(PO): confirm
        answer:
          'Agents work on separate task branches in isolated workspaces, so nothing lands in your main branch until you merge it.',
      },
      {
        id: 'pricing',
        question: 'How much does it cost?', // TODO(PO): placeholder, do not invent pricing
        answer: 'Pricing details will be published here before launch.',
      },
      {
        id: 'support',
        question: 'Where do I get help or report a bug?',
        answer: supportText,
      },
    ],
  },

  layout: {
    skipLinkLabel: 'Skip to main content',
    primaryNavLabel: 'Primary',
    menuLabel: 'Menu',
    downloadNavLabel: 'Download',
    logoLabel: `${productName} home`,
    proofLabel: 'Proof',
  },

  notFound: {
    title: `Page not found — ${productName}`,
    heading: 'Page not found',
    body: 'The page you were looking for does not exist or has moved.',
    homeCta: 'Back to home',
  },

  footer: {
    columns: [
      {
        heading: 'Product',
        links: [
          { label: 'How it works', href: '#how-it-works' },
          { label: 'Features', href: '#features' },
          { label: 'Agent team', href: '#team' },
        ],
      },
      {
        heading: 'Help',
        links: [{ label: 'FAQ', href: '#faq' }],
      },
    ],
    supportText,
    copyright: 'All rights reserved.',
  },

  social: [],
};
