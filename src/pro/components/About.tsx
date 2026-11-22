import './about.css';
import type { CSSProperties } from 'react';
import { PRO } from '../content';
import { IconAsterisk } from './icons';
import { Words, wordCount } from './Words';

export function About() {
  const a = PRO.about;
  let next = 0;

  return (
    <section id="about" className="pv-about pv-section" aria-labelledby="about-title">
      <div className="pv-container pv-about__grid">
        <div>
          <p className="pv-label">
            <IconAsterisk size={12} /> {a.label}
          </p>
          <h2 id="about-title" className="pv-h2 pv-rv pv-rv--words">
            <span>
              <Words text={a.heading[0]} />
            </span>{' '}
            <span className="pv-h2__muted">
              <Words text={a.heading[1]} startIndex={wordCount(a.heading[0])} />
            </span>
          </h2>
        </div>

        <div className="pv-about__body">
          <p className="pv-about__text pv-rv pv-rv--words pv-rv--soft" style={{ '--pv-w-step': '14ms' } as CSSProperties}>
            {a.paragraph.map((s, i) => {
              const start = next;
              next += wordCount(s);
              return (
                <span key={s} className={i === 0 ? 'pv-about__first' : undefined}>
                  {i > 0 ? ' ' : null}
                  <Words text={s} startIndex={start} />
                </span>
              );
            })}
          </p>

          <blockquote className="pv-about__quote pv-blurb pv-rv">
            <IconAsterisk size={12} /> {a.quote}
          </blockquote>
        </div>
      </div>
    </section>
  );
}
