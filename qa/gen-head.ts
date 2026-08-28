import { PERSONAL } from '../src/data/personal';
import { ALL_SKILLS } from '../src/data/skills';
import { PROJECTS } from '../src/data/projects';

const C = PERSONAL.contact;
/* ── DEPLOY URL ──────────────────────────────────────────────
   Change this to the real Vercel domain and re-run:
     npx tsx qa/gen-head.ts   (then regenerate index.html)
   It feeds the canonical link, Open Graph, Twitter card and
   sitemap, so it must match the live origin exactly. */
const SITE = 'https://gawad-b.github.io';

const description =
  `${PERSONAL.name} — ${PERSONAL.roles[0]} and ${PERSONAL.roles[1]} in ` +
  `${PERSONAL.location}, studying CS at Egypt-Japan University. ` +
  `An interactive 3D universe of ${PROJECTS.length} projects across healthcare AI, ` +
  `full-stack web and Linux tooling.`;

const jsonld = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: PERSONAL.name,
  jobTitle: [...PERSONAL.roles],
  description: PERSONAL.intro,
  email: `mailto:${C.email}`,
  telephone: C.phone,
  url: SITE,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Alexandria',
    addressCountry: 'EG',
  },
  alumniOf: {
    '@type': 'CollegeOrUniversity',
    name: PERSONAL.institution,
  },
  knowsAbout: ALL_SKILLS.map((s) => s.name),
  sameAs: [C.github, C.linkedin],
  worksFor: { '@type': 'Organization', name: 'Independent' },
};

console.log(
  JSON.stringify({ description, jsonld: JSON.stringify(jsonld, null, 2), site: SITE }),
);
