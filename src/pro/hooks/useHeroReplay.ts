import { useEffect, type RefObject } from 'react';

/** Class on the hero's red block while its entrance pieces are held invisible (see hero.css). */
export const HERO_RESET = 'pv-hero--reset';

/** The slowest hero entrance: 700ms delay + 250ms intro offset + 800ms animation, plus slack. */
const LAST_ENTRANCE_MS = 2000;
const POLL_MS = 200;
/** Share of the hero that must be back on screen before the entrance replays. */
const REPLAY_AT = 0.2;

/**
 * Replays the hero's load-time entrance when the reader scrolls back up to it.
 *
 * Armed only once the first entrance is over. When the hero is fully above the viewport its
 * entrance pieces are reset (animation removed, held at opacity 0); when at least 20% of it is
 * back in view the reset class is dropped, so every `.pv-enter` animation starts over with its
 * own delay. No reset again until the hero has left the viewport completely. Reduced motion, no
 * IntersectionObserver or no `html.pv-js`: does nothing, the hero just stays visible.
 */
export function useHeroReplay(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement;

    let observer: IntersectionObserver | null = null;
    let timer = 0;
    let isReset = false;

    const clear = () => {
      isReset = false;
      el.classList.remove(HERO_RESET);
    };

    const onEntries = (entries: IntersectionObserverEntry[]) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      if (!root.classList.contains('pv-js')) {
        // The head failsafe removed pv-js: never leave anything held back.
        clear();
        return;
      }
      const viewH = entry.rootBounds?.height ?? window.innerHeight;
      const shown = entry.intersectionRatio >= REPLAY_AT || entry.intersectionRect.height >= viewH * 0.5;
      if (entry.isIntersecting && shown) {
        // Replay (or safety net): in view and still held, so let the entrances run.
        if (isReset) clear();
      } else if (!entry.isIntersecting && entry.boundingClientRect.bottom <= 0 && !isReset) {
        isReset = true;
        el.classList.add(HERO_RESET);
      }
    };

    const arm = () => {
      observer = new IntersectionObserver(onEntries, {
        threshold: [0, 0.05, 0.1, REPLAY_AT, 0.35, 0.5, 0.75, 1],
      });
      observer.observe(el);
    };

    // Wait for the intro cover to open and the last entrance to end before arming.
    const waitForEntry = () => {
      if (!root.classList.contains('pv-js')) return;
      if (root.classList.contains('pv-intro') && !root.classList.contains('pv-entered')) {
        timer = window.setTimeout(waitForEntry, POLL_MS);
        return;
      }
      timer = window.setTimeout(arm, LAST_ENTRANCE_MS);
    };
    waitForEntry();

    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
      clear();
    };
  }, [ref]);
}
