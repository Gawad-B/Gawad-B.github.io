/**
 * Data integrity. Run with: npx tsx qa/data.test.ts
 * Guards the "no fabrication" constraint and the cross-file contracts
 * that the 3D layer relies on.
 */
import { SKILL_GROUPS, ALL_SKILLS } from '../src/data/skills';
import { PROJECTS } from '../src/data/projects';
import { WORLDS, PROJECT_WORLDS, PROJECT_WORLD_IDS } from '../src/data/worlds';
import { PERSONAL } from '../src/data/personal';
import { MILANO, STATION } from '../src/data/milano';

let failures = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) {
    console.log(`  ok   ${name}`);
  } else {
    console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
    failures++;
  }
}

console.log('\nskills');
check('7 groups', SKILL_GROUPS.length === 7, `got ${SKILL_GROUPS.length}`);
check('49 skills', ALL_SKILLS.length === 49, `got ${ALL_SKILLS.length}`);
const counts = SKILL_GROUPS.map((g) => g.skills.length);
check(
  'group sizes: the original portfolio plus Rust in Languages',
  JSON.stringify([...counts].sort((a, b) => a - b)) === JSON.stringify([5, 6, 6, 7, 7, 8, 10]),
  JSON.stringify(counts),
);
const radii = SKILL_GROUPS.map((g) => g.bandRadius);
check('band radii unique', new Set(radii).size === radii.length);
check(
  'band radii ascending',
  radii.every((r, i) => i === 0 || r > radii[i - 1]!),
  JSON.stringify(radii),
);
check('band radii clear the ring system (>2.35 Saturn radii)', Math.min(...radii) > 2.35);
check('skill ids unique', new Set(ALL_SKILLS.map((s) => s.id)).size === 49);
check(
  'every group accent is 6-digit hex',
  SKILL_GROUPS.every((g) => /^#[0-9a-f]{6}$/i.test(g.accent)),
);

console.log('\nprojects');
check('6 projects (the portfolio is deliberately not listed)', PROJECTS.length === 6, `got ${PROJECTS.length}`);
check('project ids unique', new Set(PROJECTS.map((p) => p.id)).size === 6);
check(
  'indices are 01..06 in order',
  PROJECTS.map((p) => p.index).join() === '01,02,03,04,05,06',
);
check(
  'every link is https',
  PROJECTS.every((p) => p.links.every((l) => l.href.startsWith('https://'))),
);
check(
  'every non-private project has a repo link',
  PROJECTS.filter((p) => !p.private).every((p) => p.links.some((l) => l.kind === 'repo')),
);
check(
  'private projects are exactly labora and quizzy',
  PROJECTS.filter((p) => p.private)
    .map((p) => p.id)
    .join() === 'quizzy,labora',
);
check('every project has at least one tech tag', PROJECTS.every((p) => p.tech.length > 0));

console.log('\nworlds');
check('6 project worlds', PROJECT_WORLDS.length === 6);
check(
  'every project world maps to a real project',
  PROJECT_WORLDS.every((w) => PROJECTS.some((p) => p.id === w.project)),
);
check(
  'every project has a world',
  PROJECTS.every((p) => PROJECT_WORLDS.some((w) => w.project === p.id)),
);
check(
  'world order matches project index order',
  PROJECT_WORLD_IDS.map((id) => WORLDS[id].project).join() ===
    PROJECTS.map((p) => p.id).join(),
);
const allWorlds = Object.values(WORLDS);
check(
  'every accent is 6-digit hex',
  allWorlds.every((w) => /^#[0-9a-f]{6}$/i.test(w.accent)),
);
check(
  'designations unique',
  new Set(allWorlds.map((w) => w.designation)).size === allWorlds.length,
);
check('every world has >= 3 facts', allWorlds.every((w) => w.facts.length >= 3));
check(
  'near-black worlds force the light panel',
  WORLDS['wasp-76-b'].panelMode === 'light' && WORLDS['tres-2b'].panelMode === 'light',
);
check(
  'shader params are visually distinct (no two identical fingerprints)',
  new Set(
    PROJECT_WORLDS.map((w) =>
      [
        w.shader.baseColor,
        w.shader.bandStrength,
        w.shader.emission,
        w.shader.lavaCracks,
        w.shader.rainStreaks,
        w.shader.terminatorSharpness,
      ].join('|'),
    ),
  ).size === 6,
);
check(
  'exactly one world has a photoevaporation tail',
  PROJECT_WORLDS.filter((w) => w.shader.tail).length === 1,
);
check(
  'exactly one world has two suns',
  PROJECT_WORLDS.filter((w) => w.shader.twoSuns).length === 1,
);
check('3 reserved slots (incl. HD 110067)', allWorlds.filter((w) => w.unused).length === 3);
check(
  'reserved slots carry no project',
  allWorlds.filter((w) => w.unused).every((w) => w.project === undefined),
);

console.log('\npersonal + milano');
check('4 roles', PERSONAL.roles.length === 4);
check('3 bio paragraphs', PERSONAL.bio.length === 3);
check('email looks like an address', /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(PERSONAL.contact.email));
check('phone is E.164', /^\+\d{8,15}$/.test(PERSONAL.contact.phone));
check('github url', PERSONAL.contact.github.startsWith('https://github.com/'));
check('linkedin url', PERSONAL.contact.linkedin.startsWith('https://linkedin.com/in/'));
check('web3forms key present', PERSONAL.contact.formKey.length === 36);
check('>= 8 milano quips', MILANO.quips.length >= 8, `got ${MILANO.quips.length}`);
check('station has a panel designation', STATION.panel.startsWith('STN'));
check('the ship is docked at the station', MILANO.location.includes(STATION.panel));
check('the citation still states the fine', MILANO.citation.lines.some((l) => l.includes('40,000')));
check('quips are short (<= 70 chars)', MILANO.quips.every((q) => q.length <= 70));

console.log(failures === 0 ? '\n✓ all data checks passed\n' : `\n✗ ${failures} failure(s)\n`);
process.exit(failures === 0 ? 0 : 1);
