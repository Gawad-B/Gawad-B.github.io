import {
  useJourney,
  REGION_LABEL,
  type Region,
} from '@/store/journey';
import { blip } from '@/audio/ambience';

const NAV: Array<{ region: Region; index: string }> = [
  { region: 'hero', index: '01' },
  { region: 'about', index: '02' },
  { region: 'skills', index: '03' },
  { region: 'projects', index: '04' },
];

/**
 * The region selector. Split out of HUD so it can share a flex column with
 * NavManifest — the two used to be independently positioned in the same
 * corner, which meant every change to either one risked them overlapping.
 * Now the layout guarantees they can't.
 */
export function NavCluster() {
  const region = useJourney((s) => s.region);
  const milanoFound = useJourney((s) => s.milanoFound);
  const travelTo = useJourney((s) => s.travelTo);
  const enterMilano = useJourney((s) => s.enterMilano);

  const inShip = region === 'milano-interior';

  return (
    <nav className="hud-nav" aria-label="Universe navigation">
      <ul>
        {NAV.map((item) => {
          const active = region === item.region;
          return (
            <li key={item.region}>
              <button
                type="button"
                className={`hud-nav-btn hit${active ? ' is-active' : ''}`}
                aria-current={active ? 'true' : undefined}
                onClick={() => {
                  blip('select');
                  travelTo(item.region);
                }}
              >
                <span className="hud-nav-index">{item.index}</span>
                <span className="hud-nav-label">{REGION_LABEL[item.region]}</span>
                <span className="hud-nav-tick" aria-hidden="true" />
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            className={`hud-nav-btn hud-nav-btn--ship hit${inShip ? ' is-active' : ''}`}
            aria-current={inShip ? 'true' : undefined}
            onClick={() => {
              blip('approach');
              enterMilano();
            }}
          >
            <span className="hud-nav-index">05</span>
            <span className="hud-nav-label">
              {milanoFound ? REGION_LABEL['milano-interior'] : '· · · · ·'}
            </span>
            <span className="hud-nav-tick" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
