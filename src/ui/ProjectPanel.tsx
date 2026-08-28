import { Panel } from './Panel';
import { useJourney } from '@/store/journey';
import { projectById } from '@/data/projects';
import { worldForProject } from '@/data/worlds';
import { blip } from '@/audio/ambience';
import './projectpanel.css';

/**
 * Project dossier.
 *
 * `panelMode` comes from the world, not from taste: WASP-76 b's nightside
 * and TrES-2b are genuinely near-black, so those two get the light panel
 * and everything else gets the dark one. That's the per-project contrast
 * requirement handled by the data rather than by remembering to check.
 */
export function ProjectPanel({ projectId }: { projectId: string }) {
  const clearFocus = useJourney((s) => s.clearFocus);
  const project = projectById(projectId);
  const world = worldForProject(projectId);
  if (!project || !world) return null;

  return (
    <Panel
      mode={world.panelMode}
      accent={world.accent}
      eyebrow={`${project.index} · ${project.kind}`}
      title={project.name}
      designation={world.designation}
      onClose={() => {
        blip('close');
        clearFocus();
      }}
      facts={world.facts}
      factsLabel={`${world.displayName} · observed`}
    >
      <p>{project.description}</p>

      <section className="prp-section" aria-label="Technologies used">
        <p className="eyebrow prp-label">Built with</p>
        <ul className="prp-tech">
          {project.tech.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
      </section>

      <section className="prp-section" aria-label="Links">
        <p className="eyebrow prp-label">Access</p>
        {project.links.length > 0 ? (
          <ul className="prp-links">
            {project.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="prp-link hit"
                >
                  <span>{link.label}</span>
                  <span className="prp-link-icon" aria-hidden="true">
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3">
                      <path d="M2.4 8.6L8.6 2.4M8.6 2.4H4.1M8.6 2.4v4.5" />
                    </svg>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        {project.private && (
          <p className="prp-private">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
              <rect x="2.5" y="5.2" width="7" height="5" rx="1" />
              <path d="M4.2 5.2V3.8a1.8 1.8 0 0 1 3.6 0v1.4" />
            </svg>
            Repository is private
          </p>
        )}
      </section>
    </Panel>
  );
}
