import { useEffect, useState } from 'react';

/** Returns the id of the section currently in view, from the given ids, using
    IntersectionObserver (no scroll listeners). null above the first section. */
export function useScrollSpy(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join('|');

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const order = key === '' ? [] : key.split('|');
    const sections = order
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    // The "reading line" is a thin band a little above the viewport middle: a section is
    // current while it crosses that band.
    const crossing = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) crossing.add(entry.target.id);
          else crossing.delete(entry.target.id);
        }
        const current = order.find((id) => crossing.has(id));
        if (current !== undefined) {
          setActive(current);
          return;
        }
        // Nothing crosses the line: above the first section, in a gap between two, or past the
        // last one (Contact, footer). Only the first and last cases clear the highlight.
        const first = sections[0];
        const last = sections[sections.length - 1];
        if (first && first.getBoundingClientRect().top > 0) setActive(null);
        else if (last && last.getBoundingClientRect().bottom <= window.innerHeight * 0.4) setActive(null);
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
    );
    for (const el of sections) observer.observe(el);

    return () => observer.disconnect();
  }, [key]);

  return active;
}
