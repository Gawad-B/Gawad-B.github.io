export interface ProLink { label: string; href: string; kind: 'live' | 'source' | 'download' }
export interface Proof { value: string; label: string }
export interface FeaturedProject {
  id: 'quizzy' | 'dacode' | 'labora' | 'cardioscreen';
  name: string; kind: string; status: string; pitch: string;
  bullets: string[]; tech: string[]; links: ProLink[]; privateRepo: boolean;
}
export interface MoreProject { id: string; name: string; summary: string; tech: string[]; links: ProLink[]; status?: string }
export interface Role { role: string; org: string; location: string; dates: string; note?: string; bullets: string[] }
export interface Education { degree: string; school: string; location: string; dates: string }
export interface Honour { title: string; detail: string }
export interface Certificate { name: string; issuer: string; detail?: string; date: string }
export interface SkillGroup { label: string; items: string[] }
export interface NavLink { label: string; href: `#${string}`; id: string }

export const RESUME_URL = '/Abdelrahman_Gawad_Resume.pdf';
export const UNIVERSE_URL = '/universe/';

export const PRO: {
  nav: { monogram: string; links: NavLink[]; resumeLabel: string };
  hero: { status: string; name: string; giant: string; title: string;
          headline: { before: string; accent: string; after: string };
          sub: string; ctaProjects: string; ctaResume: string; proofs: Proof[];
          talk: string; proofsLabel: string };
  universe: { kicker: string; text: string; cta: string; line: string; switchPro: string; switchUniverse: string;
              tag: string };
  projects: { label: string; heading: [string, string]; intro: string; featured: FeaturedProject[];
              moreHeading: string; more: MoreProject[]; privateLabel: string; githubCta: string };
  experience: { label: string; heading: [string, string]; roles: Role[]; educationHeading: string;
                education: Education; honoursHeading: string; honours: Honour[];
                certificatesHeading: string; certificates: Certificate[] };
  skills: { label: string; heading: [string, string]; note: string; groups: SkillGroup[] };
  about: { label: string; heading: [string, string]; paragraph: string[]; quote: string };
  contact: { label: string; heading: [string, string]; line: string; copy: string; copied: string;
             copyFallback: string; footer: string; location: string;
             cardTitle: string; navHeading: string; elsewhereHeading: string };
} = {
  nav: {
    monogram: 'AG',
    links: [
      { label: 'Projects', href: '#projects', id: 'projects' },
      { label: 'Experience', href: '#experience', id: 'experience' },
      { label: 'Skills', href: '#skills', id: 'skills' },
      { label: 'About', href: '#about', id: 'about' },
    ],
    resumeLabel: 'Résumé',
  },

  hero: {
    status: 'Open to junior software, full-stack and AI/ML roles',
    name: 'Abdelrahman Gawad',
    giant: 'GAWAD',
    title: 'Full-stack & AI/ML engineer',
    headline: {
      before: 'Full-stack and AI/ML engineer building ',
      accent: 'production software',
      after: ' for healthcare and education.',
    },
    sub: 'Computer science student at E-JUST, graduating June 2027. So far: a licensed laboratory information system, a live RAG-powered learning platform, and a clinical risk model that reaches 0.861 ROC AUC.',
    ctaProjects: 'View projects',
    ctaResume: 'Download résumé',
    talk: "Let's talk",
    proofsLabel: 'By the numbers',
    proofs: [
      { value: '3,500+', label: "tests behind Quizzy's CI" },
      { value: '0.861', label: 'ROC AUC, CardioScreen on NHANES' },
      { value: '18×', label: 'faster startup than VS Code, DaCode' },
      { value: '260+', label: 'CI-gated tests in Labora' },
      { value: '76th', label: 'ECPC 2025 ranking' },
      { value: '162', label: 'CS club members I teach Linux to' },
    ],
  },

  universe: {
    kicker: 'Also in 3D',
    text: 'This portfolio is also a star system you can fly through.',
    cta: 'Enter the universe',
    line: 'Prefer the scenic route? This portfolio is also a star system.',
    switchPro: 'Professional',
    switchUniverse: 'Universe',
    tag: '/3D',
  },

  projects: {
    label: 'Projects',
    heading: ['Featured', 'projects'],
    intro: "Each of these is live or in daily use. The numbers come from the repositories' own test suites and benchmarks.",
    privateLabel: 'Private repository',
    githubCta: 'More on GitHub',
    moreHeading: 'More work',
    featured: [
      {
        id: 'quizzy',
        name: 'Quizzy',
        kind: 'Ed-tech platform',
        status: 'In production',
        privateRepo: true,
        pitch: 'A quiz and classroom platform for Egyptian high-school students, with teacher, parent and admin roles.',
        bullets: [
          'Teachers upload course files and a human-in-the-loop RAG pipeline drafts the questions. Nothing reaches a quiz until a person approves it.',
          'Ships as an installable PWA with Android and iOS shells. XP, streaks and achievements are derived from attempt history, so there are no counters to drift.',
          'Rotating refresh tokens for auth, and 3,500+ tests gated by GitHub Actions CI.',
        ],
        tech: ['React', 'TypeScript', 'Express', 'PostgreSQL', 'pgvector', 'Gemini API'],
        links: [{ label: 'Live site', href: 'https://quizzyacademy.com', kind: 'live' }],
      },
      {
        id: 'dacode',
        name: 'DaCode',
        kind: 'Developer tool',
        status: 'Shipping on Linux and Windows',
        privateRepo: false,
        pitch: 'A GPU-rendered code editor written in Rust.',
        bullets: [
          'Owned the architecture and design of an AI-assisted Rust codebase, and shipped it for Linux and Windows.',
          'Benchmarked against VS Code: 18× faster startup, 2.6× faster keystrokes, 13× less memory.',
          'Syntax highlighting through Tree-sitter and language features over LSP.',
        ],
        tech: ['Rust', 'wgpu', 'Tree-sitter', 'LSP'],
        links: [
          { label: 'Live site', href: 'https://da-code-wheat.vercel.app/', kind: 'live' },
          { label: 'Source', href: 'https://github.com/Gawad-B/DaCode', kind: 'source' },
        ],
      },
      {
        id: 'labora',
        name: 'Labora',
        kind: 'Healthcare · LIS',
        status: 'v2.0, licensed',
        privateRepo: true,
        pitch: 'A laboratory information system for a medical lab, from patient registration to the signed PDF report.',
        bullets: [
          'v2.0 covers ordering, results, billing, direct analyzer capture over ASTM, and bilingual Arabic/English PDF reports with full RTL.',
          'Carries what a lab is audited on: RBAC, audit logging, Westgard quality control, delta checks and critical-value callbacks.',
          'HMAC-signed offline licensing, native Windows and Linux installers, and 260+ CI-gated tests.',
        ],
        tech: ['React', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Prisma'],
        links: [{ label: 'Live site', href: 'https://laboralanding.freeddns.org', kind: 'live' }],
      },
      {
        id: 'cardioscreen',
        name: 'CardioScreen',
        kind: 'Clinical ML',
        status: 'Live demo',
        privateRepo: false,
        pitch: 'A cardiovascular risk screening tool built on a calibrated model.',
        bullets: [
          'Trained a calibrated risk model on NHANES data (5,330 adults) that reaches 0.861 ROC AUC on the test set.',
          'Patient data sits behind encrypted identifiers, JWT auth, RBAC and audit logs.',
          '390+ tests.',
        ],
        tech: ['React', 'FastAPI', 'Python', 'scikit-learn'],
        links: [
          { label: 'Live demo', href: 'https://cvd-pi.vercel.app/', kind: 'live' },
          { label: 'Source', href: 'https://github.com/Gawad-B/CVD', kind: 'source' },
        ],
      },
    ],
    more: [
      {
        id: 'enchanted-diary',
        name: 'The Enchanted Diary',
        summary: 'A bilingual 3D diary that answers questions about any uploaded PDF and cites the source page. Hybrid retrieval (pgvector plus lexical, rank fusion) with prompt-injection defences.',
        tech: ['React Three Fiber', 'Fastify', 'Gemini'],
        links: [
          { label: 'Live demo', href: 'https://the-enchanted-diary-w1oh.vercel.app/', kind: 'live' },
          { label: 'Source', href: 'https://github.com/Gawad-B/The-Enchanted-Diary', kind: 'source' },
        ],
      },
      {
        id: 'finance-tracker',
        name: 'Finance Tracker',
        status: 'In daily use',
        summary: 'A household budget PWA with owner and read-only watcher roles, spending limits, and push and Telegram alerts. Bank payments are captured by parsing CIB SMS messages through an iOS Shortcut. 430+ tests.',
        tech: ['Next.js', 'Prisma', 'PostgreSQL', 'Auth.js'],
        links: [],
      },
      {
        id: 'rdmid',
        name: 'Rare-Disease Medical Imaging',
        summary: 'A Flask app serving a latent diffusion model that generates pneumonia and TB chest X-rays, with authenticated batch generation, ZIP export and a Gemini chat assistant.',
        tech: ['Python', 'Flask', 'PyTorch', 'Diffusers'],
        links: [{ label: 'Source', href: 'https://github.com/Gawad-B/latent-diffusion-model', kind: 'source' }],
      },
      {
        id: 'attg',
        name: 'Automatic Timetable Generator',
        summary: 'A CSP solver (forward checking, backtracking) that exports colour-coded Excel timetables.',
        tech: ['Python', 'Flask', 'pandas', 'TypeScript'],
        links: [{ label: 'Source', href: 'https://github.com/Gawad-B/Automatic-Timetable-Generator', kind: 'source' }],
      },
      {
        id: 'gnome-extensions',
        name: 'GNOME Extensions',
        summary: 'Seven macOS-style desktop widgets over D-Bus (UPower, MPRIS, calendars) with 190+ tests, and a prayer-times indicator with offline calculation, adhan playback and GeoClue location.',
        tech: ['TypeScript', 'GJS'],
        links: [
          { label: 'Widgets', href: 'https://github.com/Gawad-B/Gnome-Widgets', kind: 'source' },
          { label: 'Prayer Times', href: 'https://github.com/Gawad-B/Prayer_TImes', kind: 'source' },
        ],
      },
    ],
  },

  experience: {
    label: 'Experience',
    heading: ['Experience', '& education'],
    roles: [
      {
        role: 'Generative AI / LLM Intern',
        org: 'TIPS Hindawi · Edrak for AI',
        location: 'Egypt (remote)',
        dates: 'Aug 2026 – Oct 2026',
        note: '126-hour program',
        bullets: [
          'Built a YouTube summarizer (BART/T5) and an English/Arabic RAG system (FAISS, Flan-T5).',
          'Built an LLM HR-profile parser with LangChain and Pydantic. Capstone: The Enchanted Diary.',
        ],
      },
      {
        role: 'Software Development & HIS Intern',
        org: 'Yakout Lab · Medical Analysis Laboratory',
        location: 'Alexandria, Egypt',
        dates: 'Jul 2026',
        note: 'Summer program',
        bullets: [
          'A three-week, 22-hour-a-week internship in software and healthcare information systems.',
        ],
      },
      {
        role: 'Vice President & Teaching Assistant',
        org: 'E-JUST Computer Science Club',
        location: 'Alexandria, Egypt',
        dates: 'Feb 2026 – Present',
        bullets: [
          'Teach a five-lecture Linux and system administration series to the 162-member CS club.',
        ],
      },
    ],
    educationHeading: 'Education',
    education: {
      degree: 'B.Sc. in Computer Science',
      school: 'Egypt-Japan University of Science and Technology (E-JUST)',
      location: 'Alexandria, Egypt',
      dates: 'Expected June 2027',
    },
    honoursHeading: 'Competitive programming',
    honours: [
      { title: 'ECPC 2025', detail: 'Egyptian Collegiate Programming Contest contestant, ranked 76th.' },
    ],
    certificatesHeading: 'Certificates',
    certificates: [
      { name: 'Large Language Model Internship', issuer: 'Edrak for AI (TIPS Hindawi)', detail: '126 hours', date: 'Oct 2026' },
      { name: 'Internship in Healthcare Information Systems', issuer: 'Yakout Lab', date: 'Jul 2026' },
      { name: '100 Days of Code: The Complete Python Pro Bootcamp', issuer: 'Udemy (Dr. Angela Yu)', detail: '56.5 hours', date: 'Mar 2025' },
    ],
  },

  skills: {
    label: 'Skills',
    heading: ['Technical', 'skills'],
    note: 'What the projects above are built with.',
    groups: [
      { label: 'Languages', items: ['Python', 'TypeScript', 'JavaScript', 'SQL', 'C++', 'Rust', 'Bash'] },
      {
        label: 'Frontend & backend',
        items: ['React', 'Next.js', 'Three.js / React Three Fiber', 'Tailwind CSS', 'Vite', 'Node.js', 'Express', 'Fastify', 'FastAPI', 'Flask', 'REST APIs', 'JWT authentication', 'Prisma'],
      },
      {
        label: 'AI / ML',
        items: ['PyTorch', 'scikit-learn', 'XGBoost', 'LightGBM', 'Hugging Face Transformers & Diffusers', 'LangChain', 'RAG', 'FAISS', 'pgvector', 'Gemini API'],
      },
      {
        label: 'Data, DevOps & testing',
        items: ['PostgreSQL', 'SQLite', 'Neon', 'Docker', 'GitHub Actions', 'Vercel', 'Linux', 'Caddy', 'Git', 'Vitest', 'Playwright', 'pytest', 'node:test'],
      },
    ],
  },

  about: {
    label: 'About',
    heading: ['About', 'me'],
    paragraph: [
      "I'm from Alexandria, and I study computer science at E-JUST.",
      'Most of what I build is for healthcare and education: lab systems, risk models, a quiz platform, software where getting the details right matters to the person on the other side.',
      "I teach Linux to the university's CS club and have riced my own setup more times than I'd admit.",
      'Away from the keyboard I play story-driven games and take notes on how they made me feel.',
    ],
    quote: 'Craft is just care, made visible.',
  },

  contact: {
    label: 'Contact',
    heading: ['Get in', 'touch'],
    line: 'Open to junior software, full-stack and AI/ML roles, internships and freelance projects. Email is the fastest way to reach me.',
    copy: 'Copy email',
    copied: 'Copied',
    copyFallback: 'Press Ctrl+C (⌘C on a Mac) to copy.',
    footer: '© 2026 Abdelrahman Gawad',
    location: 'Alexandria, Egypt',
    cardTitle: 'Reach out to me',
    navHeading: 'Navigation',
    elsewhereHeading: 'Elsewhere',
  },
};
