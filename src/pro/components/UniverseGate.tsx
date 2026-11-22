import './gate.css';
import { PRO, UNIVERSE_URL } from '../content';
import { UNIVERSE_THUMB } from '../assets';
import { onWipeLinkClick } from '../hooks/wipe';
import { IconArrowUpRight, IconAsterisk } from './icons';

let prefetched = false;

/** Warm the universe page once, on the first intent to visit it. Runs from event
    handlers only, so nothing touches the document during render. */
function prefetchUniverse(): void {
  if (prefetched) return;
  prefetched = true;
  if (document.head.querySelector(`link[rel="prefetch"][href="${UNIVERSE_URL}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = UNIVERSE_URL;
  document.head.appendChild(link);
}

const linkProps = {
  href: UNIVERSE_URL,
  onPointerEnter: prefetchUniverse,
  onFocus: prefetchUniverse,
  onClick: onWipeLinkClick,
};

export function UniverseGate({ variant }: { variant: 'card' | 'switch' | 'line' }) {
  const u = PRO.universe;

  if (variant === 'switch') {
    return (
      <div className="pv-gate pv-gate--switch" role="group" aria-label="View">
        <span className="pv-gate__seg is-active" aria-current="page">
          {u.switchPro}
        </span>
        <a className="pv-gate__seg" {...linkProps}>
          {u.switchUniverse}
        </a>
      </div>
    );
  }

  if (variant === 'line') {
    return (
      <p className="pv-gate pv-gate--line">
        <span className="pv-gate__line-text">{u.line}</span>{' '}
        <a className="pv-link pv-gate__link" {...linkProps}>
          {u.cta}
          <IconArrowUpRight size={16} />
        </a>
      </p>
    );
  }

  return (
    <a className="pv-gate pv-gate--card pv-frame" {...linkProps}>
      <span className="pv-frame__media pv-gate__media" aria-hidden="true">
        <img
          className="pv-gate__thumb"
          src={UNIVERSE_THUMB.src}
          width={UNIVERSE_THUMB.width}
          height={UNIVERSE_THUMB.height}
          alt=""
          decoding="async"
        />
      </span>
      <span className="pv-frame__cap" aria-hidden="true">
        <span>
          <IconAsterisk size={12} /> Universe
        </span>
        <span>{u.tag}</span>
      </span>
      <span className="pv-gate__cta">
        {u.cta}
        <IconArrowUpRight size={13} />
        <span className="pv-vh">. {u.text}</span>
      </span>
    </a>
  );
}
