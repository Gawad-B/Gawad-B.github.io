import './skills.css';
import type { CSSProperties } from 'react';
import { PRO } from '../content';
import { IconAsterisk } from './icons';
import { Words, wordCount } from './Words';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const parts = (s: string) => s.split(/ \/ | & /).map(norm).filter(Boolean);

/** Featured projects that list this skill among their tech, computed from the content, never typed. */
function usedIn(item: string): string[] {
  const names = parts(item);
  return PRO.projects.featured
    .filter((p) => p.tech.some((t) => parts(t).some((n) => names.includes(n))))
    .map((p) => p.name);
}

export function Skills() {
  const s = PRO.skills;
  const groups = s.groups.map((g) => ({ ...g, rows: g.items.map((item) => ({ item, names: usedIn(item) })) }));
  const anyEvidence = groups.some((g) => g.rows.some((r) => r.names.length > 0));

  return (
    <section id="skills" className="pv-skills pv-section" aria-labelledby="skills-title">
      <div className="pv-container">
        <header className="pv-skills__head">
          <div>
            <p className="pv-label">
              <IconAsterisk size={12} /> {s.label}
            </p>
            <h2 id="skills-title" className="pv-h2 pv-rv pv-rv--words">
              <span>
                <Words text={s.heading[0]} />
              </span>{' '}
              <span className="pv-h2__muted">
                <Words text={s.heading[1]} startIndex={wordCount(s.heading[0])} />
              </span>
            </h2>
          </div>
          <div className="pv-skills__aside">
            <p className="pv-skills__note">{s.note}</p>
            {anyEvidence ? (
              <p className="pv-skills__legend">
                <span className="pv-skills__dot" aria-hidden="true" />
                used in a featured project above
              </p>
            ) : null}
          </div>
        </header>

        <div className="pv-skills__grid">
          {groups.map((g, gi) => (
            <div
              key={g.label}
              className="pv-skills__card pv-rv pv-rv--chips"
              style={{ '--pv-i': gi } as CSSProperties}
            >
              <h3 className="pv-skills__label">
                <IconAsterisk size={12} /> {g.label}
              </h3>
              <ul className="pv-skills__chips" role="list">
                {g.rows.map(({ item, names }, ii) => {
                  const used = names.length > 0 ? `Used in ${names.join(', ')}` : undefined;
                  return (
                    <li
                      key={item}
                      className="pv-tag pv-skills__chip"
                      style={{ '--pv-i': ii } as CSSProperties}
                    >
                      {used ? <span className="pv-skills__dot" aria-hidden="true" /> : null}
                      {item}
                      {used ? <span className="pv-vh"> ({used.charAt(0).toLowerCase() + used.slice(1)})</span> : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
