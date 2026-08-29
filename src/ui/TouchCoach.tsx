import { useEffect, useState } from 'react';
import { useJourney } from '@/store/journey';
import './coach.css';

const SEEN_KEY = 'universe-touch-coach-v1';

/**
 * One-time gesture primer for touch visitors. Desktop gets a persistent
 * keyboard legend; a phone gives no such affordance, so the first visit
 * earns one card. It dismisses itself the moment any gesture works —
 * teaching is done the instant the lesson lands — and never returns.
 */
export function TouchCoach() {
  const [open, setOpen] = useState(() => {
    try {
      return !localStorage.getItem(SEEN_KEY);
    } catch {
      return false;
    }
  });

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* private mode — show it again next time, no harm */
    }
  };

  // First successful navigation = lesson learned.
  const region = useJourney((s) => s.region);
  useEffect(() => {
    if (open && region !== 'hero') dismiss();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);

  if (!open) return null;

  return (
    <div className="coach" role="note" aria-label="Touch controls">
      <p className="coach-title">FLIGHT CONTROLS</p>
      <ul className="coach-list">
        <li><span className="coach-g">SWIPE ↑ / ←</span> next stop</li>
        <li><span className="coach-g">SWIPE ↓ / →</span> previous stop</li>
        <li><span className="coach-g">TAP EMPTY SPACE</span> close / zoom out</li>
      </ul>
      <button type="button" className="coach-btn" onClick={dismiss}>
        GOT IT
      </button>
    </div>
  );
}
