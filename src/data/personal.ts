/**
 * Identity. Source of truth: src/components/{Hero,About,Contact}.tsx @ b35eae0.
 * Copy is preserved in meaning. Nothing here is invented.
 */

export const PERSONAL = {
  name: 'Abdelrahman Gawad',
  roles: [
    'Healthcare AI Engineer',
    'Full-Stack Developer',
    'Linux Enthusiast',
    'Competitive Programmer',
  ],
  location: 'Alexandria, Egypt',
  institution: 'Egypt-Japan University of Science and Technology',
  institutionShort: 'CS @ E-JUST',
  focus: 'Healthcare AI · Bioinformatics',

  /** One line, for the hero overlay. */
  intro:
    'I build machine learning that tries to buy people more time, and interfaces worth looking at while it works.',

  /** The About dossier, verbatim from About.tsx. */
  bio: [
    "I'm Abdelrahman — from Alexandria, the city where the Mediterranean does most of my thinking for me. I study CS at Egypt-Japan University, deep in AI and bioinformatics.",
    'By day I train ensemble models to predict cardiovascular disease before it happens — the kind of ML that might actually buy someone more time. By night I rice my Linux setup for the hundredth time, because the terminal should be beautiful too.',
    "When I'm not shipping React apps or tuning XGBoost, I'm probably lost in a story-driven game, taking notes on how it made me feel — then trying to smuggle that feeling into everything I build.",
  ],

  quote: 'Craft is just care, made visible.',

  /** Open-for-work line, verbatim from Contact.tsx. */
  availability:
    'Open for work and fun alike — internships, freelance projects, collaborations, or just talking healthcare AI, Linux, and good games.',

  contact: {
    email: 'abdelrahman.gawad.28@gmail.com',
    phone: '+201027321793',
    phoneDisplay: '+20 102 732 1793',
    github: 'https://github.com/Gawad-B',
    githubHandle: 'Gawad-B',
    linkedin: 'https://linkedin.com/in/abdelrahman-gawad-3536302bb',
    linkedinHandle: 'abdelrahman-gawad',
    /** Web3Forms public access key — carried over from Contact.tsx. */
    formKey: 'cde0ff64-770a-4d3a-b56b-27319258b496',
  },
} as const;

export type Personal = typeof PERSONAL;
