import { motion } from 'motion/react';

const SKILL_GROUPS = [
  {
    label: 'Machine Learning / AI',
    rgb: '196,167,231',
    orbs: [
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
    ],
  },
  {
    label: 'Frontend',
    rgb: '156,207,216',
    orbs: ['React', 'TypeScript', 'HTML', 'CSS', 'Tailwind CSS', 'Vite'],
  },
  {
    label: 'Backend / APIs',
    rgb: '156,207,216',
    orbs: ['Node.js', 'Flask', 'FastAPI', 'REST APIs', 'JWT Auth'],
  },
  {
    label: 'Databases',
    rgb: '235,188,186',
    orbs: ['PostgreSQL', 'SQLite', 'MariaDB', 'Firebase', 'Neon', 'MySQL'],
  },
  {
    label: 'Linux / DevOps',
    rgb: '49,116,143',
    orbs: ['Linux', 'System Administration', 'Bash', 'Docker', 'Git', 'GitHub', 'Cloud Hosting'],
  },
  {
    label: 'Languages',
    rgb: '246,193,119',
    orbs: ['Python', 'JavaScript', 'TypeScript', 'SQL', 'Bash', 'C++', 'R'],
  },
  {
    label: 'Computer Science',
    rgb: '110,106,134',
    orbs: [
      'Data Structures',
      'Algorithms',
      'OOP',
      'Design Patterns',
      'DB Normalization',
      'Virtual Memory',
      'Cache Memory',
    ],
  },
];

export function Skills() {
  return (
    <motion.section
      id="skills"
      className="rp-skills"
      initial={{ opacity: 0, scale: 0.97, y: 10 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="rp-section-heading">Skills</h2>
      <div className="rp-skill-groups">
        {SKILL_GROUPS.map(group => (
          <div key={group.label}>
            <div className="rp-skill-label">{group.label}</div>
            <div className="rp-orb-cluster">
              {group.orbs.map((name, i) => (
                <div
                  key={name}
                  className="rp-orb"
                  style={
                    {
                      border: `1px solid rgba(${group.rgb},.4)`,
                      color: `rgb(${group.rgb})`,
                      boxShadow: `0 0 18px rgba(${group.rgb},.12)`,
                      animationDuration: `${3.5 + (i % 3)}s`,
                      animationDelay: `${i * 0.35}s`,
                    } as React.CSSProperties
                  }
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = `0 0 34px rgba(${group.rgb},.45)`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = `0 0 18px rgba(${group.rgb},.12)`;
                  }}
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
