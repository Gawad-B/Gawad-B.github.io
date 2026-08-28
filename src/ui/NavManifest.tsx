import { useJourney } from '@/store/journey';
import { PROJECTS } from '@/data/projects';
import { PROJECT_WORLDS } from '@/data/worlds';
import { SKILL_GROUPS } from '@/data/skills';
import { blip } from '@/audio/ambience';
import './manifest.css';

/**
 * The target manifest — a spacecraft's nav list. Exists so nobody has to
 * fly around hunting for a planet: every world and every skill band is one
 * click from here, and it's driven entirely by data, so adding a project
 * adds a row.
 */
export function NavManifest() {
  const region = useJourney((s) => s.region);
  const focus = useJourney((s) => s.focus);
  const focusOn = useJourney((s) => s.focusOn);
  const isolatedBand = useJourney((s) => s.isolatedBand);
  const isolateBand = useJourney((s) => s.isolateBand);

  if (region === 'projects') {
    return (
      <nav className="mf" aria-label="Project worlds">
        <p className="eyebrow mf-title">Survey targets · 07</p>
        <ul>
          {PROJECTS.map((project, i) => {
            const world = PROJECT_WORLDS[i]!;
            const active = focus.kind === 'project' && focus.id === project.id;
            return (
              <li key={project.id}>
                <button
                  type="button"
                  className={`mf-row hit${active ? ' is-active' : ''}`}
                  style={{ ['--accent' as string]: world.accent }}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => {
                    blip('approach');
                    focusOn('project', project.id);
                  }}
                >
                  <span className="mf-index">{project.index}</span>
                  <span className="mf-body">
                    <span className="mf-world">{world.displayName}</span>
                    <span className="mf-name">{project.name}</span>
                  </span>
                  <span className="mf-dot" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  if (region === 'skills') {
    return (
      <nav className="mf" aria-label="Skill bands">
        <p className="eyebrow mf-title">Orbital bands · 07</p>
        <ul>
          <li>
            <button
              type="button"
              className={`mf-row mf-row--all hit${isolatedBand === null ? ' is-active' : ''}`}
              aria-current={isolatedBand === null ? 'true' : undefined}
              onClick={() => {
                blip('select');
                isolateBand(null);
              }}
            >
              <span className="mf-index">··</span>
              <span className="mf-body">
                <span className="mf-name">All bands</span>
              </span>
            </button>
          </li>
          {SKILL_GROUPS.map((group) => {
            const active = isolatedBand === group.id;
            return (
              <li key={group.id}>
                <button
                  type="button"
                  className={`mf-row hit${active ? ' is-active' : ''}`}
                  style={{ ['--accent' as string]: group.accent }}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => {
                    blip('select');
                    isolateBand(active ? null : group.id);
                  }}
                >
                  <span className="mf-index">{group.code}</span>
                  <span className="mf-body">
                    <span className="mf-name">{group.label}</span>
                    <span className="mf-world">{group.skills.length} moons</span>
                  </span>
                  <span className="mf-dot" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return null;
}
