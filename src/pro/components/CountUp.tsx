import { useEffect, useRef } from 'react';

const DURATION = 1100;

interface Parsed {
  prefix: string;
  suffix: string;
  target: number;
  decimals: number;
  grouped: boolean;
}

function parse(value: string): Parsed | null {
  const m = /^(\D*)(\d[\d,]*(?:\.\d+)?)([\s\S]*)$/.exec(value);
  if (!m) return null;
  const [, prefix = '', raw = '', suffix = ''] = m;
  if (!raw) return null;
  const dot = raw.indexOf('.');
  return {
    prefix,
    suffix,
    target: Number(raw.replace(/,/g, '')),
    decimals: dot === -1 ? 0 : raw.length - dot - 1,
    grouped: raw.includes(','),
  };
}

const ORDINAL = /^(st|nd|rd|th)$/i;

/** English ordinal ending for the whole number n, in the letter case of `like`. */
function ordinalEnding(n: number, like: string): string {
  const lastTwo = n % 100;
  const last = n % 10;
  let end = 'th';
  if (lastTwo < 11 || lastTwo > 13) {
    if (last === 1) end = 'st';
    else if (last === 2) end = 'nd';
    else if (last === 3) end = 'rd';
  }
  if (like === like.toUpperCase()) return end.toUpperCase();
  if (like.charAt(0) === like.charAt(0).toUpperCase()) return end.charAt(0).toUpperCase() + end.slice(1);
  return end;
}

function format(p: Parsed, n: number): string {
  // "76th" counts as 1st, 2nd, 3rd, 4th … 31st, 43rd. The final frame keeps the original suffix.
  const suffix =
    p.decimals === 0 && ORDINAL.test(p.suffix) && Math.round(n) !== p.target
      ? ordinalEnding(Math.round(n), p.suffix)
      : p.suffix;
  return (
    p.prefix +
    n.toLocaleString('en-US', {
      minimumFractionDigits: p.decimals,
      maximumFractionDigits: p.decimals,
      useGrouping: p.grouped,
    }) +
    suffix
  );
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** Stat that counts up when it scrolls into view. The server and first client render show the
    final value; the number is updated in place (no React state) so hydration always matches. */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parsed = parse(value);
    // Without html.pv-js (no-JS head, or the boot failsafe fired) the final value stays as rendered.
    const canObserve =
      document.documentElement.classList.contains('pv-js') &&
      typeof IntersectionObserver !== 'undefined' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!parsed || !canObserve) {
      el.classList.add('is-on');
      return;
    }

    const node = el.firstChild;
    let raf = 0;
    let counted = false; // true from the moment a count starts until the element leaves through the bottom
    const settle = () => {
      cancelAnimationFrame(raf);
      if (node) node.nodeValue = value;
      el.classList.add('is-on');
    };
    if (node) node.nodeValue = format(parsed, 0);

    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          const rootTop = en.rootBounds?.top ?? 0;
          const rootBottom = en.rootBounds?.bottom ?? window.innerHeight;
          if (en.isIntersecting) {
            if (counted || en.intersectionRatio < 0.6) continue;
            counted = true;
            cancelAnimationFrame(raf);
            el.classList.add('is-on');
            const t0 = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - t0) / DURATION);
              if (node) node.nodeValue = format(parsed, parsed.target * easeOutExpo(t));
              if (t < 1) raf = requestAnimationFrame(tick);
            };
            if (node) node.nodeValue = format(parsed, 0);
            raf = requestAnimationFrame(tick);
          } else if (en.boundingClientRect.top >= rootBottom) {
            // Left (or never reached) through the bottom: show the final value and re-arm.
            counted = false;
            settle();
          } else if (en.boundingClientRect.bottom <= rootTop) {
            // Scrolled past: stays as it is, never counts backwards or re-counts.
            counted = true;
            settle();
          }
        }
      },
      { threshold: [0, 0.6] },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      if (node) node.nodeValue = value;
    };
  }, [value]);

  return (
    <span className={className ? `pv-count ${className}` : 'pv-count'}>
      <span ref={ref} className="pv-count__n" aria-hidden="true" style={{ minWidth: `${value.length}ch` }}>
        {value}
      </span>
      <span className="pv-vh">{value}</span>
    </span>
  );
}
