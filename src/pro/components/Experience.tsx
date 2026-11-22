import './experience.css';
import type { CSSProperties, ReactElement } from 'react';
import { PRO } from '../content';
import { IconAsterisk, IconCross, IconPlus, IconSpark } from './icons';
import { Words, wordCount } from './Words';

interface InfoCard {
  key: string;
  kicker: string;
  title: string;
  lines: string[];
}

const GLYPHS: ReactElement[] = [
  <IconSpark key="spark" size={22} />,
  <IconAsterisk key="asterisk" size={22} />,
  <IconCross key="cross" size={22} />,
  <IconPlus key="plus" size={22} />,
];

export function Experience() {
  const x = PRO.experience;
  const edu = x.education;

  const cards: InfoCard[] = [
    {
      key: 'education',
      kicker: x.educationHeading,
      title: edu.degree,
      lines: [`${edu.school} · ${edu.location}`, edu.dates],
    },
    ...x.honours.map((h) => ({
      key: `honour-${h.title}`,
      kicker: x.honoursHeading,
      title: h.title,
      lines: [h.detail],
    })),
    ...x.certificates.map((c) => ({
      key: `cert-${c.name}`,
      kicker: x.certificatesHeading,
      title: c.name,
      lines: [`${c.issuer}${c.detail ? ` · ${c.detail}` : ''}`, c.date],
    })),
  ];

  return (
    <section id="experience" className="pv-exp pv-section" aria-labelledby="experience-title">
      <div className="pv-container">
        <header className="pv-exp__head">
          <span className="pv-label pv-rv">
            <IconAsterisk size={12} /> {x.label}
          </span>
          <div className="pv-exp__title">
            <h2 id="experience-title" className="pv-h2 pv-h2--center pv-rv pv-rv--words">
              <span>
                <Words text={x.heading[0]} />
              </span>{' '}
              <span className="pv-h2__muted">
                <Words text={x.heading[1]} startIndex={wordCount(x.heading[0])} />
              </span>
            </h2>
            <IconAsterisk size={48} className="pv-exp__star pv-spin" />
          </div>
        </header>

        <ol className="pv-exp__timeline">
          {x.roles.map((r, i) => (
            <li key={r.role} className="pv-exp__item pv-rv" style={{ '--pv-i': i } as CSSProperties}>
              <p className="pv-exp__dates">{r.dates}</p>
              <div className="pv-exp__main">
                <h3 className="pv-exp__role">{r.role}</h3>
                <p className="pv-exp__org">
                  <span className="pv-exp__org-name">{r.org}</span>
                  <span className="pv-vh">, </span>{' '}
                  <span className="pv-exp__org-loc">
                    {r.location}
                    {r.note ? ` (${r.note})` : ''}
                  </span>
                </p>
                <ul className="pv-exp__bullets">
                  {r.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>

        <ul className="pv-exp__cards">
          {cards.map((c, i) => (
            <li key={c.key} className="pv-exp__card pv-rv" style={{ '--pv-i': i % 4 } as CSSProperties}>
              <div className="pv-exp__card-top">
                <span className="pv-exp__glyph" aria-hidden="true">
                  {GLYPHS[i % GLYPHS.length]}
                </span>
                <p className="pv-exp__kicker">{c.kicker}</p>
              </div>
              <h3 className="pv-exp__card-title">{c.title}</h3>
              <div className="pv-exp__card-text">
                {c.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
