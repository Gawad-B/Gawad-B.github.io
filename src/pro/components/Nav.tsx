import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import './nav.css';
import { PRO, RESUME_URL } from '../content';
import { useScrollSpy } from '../hooks/useScrollSpy';
import { IconAsterisk, IconClose, IconDownload, IconMenu } from './icons';
import { UniverseGate } from './UniverseGate';

const SECTION_IDS = PRO.nav.links.map((l) => l.id);
const MENU_ID = 'pv-nav-menu';
/** Scrolling past this many px turns the transparent bar into the solid orange one. */
const SCROLL_THRESHOLD = 8;
/** Arrives last in the hero's load sequence. */
const ENTER_AT = { ['--pv-d' as string]: '700' } as CSSProperties;

export function Nav() {
  const { nav } = PRO;
  const active = useScrollSpy(SECTION_IDS);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  const closeMenu = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus({ preventScroll: true });
  }, []);

  // `is-scrolled` follows a sentinel at the top of the document leaving the viewport (no scroll listener).
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    Object.assign(sentinel.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '1px',
      height: `${SCROLL_THRESHOLD}px`,
      pointerEvents: 'none',
      visibility: 'hidden',
    });
    document.body.prepend(sentinel);
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry) setScrolled(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      sentinel.remove();
    };
  }, []);

  // The menu only exists below 860px; leaving that range closes it.
  useEffect(() => {
    const query = window.matchMedia('(min-width: 860px)');
    const onChange = () => {
      if (query.matches) setOpen(false);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    firstLinkRef.current?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu(true);
    };
    const onPointerDown = (event: PointerEvent) => {
      const header = headerRef.current;
      if (header && event.target instanceof Node && !header.contains(event.target)) closeMenu(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, closeMenu]);

  // `inert` is not in React 18's typings; the empty string renders the bare attribute.
  const sheetAttrs: Record<string, string> = open ? {} : { inert: '' };
  const brand = PRO.hero.name.split(' ').at(-1) ?? PRO.hero.name;

  return (
    <header
      ref={headerRef}
      className={`pv-nav pv-on-dark${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}
    >
      <div className="pv-nav__bar pv-container pv-enter pv-enter--drop" style={ENTER_AT}>
        <a
          className="pv-nav__brand"
          href="#main"
          aria-label={`${PRO.hero.name}, top of page`}
          onClick={() => closeMenu(false)}
        >
          {brand}
          <IconAsterisk size={14} />
        </a>

        <nav className="pv-nav__links" aria-label="Sections">
          <ul className="pv-nav__list" role="list">
            {nav.links.map((link) => (
              <li key={link.id}>
                <a
                  className="pv-nav__link"
                  href={link.href}
                  aria-current={active === link.id ? 'true' : undefined}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="pv-nav__end">
          <a
            className={`pv-btn pv-btn--sm pv-btn--on-red pv-nav__resume`}
            href={RESUME_URL}
            download
            aria-label={`${nav.resumeLabel} (PDF)`}
          >
            <span>{nav.resumeLabel}</span>
            <span className="pv-btn__icon">
              <IconDownload size={13} />
            </span>
          </a>
          <div className="pv-nav__switch">
            <UniverseGate variant="switch" />
          </div>
          <button
            ref={buttonRef}
            type="button"
            className="pv-nav__menu"
            aria-expanded={open}
            aria-controls={MENU_ID}
            aria-label="Menu"
            onClick={() => (open ? closeMenu(true) : setOpen(true))}
          >
            {open ? <IconClose size={20} /> : <IconMenu size={20} />}
          </button>
        </div>
      </div>

      <div id={MENU_ID} className={`pv-nav__sheet${open ? ' is-open' : ''}`} {...sheetAttrs}>
        <nav aria-label="Sections">
          <ul className="pv-nav__sheet-list" role="list">
            {nav.links.map((link, i) => (
              <li key={link.id}>
                <a
                  ref={i === 0 ? firstLinkRef : undefined}
                  className="pv-nav__sheet-link"
                  href={link.href}
                  aria-current={active === link.id ? 'true' : undefined}
                  onClick={() => closeMenu(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="pv-nav__sheet-switch">
          <UniverseGate variant="switch" />
        </div>
      </div>
    </header>
  );
}
