import { useEffect } from 'react';

declare global {
  interface Window {
    /** Set once the reveal machinery is running; the inline head script's failsafe checks it and
        removes html.pv-js (so nothing stays hidden) if the app has not booted within 3s. */
    __pvBooted?: boolean;
  }
}

/** Observes every `.pv-rv` in the document for as long as the page lives (rootMargin
    '0px 0px -12% 0px', thresholds 0 and 0.12). Reversible: an element gets `.is-in` when it enters
    (or, if taller than the viewport, touches) the viewport, loses it when it leaves through the
    BOTTOM (the reader scrolled back up), and keeps it when it leaves through the top. Call once,
    in ProApp. Under prefers-reduced-motion, or when the head failsafe has already removed html.pv-js
    (late boot: content is visible and stays unanimated), it adds `.is-in` to everything
    immediately and never removes it. */
export function useReveal(): void {
  useEffect(() => {
    window.__pvBooted = true;
    const targets = Array.from(document.querySelectorAll<HTMLElement>('.pv-rv'));
    if (targets.length === 0) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gated = document.documentElement.classList.contains('pv-js');
    if (reduced || !gated || typeof IntersectionObserver === 'undefined') {
      for (const el of targets) el.classList.add('is-in');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target;
          const rootTop = entry.rootBounds?.top ?? 0;
          const rootBottom = entry.rootBounds?.bottom ?? window.innerHeight;
          const rootHeight = rootBottom - rootTop;
          const box = entry.boundingClientRect;
          if (entry.isIntersecting) {
            if (entry.intersectionRatio >= 0.12 || box.height > rootHeight) el.classList.add('is-in');
          } else if (box.top >= rootBottom) {
            el.classList.remove('is-in');
          } else if (box.bottom <= rootTop) {
            el.classList.add('is-in');
          }
        }
        // A jump (anchor link, End key) can carry an element from below the viewport to above it
        // without a state change the observer reports. Whenever it does report something, settle
        // every element that now sits above the viewport so scrolling back up never pops content in.
        for (const el of targets) {
          if (!el.classList.contains('is-in') && el.getBoundingClientRect().bottom <= 0) el.classList.add('is-in');
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: [0, 0.12] },
    );
    for (const el of targets) observer.observe(el);

    return () => observer.disconnect();
  }, []);
}
