import { MILANO } from '@/data/milano';
import './milano-plate.css';

/**
 * The parking citation — the one joke, stated once, in the corner.
 * The contact interface itself lives on the monitor inside the cockpit.
 */
export function MilanoPlate() {
  return (
    <aside className="con-plate" aria-hidden="true">
      <p className="con-plate-title">{MILANO.citation.title}</p>
      <ul>
        {MILANO.citation.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </aside>
  );
}
