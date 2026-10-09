// All editable copy lives here. Components format this data but never invent text.
// Values marked TODO(PO) must be confirmed by the product owner before launch.

export type RoleColor = 'accent' | 'violet' | 'info' | 'warn' | 'danger';
export type IconName =
  | 'users' | 'board' | 'terminal' | 'branch' | 'shield-check' | 'steer'
  | 'plan' | 'palette' | 'code' | 'server' | 'cloud' | 'bug' | 'search'
  | 'windows' | 'download' | 'chevron-down' | 'menu' | 'close' | 'check' | 'arrow-right';

export interface Link { label: string; href: string }
export interface Cta { label: string; href: string; icon?: IconName; external?: boolean }
export interface Step { number: 1 | 2 | 3; title: string; body: string; icon: IconName }
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
    eyebrow: string;
    heading: string;
    lead: string;
  };
  nav: Link[];
  seo: {
    title: string;
    description: string;
    ogImage: string;
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
  'faq.items.platforms',
  'faq.items.pricing',
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
    ogImage: '/og-image.svg',
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

  howItWorks: {
    eyebrow: 'How it works',
    title: 'From goal to shipped project in three steps',
    lead: 'You set direction. The team handles the handoffs.',
    cta: { label: 'Download and try it', href: '#download' },
    steps: [
      {
        number: 1,
        title: 'Describe the project',
        body: 'Tell your Project Manager agent what you want built. It turns the goal into a plan of scoped, prioritised tasks.',
        icon: 'plan',
      },
      {
        number: 2,
        title: 'Assemble your team',
        body: 'Pick the roles you need — designer, frontend, backend, DevOps, QA. Each agent works its own task in its own isolated workspace.',
        icon: 'users',
      },
      {
        number: 3,
        title: 'Watch it ship',
        body: 'Follow the task board and live log as agents hand work to each other, run tests and report back. Step in, redirect or approve whenever you like.',
        icon: 'board',
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
        id: 'agent-roles',
        title: 'Agent roles',
        body: 'Give every agent a job: PM, architect, designer, developers, QA. Roles keep work focused and handoffs clear.',
        icon: 'users',
      },
      {
        id: 'task-board',
        title: 'Task board',
        body: 'A live board tracks every task from backlog to done, with priorities, owners and status at a glance.',
        icon: 'board',
      },
      {
        id: 'live-log',
        title: 'Live activity log',
        body: 'See what each agent is doing as it happens — commands run, files changed, messages sent.',
        icon: 'terminal',
      },
      {
        id: 'isolated-workspaces',
        title: 'Isolated workspaces', // TODO(PO): confirm
        body: 'Agents work on their own task branches in sandboxed environments, so your main code stays safe until you merge.',
        icon: 'branch',
      },
      {
        id: 'review-testing',
        title: 'Built-in review and testing', // TODO(PO): confirm
        body: 'QA agents write and run tests; completed work is reported with what was verified, not just what was attempted.',
        icon: 'shield-check',
      },
      {
        id: 'you-stay-in-control',
        title: 'You stay in control', // TODO(PO): confirm
        body: 'Approve plans, answer questions from your team and redirect work at any point. The product owner is always you.',
        icon: 'steer',
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
