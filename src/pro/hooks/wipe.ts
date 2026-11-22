import type { MouseEvent } from 'react';

/* The wipe is static HTML + inline CSS emitted by qa/write-head.py (`.pv-wipe`, five spans), so it
   can cover the screen from the very first paint. States, all driven by classes:
     html.pv-intro            covered (set by the inline head script on every entry except
                              back/forward and reduced motion)
     html.pv-intro.pv-open    opening, staggered (startIntro below)
     .pv-wipe.is-covering     covering before leaving the page (wipeTo below)
   The 3s head failsafe removes pv-intro if the app never boots, which opens the columns too. */

const STAGGER_MS = 4 * 60;
const COVER_MS = 420 + STAGGER_MS;
const FONT_WAIT_MS = 400;
const OPEN_FALLBACK_MS = 900;

function wipeEl(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.pv-wipe');
}

/** Calls `done` once, when the last column's transform transition ends or after `ms`. */
function afterLastColumn(wipe: HTMLElement | null, ms: number, done: () => void): void {
  let fired = false;
  const finish = () => {
    if (fired) return;
    fired = true;
    done();
  };
  wipe?.lastElementChild?.addEventListener('transitionend', (ev) => {
    if ((ev as TransitionEvent).propertyName === 'transform') finish();
  });
  window.setTimeout(finish, ms);
}

let introStarted = false;

/** Opens the entry cover once the app is alive: waits for the fonts (at most 400ms), adds
    html.pv-open on the next frame, then clears pv-intro/pv-open when the last column has opened.
    Also makes sure a page restored from the bfcache is never left covered. Call once, from an
    effect; later calls do nothing. */
export function startIntro(): void {
  if (introStarted) return;
  introStarted = true;
  const root = document.documentElement;

  window.addEventListener('pageshow', (ev: PageTransitionEvent) => {
    if (!ev.persisted) return;
    wipeEl()?.classList.remove('is-covering');
    root.classList.remove('pv-intro', 'pv-open', 'pv-entered');
  });

  if (!root.classList.contains('pv-intro')) return;

  const fonts: Promise<unknown> =
    'fonts' in document ? document.fonts.ready : Promise.resolve();
  const capped = new Promise<void>((resolve) => {
    window.setTimeout(resolve, FONT_WAIT_MS);
  });

  void Promise.race([fonts, capped]).then(() => {
    window.requestAnimationFrame(() => {
      // The head failsafe may already have uncovered the page.
      if (!root.classList.contains('pv-intro')) return;
      root.classList.add('pv-open');
      afterLastColumn(wipeEl(), OPEN_FALLBACK_MS, () => {
        // pv-entered keeps the hero's +250ms entrance delay in place, so dropping pv-open does not
        // shift entrance animations that are still running.
        root.classList.add('pv-entered');
        root.classList.remove('pv-intro', 'pv-open');
      });
    });
  });
}

/** Covers the screen with the wipe columns, then navigates. Reduced motion, or no wipe in the DOM:
    navigates at once. */
export function wipeTo(href: string): void {
  const wipe = wipeEl();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!wipe || reduced) {
    window.location.assign(href);
    return;
  }
  if (wipe.classList.contains('is-covering')) return;

  // An entry intro still running would fight the cover; settle it first.
  document.documentElement.classList.remove('pv-intro', 'pv-open');
  void wipe.offsetHeight;
  afterLastColumn(wipe, COVER_MS + 480, () => window.location.assign(href));
  wipe.classList.add('is-covering');
}

/** Click handler for links that leave for another page: plays the wipe first. Lets the browser
    handle modified clicks, other mouse buttons and links with a target. */
export function onWipeLinkClick(e: MouseEvent<HTMLAnchorElement>): void {
  if (e.defaultPrevented || e.button !== 0) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.currentTarget;
  if (a.target && a.target !== '_self') return;
  e.preventDefault();
  wipeTo(a.href);
}
