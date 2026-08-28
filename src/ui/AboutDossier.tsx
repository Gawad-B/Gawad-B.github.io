import { PERSONAL } from '@/data/personal';
import { WORLDS } from '@/data/worlds';
import { useJourney } from '@/store/journey';
import './dossier.css';

const WORLD = WORLDS['hd-189733-b'];

/**
 * The About dossier. A crew file rather than a bio blurb: portrait in a
 * bezel, telemetry strip, then the prose. The Cormorant quote at the end
 * is the only serif in the entire build — one human note inside all the
 * machinery.
 */
export function AboutDossier() {
  const travelTo = useJourney((s) => s.travelTo);

  return (
    <div className="dos">
      <div className="dos-card bezel">
        <div className="dos-screen bezel-screen brackets scanlines">
          <header className="dos-head">
            <div className="dos-portrait bezel">
              <img
                src="/assets/profile.jpg"
                alt=""
                width={72}
                height={72}
                loading="eager"
                decoding="async"
              />
            </div>
            <div>
              <p className="eyebrow dos-eyebrow">Crew file · 01</p>
              <p className="dos-name">{PERSONAL.name}</p>
              <p className="dos-roles">{PERSONAL.roles.join(' · ')}</p>
            </div>
          </header>

          <dl className="dos-telemetry">
            <div>
              <dt>Location</dt>
              <dd>{PERSONAL.location}</dd>
            </div>
            <div>
              <dt>Institution</dt>
              <dd>{PERSONAL.institutionShort}</dd>
            </div>
            <div>
              <dt>Focus</dt>
              <dd>{PERSONAL.focus}</dd>
            </div>
          </dl>

          <div className="dos-rule" />

          <div className="dos-body">
            {PERSONAL.bio.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>

          <blockquote className="dos-quote">{PERSONAL.quote}</blockquote>

          <button
            type="button"
            className="dos-next hit"
            onClick={() => travelTo('skills')}
          >
            <span>Continue to Saturn</span>
            <span className="dos-next-icon" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M2 6h8M6.6 2.6L10 6l-3.4 3.4" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      {/* Astronomical annotation — labels what you're looking at, and keeps
          the real facts about the planet next to the planet. */}
      <aside className="dos-annot" aria-hidden="true">
        <p className="eyebrow dos-annot-title" style={{ color: WORLD.accent }}>
          {WORLD.designation}
        </p>
        <ul>
          {WORLD.facts.slice(0, 3).map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
