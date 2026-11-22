import type { CSSProperties } from 'react';
import { PERSONAL } from '@/data/personal';
import { PRO } from '../content';
import type { FeaturedProject, MoreProject, ProLink } from '../content';
import { PROJECT_SHOTS } from '../assets';
import { IconArrowUpRight, IconAsterisk, IconLock } from './icons';
import { Words, wordCount } from './Words';
import './projects.css';

const P = PRO.projects;

function externalLabel(project: string, link: ProLink): string {
  return `${project} — ${link.label} (opens in a new tab)`;
}

function numberLabel(index: number): string {
  return String(index + 1).padStart(3, '0');
}

function FeaturedRow({ project, index }: { project: FeaturedProject; index: number }) {
  const shot = PROJECT_SHOTS[project.id];
  return (
    <article className="pv-proj__row" aria-labelledby={`pv-proj-${project.id}`}>
      <p className="pv-proj__num" aria-hidden="true">
        <IconAsterisk size={12} />
        {numberLabel(index)}
      </p>

      <div className="pv-proj__body pv-rv pv-rv--soft">
        <p className="pv-proj__meta">
          {project.status} · {project.kind}
        </p>
        <h3 className="pv-proj__title" id={`pv-proj-${project.id}`}>
          {project.name}
        </h3>
        <p className="pv-proj__pitch">{project.pitch}</p>
        <ul className="pv-proj__bullets">
          {project.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <ul className="pv-proj__tags pv-rv pv-rv--chips" aria-label="Technologies">
          {project.tech.map((t, i) => (
            <li key={t} className="pv-tag" style={{ '--pv-i': i } as CSSProperties}>
              {t}
            </li>
          ))}
        </ul>
        {(project.links.length > 0 || project.privateRepo) && (
          <div className="pv-proj__links">
            {project.links.map((link) => (
              <a
                key={link.href}
                className="pv-btn pv-btn--sm"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={externalLabel(project.name, link)}
              >
                <span>{link.label}</span>
                <span className="pv-btn__icon">
                  <IconArrowUpRight size={14} />
                </span>
              </a>
            ))}
            {project.privateRepo && (
              <span className="pv-proj__private">
                <IconLock size={14} />
                {P.privateLabel}
              </span>
            )}
          </div>
        )}
      </div>

      <figure className="pv-frame pv-proj__frame pv-rv pv-rv--img">
        <div className="pv-frame__media">
          <img
            className="pv-proj__img"
            src={shot.src}
            width={shot.width}
            height={shot.height}
            alt={shot.alt}
            loading="lazy"
            decoding="async"
          />
        </div>
        <figcaption className="pv-frame__cap" aria-hidden="true">
          <span>
            <IconAsterisk size={12} />
            {project.name}
          </span>
          <span>/{project.kind}</span>
        </figcaption>
      </figure>
    </article>
  );
}

function MoreItem({ item, index }: { item: MoreProject; index: number }) {
  const hasLinks = item.links.length > 0;
  return (
    <li className="pv-proj__more-item pv-rv" style={{ '--pv-i': index % 2 } as CSSProperties}>
      <div className="pv-proj__more-head">
        <span className="pv-proj__more-name">{item.name}</span>
        {item.status && <span className="pv-proj__more-status">{item.status}</span>}
      </div>
      <p className="pv-proj__more-summary">{item.summary}</p>
      <ul className="pv-proj__more-tags" aria-label="Technologies">
        {item.tech.map((t) => (
          <li key={t} className="pv-tag">
            {t}
          </li>
        ))}
      </ul>
      {hasLinks && (
        <ul className="pv-proj__more-links">
          {item.links.map((link) => (
            <li key={link.href}>
              <a
                className="pv-link"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={externalLabel(item.name, link)}
              >
                {link.label}
                <IconArrowUpRight size={14} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function Projects() {
  return (
    <section id="projects" className="pv-section pv-proj" aria-labelledby="pv-proj-heading">
      <div className="pv-container">
        <header className="pv-proj__header">
          <div>
            <span className="pv-label pv-rv">
              <IconAsterisk size={12} /> {P.label}
            </span>
            <h2 className="pv-h2 pv-rv pv-rv--words" id="pv-proj-heading">
              <span>
                <Words text={P.heading[0]} />
              </span>{' '}
              <span className="pv-h2__muted">
                <Words text={P.heading[1]} startIndex={wordCount(P.heading[0])} />
              </span>
            </h2>
          </div>
          <p className="pv-lead pv-proj__intro pv-rv" style={{ '--pv-i': 1 } as CSSProperties}>
            {P.intro}
          </p>
        </header>

        <div className="pv-proj__list">
          {P.featured.map((project, i) => (
            <FeaturedRow key={project.id} project={project} index={i} />
          ))}
        </div>

        <div className="pv-proj__more">
          <h3 className="pv-proj__more-title pv-rv">{P.moreHeading}</h3>
          <ul className="pv-proj__more-list">
            {P.more.map((item, i) => (
              <MoreItem key={item.id} item={item} index={i} />
            ))}
          </ul>
        </div>

        <div className="pv-proj__cta pv-rv">
          <a
            className="pv-btn"
            href={PERSONAL.contact.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${P.githubCta} (opens in a new tab)`}
          >
            <span>{P.githubCta}</span>
            <span className="pv-btn__icon">
              <IconArrowUpRight size={14} />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
