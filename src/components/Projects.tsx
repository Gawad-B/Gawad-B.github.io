import { motion } from 'motion/react';

interface ProjectCard {
  kind: string;
  title: string;
  titleColor: string;
  glow: string;
  texture: string;
  desc: string;
  tags: string[];
  link: string | null;
  linkLabel?: string;
}

const PROJECTS: ProjectCard[] = [
  {
    kind: 'Healthcare · LIS',
    title: 'Labora',
    titleColor: '#9ccfd8',
    glow: 'rgba(156,207,216,.25)',
    texture: 'radial-gradient(circle at 15% 20%,rgba(156,207,216,.06),transparent 55%)',
    desc: 'A laboratory information system for a medical lab — patient registration, test ordering, result entry and validation, bilingual Arabic/English PDF reports with full RTL, billing, and direct result capture from analyzers over ASTM. Carries the parts a lab is judged on: Westgard-rule quality control, delta checks, critical-value callback records, encrypted backups with a rehearsed restore, and native Windows and Linux installers. Repo is private — the landing page is below.',
    tags: ['TypeScript', 'React', 'Express', 'PostgreSQL', 'Prisma', 'Docker'],
    link: 'https://laboralanding.freeddns.org',
    linkLabel: '↗ Landing Page',
  },
  {
    kind: 'Ed-Tech · Coming Soon',
    title: 'Quizzy',
    titleColor: '#f6c177',
    glow: 'rgba(235,188,186,.25)',
    texture: 'radial-gradient(circle at 15% 20%,rgba(235,188,186,.06),transparent 55%)',
    desc: 'A full-stack quiz platform — React + Vite frontend, Express API, PostgreSQL database, and Firebase-backed auth with email verification and password recovery. Repo is private while I rebuild it — code coming soon.',
    tags: ['React', 'Vite', 'Express', 'PostgreSQL', 'Firebase Auth'],
    link: null,
  },
  {
    kind: 'Scheduling · CSP',
    title: 'ATTG',
    titleColor: '#eb6f92',
    glow: 'rgba(196,167,231,.25)',
    texture:
      'repeating-linear-gradient(135deg,transparent,transparent 14px,rgba(196,167,231,.03) 14px,rgba(196,167,231,.03) 15px)',
    desc: 'Automatic Timetable Generator — builds conflict-free class schedules with constraint satisfaction, balancing rooms, instructors, and time slots.',
    tags: ['Python', 'TypeScript', 'Tailwind CSS'],
    link: 'https://github.com/Gawad-B/Automatic-Timetable-Generator',
  },
  {
    kind: 'Healthcare AI',
    title: 'RDMID',
    titleColor: '#f6c177',
    glow: 'rgba(156,207,216,.25)',
    texture: 'radial-gradient(circle at 80% 15%,rgba(156,207,216,.05),transparent 55%)',
    desc: 'A latent diffusion pipeline that generates synthetic medical imagery for rare diseases, helping augment scarce clinical datasets for research.',
    tags: ['Python', 'Diffusion Models', 'Bootstrap CSS'],
    link: 'https://github.com/Gawad-B/latent-diffusion-model',
  },
  {
    kind: 'Linux Ritual',
    title: 'Prayer Times',
    titleColor: '#eb6f92',
    glow: 'rgba(49,116,143,.3)',
    texture: 'radial-gradient(circle at 20% 85%,rgba(49,116,143,.08),transparent 55%)',
    desc: 'A GNOME Shell extension that tracks prayer times fully offline — top-bar countdown, full timetable, adhan playback, and location-aware calculation.',
    tags: ['TypeScript', 'GNOME Shell', 'GStreamer'],
    link: 'https://github.com/Gawad-B/Prayer_TImes',
  },
  {
    kind: 'Healthcare AI',
    title: 'CVD Prediction',
    titleColor: '#eb6f92',
    glow: 'rgba(196,167,231,.25)',
    texture:
      'repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(196,167,231,.03) 18px,rgba(196,167,231,.03) 19px)',
    desc: 'An ensemble ML system (XGBoost + stacked models) that predicts cardiovascular disease risk from clinical data — precision tuned for the cases that matter most.',
    tags: ['Python', 'XGBoost', 'scikit-learn'],
    link: 'https://github.com/Gawad-B/CVD',
  },
  {
    kind: 'Ambient Web',
    title: 'This Portfolio',
    titleColor: '#f6c177',
    glow: 'rgba(156,207,216,.25)',
    texture: 'radial-gradient(circle at 80% 85%,rgba(156,207,216,.05),transparent 55%)',
    desc: "The site you're floating through right now — a Rosé Pine night sky with particles, cursor sparkles, and zero UI libraries.",
    tags: ['React', 'TypeScript', 'Canvas'],
    link: 'https://github.com/Gawad-B/Gawad-B.github.io',
  },
];

export function Projects() {
  return (
    <motion.section
      id="projects"
      className="rp-projects"
      initial={{ opacity: 0, scale: 0.97, y: 10 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="rp-section-heading">Projects</h2>
      <div className="rp-projects-track">
        {PROJECTS.map(project => (
          <article
            key={project.title}
            className="rp-card"
            style={{ backgroundImage: project.texture }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = `0 12px 48px ${project.glow}`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="rp-card-kind">{project.kind}</div>
            <h3 className="rp-card-title" style={{ color: project.titleColor }}>
              {project.title}
            </h3>
            <p className="rp-card-desc">{project.desc}</p>
            <div className="rp-card-tags">
              {project.tags.map(tag => (
                <span key={tag} className="rp-card-tag">
                  {tag}
                </span>
              ))}
            </div>
            {project.link ? (
              <a href={project.link} target="_blank" rel="noopener noreferrer" className="rp-card-link">
                {project.linkLabel ?? '↗ GitHub'}
              </a>
            ) : (
              <span className="rp-card-link rp-card-link--disabled">🔒 Repo Private</span>
            )}
          </article>
        ))}
      </div>
    </motion.section>
  );
}
