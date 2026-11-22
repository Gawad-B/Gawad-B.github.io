/**
 * Skills. Source of truth: src/components/Skills.tsx @ b35eae0.
 * 7 groups, 49 skills — each group becomes an orbital band around
 * Saturn, each skill becomes a moon on its band.
 *
 * Accents stay inside the cold instrument family: the two headline
 * groups take the two signal colours, the rest are differentiated by
 * brightness and a narrow hue drift, the way a real instrument
 * display separates channels.
 */

export interface Skill {
  id: string;
  name: string;
  groupId: string;
}

export interface SkillGroup {
  id: string;
  label: string;
  /** Short mono label for the HUD band selector. */
  code: string;
  accent: string;
  /** Orbital radius in Saturn radii. Unique and ascending. */
  bandRadius: number;
  /** Degrees of inclination, so the bands don't read as one flat disc. */
  inclination: number;
  skills: Skill[];
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

function group(
  id: string,
  label: string,
  code: string,
  accent: string,
  bandRadius: number,
  inclination: number,
  names: string[],
): SkillGroup {
  return {
    id,
    label,
    code,
    accent,
    bandRadius,
    inclination,
    skills: names.map((name) => ({ id: `${id}--${slug(name)}`, name, groupId: id })),
  };
}

export const SKILL_GROUPS: SkillGroup[] = [
  group('ml-ai', 'Machine Learning / AI', 'ML-AI', '#ffb35c', 2.55, 4, [
    'Machine Learning',
    'Neural Networks',
    'Ensemble Models',
    'XGBoost',
    'PyTorch',
    'Scikit-learn',
    'Feature Engineering',
    'HF Diffusers',
    'Claude Code',
    'Bioinformatics',
  ]),
  group('languages', 'Languages', 'LANG', '#7fd4e8', 2.9, -7, [
    'Python',
    'JavaScript',
    'TypeScript',
    'SQL',
    'Bash',
    'C++',
    'Rust',
    'R',
  ]),
  group('frontend', 'Frontend', 'FE', '#a8c4db', 3.25, 11, [
    'React',
    'TypeScript',
    'HTML',
    'CSS',
    'Tailwind CSS',
    'Vite',
  ]),
  group('backend', 'Backend / APIs', 'API', '#8fa8c4', 3.6, -5, [
    'Node.js',
    'Flask',
    'FastAPI',
    'REST APIs',
    'JWT Auth',
  ]),
  group('databases', 'Databases', 'DB', '#c4b79e', 3.95, 8, [
    'PostgreSQL',
    'SQLite',
    'MariaDB',
    'Firebase',
    'Neon',
    'MySQL',
  ]),
  group('linux-devops', 'Linux / DevOps', 'OPS', '#9db8a8', 4.3, -12, [
    'Linux',
    'System Administration',
    'Bash',
    'Docker',
    'Git',
    'GitHub',
    'Cloud Hosting',
  ]),
  group('cs', 'Computer Science', 'CS', '#b0b6c4', 4.65, 6, [
    'Data Structures',
    'Algorithms',
    'OOP',
    'Design Patterns',
    'DB Normalization',
    'Virtual Memory',
    'Cache Memory',
  ]),
];

export const ALL_SKILLS: Skill[] = SKILL_GROUPS.flatMap((g) => g.skills);

export const SKILL_COUNT = ALL_SKILLS.length;

export function groupOf(skillId: string): SkillGroup | undefined {
  return SKILL_GROUPS.find((g) => g.skills.some((s) => s.id === skillId));
}
