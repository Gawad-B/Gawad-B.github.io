import { PERSONAL } from '@/data/personal';
import { SKILL_GROUPS } from '@/data/skills';
import { PROJECTS } from '@/data/projects';
import { PROJECT_WORLDS, WORLDS } from '@/data/worlds';

/**
 * The single rendering of every word in this portfolio.
 *
 * In 3D mode this is clipped to 1px — present, focusable and readable
 * by screen readers and crawlers, but not painted. In fallback mode the
 * exact same markup is revealed and styled. That is deliberate: there
 * is no second copy of the content to drift out of sync, and no route
 * that ends in a blank screen.
 */
export function ContentSpine({ visible = false }: { visible?: boolean }) {
  const c = PERSONAL.contact;

  return (
    <main
      id="content"
      className={visible ? 'cs-visible' : 'spine-clipped'}
      aria-label="Portfolio content"
    >
      <header>
        <p className="eyebrow">{PERSONAL.location} · {PERSONAL.institutionShort}</p>
        <h1>{PERSONAL.name}</h1>
        <p>{PERSONAL.roles.join(' · ')}</p>
        <p>{PERSONAL.intro}</p>
      </header>

      <section id="about" aria-labelledby="about-h">
        <h2 id="about-h">About</h2>
        {PERSONAL.bio.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
        <blockquote>
          <p className="cs-quote">{PERSONAL.quote}</p>
        </blockquote>
        <dl className="cs-telemetry">
          <div>
            <dt>Location</dt>
            <dd>{PERSONAL.location}</dd>
          </div>
          <div>
            <dt>Institution</dt>
            <dd>{PERSONAL.institution}</dd>
          </div>
          <div>
            <dt>Focus</dt>
            <dd>{PERSONAL.focus}</dd>
          </div>
        </dl>
      </section>

      <section id="skills" aria-labelledby="skills-h">
        <h2 id="skills-h">Skills</h2>
        {SKILL_GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={`sg-${group.id}`}>
            <h3 id={`sg-${group.id}`}>{group.label}</h3>
            <ul>
              {group.skills.map((skill) => (
                <li key={skill.id}>{skill.name}</li>
              ))}
            </ul>
          </section>
        ))}
      </section>

      <section id="projects" aria-labelledby="projects-h">
        <h2 id="projects-h">Projects</h2>
        {PROJECTS.map((project) => {
          const world = PROJECT_WORLDS.find((w) => w.project === project.id);
          return (
            <article key={project.id} aria-labelledby={`pr-${project.id}`}>
              <h3 id={`pr-${project.id}`}>
                <span className="cs-index">{project.index}</span> {project.name}
              </h3>
              <p className="eyebrow">{project.kind}</p>
              {world && (
                <p className="cs-world">
                  Represented in the 3D universe by <b>{world.displayName}</b>.
                </p>
              )}
              <p>{project.description}</p>
              <h4 className="cs-sub">Built with</h4>
              <ul className="cs-tech">
                {project.tech.map((tech) => (
                  <li key={tech}>{tech}</li>
                ))}
              </ul>
              {project.links.length > 0 ? (
                <ul className="cs-links">
                  {project.links.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} target="_blank" rel="noopener noreferrer">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
              {project.private && <p className="cs-private">Repository is private.</p>}
            </article>
          );
        })}
      </section>

      <section id="contact" aria-labelledby="contact-h">
        <h2 id="contact-h">Contact</h2>
        <p>{PERSONAL.availability}</p>
        <ul className="cs-links">
          <li>
            Email: <a href={`mailto:${c.email}`}>{c.email}</a>
          </li>
          <li>
            Phone: <a href={`tel:${c.phone}`}>{c.phoneDisplay}</a>
          </li>
          <li>
            GitHub:{' '}
            <a href={c.github} target="_blank" rel="noopener noreferrer">
              {c.githubHandle}
            </a>
          </li>
          <li>
            LinkedIn:{' '}
            <a href={c.linkedin} target="_blank" rel="noopener noreferrer">
              {c.linkedinHandle}
            </a>
          </li>
        </ul>
      </section>

      <footer>
        <p>
          © {new Date().getFullYear()} {PERSONAL.name} · Built out of noise functions and
          {' '}{Object.keys(WORLDS).length} celestial bodies
        </p>
      </footer>
    </main>
  );
}
