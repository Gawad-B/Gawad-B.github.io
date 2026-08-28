/**
 * Projects. Source of truth: src/components/Projects.tsx @ b35eae0.
 * Descriptions are verbatim. The portfolio itself is deliberately NOT
 * listed as a project (owner's call, Rev 2) — you are standing in it.
 *
 * Nothing here is invented. Two repositories are genuinely private.
 */

export interface ProjectLink {
  label: string;
  href: string;
  kind: 'repo' | 'demo';
}

export interface Project {
  id: string;
  /** Display index — 01..07, matching the nav manifest. */
  index: string;
  name: string;
  kind: string;
  description: string;
  tech: string[];
  links: ProjectLink[];
  /** True when the repository is not public. */
  private: boolean;
  /** Shown in the non-WebGL fallback only. */
  screenshot?: string;
}

export const PROJECTS: Project[] = [
  {
    id: 'labora',
    index: '01',
    name: 'Labora',
    kind: 'Healthcare · LIS',
    description:
      'A laboratory information system for a medical lab — patient registration, test ordering, result entry and validation, bilingual Arabic/English PDF reports with full RTL, billing, and direct result capture from analyzers over ASTM. Carries the parts a lab is judged on: Westgard-rule quality control, delta checks, critical-value callback records, encrypted backups with a rehearsed restore, and native Windows and Linux installers.',
    tech: ['TypeScript', 'React', 'Express', 'PostgreSQL', 'Prisma', 'Docker'],
    links: [{ label: 'Landing Page', href: 'https://laboralanding.freeddns.org', kind: 'demo' }],
    private: true,
  },
  {
    id: 'quizzy',
    index: '02',
    name: 'Quizzy',
    kind: 'Ed-Tech · Coming Soon',
    description:
      'A full-stack quiz platform — React + Vite frontend, Express API, PostgreSQL database, and Firebase-backed auth with email verification and password recovery. Repo is private while I rebuild it — code coming soon.',
    tech: ['React', 'Vite', 'Express', 'PostgreSQL', 'Firebase Auth'],
    links: [],
    private: true,
    screenshot: '/assets/quizzy.png',
  },
  {
    id: 'prayer-times',
    index: '03',
    name: 'Prayer Times',
    kind: 'Linux Ritual',
    description:
      'A GNOME Shell extension that tracks prayer times fully offline — top-bar countdown, full timetable, adhan playback, and location-aware calculation.',
    tech: ['TypeScript', 'GNOME Shell', 'GStreamer'],
    links: [
      { label: 'GitHub', href: 'https://github.com/Gawad-B/Prayer_TImes', kind: 'repo' },
    ],
    private: false,
  },
  {
    id: 'rdmid',
    index: '04',
    name: 'RDMID',
    kind: 'Healthcare AI',
    description:
      'A latent diffusion pipeline that generates synthetic medical imagery for rare diseases, helping augment scarce clinical datasets for research.',
    tech: ['Python', 'Diffusion Models', 'Bootstrap CSS'],
    links: [
      { label: 'GitHub', href: 'https://github.com/Gawad-B/latent-diffusion-model', kind: 'repo' },
    ],
    private: false,
    screenshot: '/assets/RDMID.png',
  },
  {
    id: 'attg',
    index: '05',
    name: 'ATTG',
    kind: 'Scheduling · CSP',
    description:
      'Automatic Timetable Generator — builds conflict-free class schedules with constraint satisfaction, balancing rooms, instructors, and time slots.',
    tech: ['Python', 'TypeScript', 'Tailwind CSS'],
    links: [
      {
        label: 'GitHub',
        href: 'https://github.com/Gawad-B/Automatic-Timetable-Generator',
        kind: 'repo',
      },
    ],
    private: false,
    screenshot: '/assets/attg.png',
  },
  {
    id: 'cvd',
    index: '06',
    name: 'CVD Prediction',
    kind: 'Healthcare AI',
    description:
      'An ensemble ML system (XGBoost + stacked models) that predicts cardiovascular disease risk from clinical data — precision tuned for the cases that matter most.',
    tech: ['Python', 'XGBoost', 'scikit-learn'],
    links: [{ label: 'GitHub', href: 'https://github.com/Gawad-B/CVD', kind: 'repo' }],
    private: false,
    screenshot: '/assets/cvd.png',
  },
];

export const PROJECT_COUNT = PROJECTS.length;

export function projectById(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}
