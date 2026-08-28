import { useEffect, useRef } from 'react';
import { useJourney } from '@/store/journey';
import { blip } from '@/audio/ambience';

/**
 * Wheel and swipe move between sections, one stop per gesture.
 *
 * The page itself never scrolls (body overflow is hidden in 3D mode), so
 * the wheel is free to be a navigation control. Two rules keep it sane:
 *
 * - A gesture inside anything that genuinely scrolls (panel bodies, the
 *   mobile manifest, the monitor screen, form fields) is left alone —
 *   hijacking the wheel inside a scrollable dossier would be hostile.
 * - One step per gesture: deltas accumulate to a threshold, fire once,
 *   then lock until the flight lands plus a beat. Trackpads emit dozens
 *   of small events per flick; without the lock one flick = three stops.
 */

const SCROLLABLE_SELECTOR = '.mf';
const ALWAYS_GUARDED = 'input, textarea, select, .mon-screen, .pnl, .dos-card';

const WHEEL_THRESHOLD = 110;
const SWIPE_THRESHOLD = 64;
const SETTLE_MS = 450;

/**
 * A gesture is left alone on any reading surface — panels, the dossier,
 * the ship's monitor, form controls — whether or not it currently
 * scrolls: yanking someone to another section mid-paragraph is hostile.
 * The manifest guards only when it genuinely has overflow to scroll,
 * because on desktop it usually doesn't, and a wheel over the nav rail
 * should still turn the page.
 */
function guarded(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el?.closest) return false;
  if (el.closest(ALWAYS_GUARDED)) return true;
  const container = el.closest<HTMLElement>(SCROLLABLE_SELECTOR);
  if (!container) return false;
  return (
    container.scrollHeight > container.clientHeight + 4 ||
    container.scrollWidth > container.clientWidth + 4
  );
}

export function useScrollNav(enabled = true) {
  const advance = useJourney((s) => s.advance);
  const acc = useRef(0);
  const lockUntil = useRef(0);
  const touch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fire = (dir: 1 | -1) => {
      const { phase } = useJourney.getState();
      const now = performance.now();
      if (phase !== 'idle' || now < lockUntil.current) return;
      lockUntil.current = now + SETTLE_MS + 900; // flight time guards the rest
      acc.current = 0;
      blip('select');
      advance(dir);
    };

    const onWheel = (e: WheelEvent) => {
      if (guarded(e.target)) return;
      const { phase } = useJourney.getState();
      if (phase !== 'idle' || performance.now() < lockUntil.current) {
        acc.current = 0;
        return;
      }
      // Normalise line-mode deltas (Firefox) to pixel-ish values.
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      // Direction flip resets the run-up.
      if (Math.sign(dy) !== Math.sign(acc.current)) acc.current = 0;
      acc.current += dy;
      if (Math.abs(acc.current) >= WHEEL_THRESHOLD) fire(acc.current > 0 ? 1 : -1);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (guarded(e.target)) {
        touch.current = null;
        return;
      }
      const t = e.touches[0];
      touch.current = t ? { x: t.clientX, y: t.clientY } : null;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const start = touch.current;
      touch.current = null;
      const t = e.changedTouches[0];
      if (!start || !t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      // Vertical intent only — the mobile manifest scrolls horizontally.
      if (Math.abs(dy) < SWIPE_THRESHOLD || Math.abs(dy) < Math.abs(dx) * 1.4) return;
      // Swipe up = move forward, matching page-scroll instinct.
      fire(dy < 0 ? 1 : -1);
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [enabled, advance]);
}
