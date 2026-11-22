import { PERSONAL } from '../src/data/personal';
import { PROJECTS } from '../src/data/projects';
import { PRO } from '../src/pro/content';

const C = PERSONAL.contact;
/* ── DEPLOY URL ──────────────────────────────────────────────
   Change this to the real domain and re-run:
     bash qa/build-head.sh
   It feeds the canonical links, Open Graph, Twitter card and
   sitemap of both pages, so it must match the live origin exactly. */
const SITE = 'https://gawad-b.github.io';

/* Who he is comes from the professional view's content (src/pro/content.ts), so the heads
   cannot drift from the page: job title, headline sentence, skills and school. */
const H = PRO.hero;
const headline = `${H.headline.before}${H.headline.accent}${H.headline.after}`;
const lcFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const knowsAbout = [...new Set(PRO.skills.groups.flatMap((g) => g.items))];

const universeDescription =
  `${PERSONAL.name} — ${lcFirst(H.title)} in ${PERSONAL.location}, studying computer science ` +
  `at E-JUST. An interactive 3D universe of ${PROJECTS.length} projects across healthcare AI, ` +
  `full-stack web and Linux tooling.`;

const proDescription =
  `${PERSONAL.name} is a ${lcFirst(headline).replace(/\.$/, '')}, and a computer science ` +
  `student at E-JUST in Alexandria. Projects, experience and résumé.`;

const jsonld = JSON.stringify(
  {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: PERSONAL.name,
    jobTitle: H.title,
    description: headline,
    email: `mailto:${C.email}`,
    telephone: C.phone,
    url: SITE,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Alexandria',
      addressCountry: 'EG',
    },
    affiliation: {
      '@type': 'CollegeOrUniversity',
      name: PRO.experience.education.school,
    },
    knowsAbout,
    sameAs: [C.github, C.linkedin],
  },
  null,
  2,
);

const proTitle = `${PERSONAL.name} — ${H.title}`;
const universeTitle = `${PERSONAL.name} — ${H.title} · 3D universe`;

console.log(
  JSON.stringify({
    site: SITE,
    // The generated HTML (noscript block) interpolates these; the writer holds no literals.
    contact: {
      email: C.email,
      phone: C.phone,
      phoneDisplay: C.phoneDisplay,
      github: C.github,
      githubHandle: C.githubHandle,
      linkedin: C.linkedin,
    },
    pro: {
      title: proTitle,
      twitterTitle: proTitle,
      description: proDescription,
      canonical: `${SITE}/`,
      ogImage: `${SITE}/og-pro.png`,
      ogImageAlt: `${PERSONAL.name}, full-stack and AI/ML engineer`,
      jsonld,
    },
    universe: {
      title: universeTitle,
      twitterTitle: universeTitle,
      description: universeDescription,
      canonical: `${SITE}/universe/`,
      ogImage: `${SITE}/og.png`,
      ogImageAlt:
        'A red hypergiant in deep space, with the name Abdelrahman Gawad overlaid',
      jsonld,
    },
    tagline: H.title,
    location: `${PERSONAL.location} · CS at ${PERSONAL.institution}.`,
  }),
);
