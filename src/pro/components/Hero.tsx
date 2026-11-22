import { useRef, type CSSProperties } from 'react';
import { useHeroReplay } from '../hooks/useHeroReplay';
import './hero.css';
import { PERSONAL } from '@/data/personal';
import { PRO, RESUME_URL } from '../content';
import { PORTRAIT } from '../assets';
import { CountUp } from './CountUp';
import {
  IconArrowDown,
  IconArrowUpRight,
  IconAsterisk,
  IconDownload,
  IconGitHub,
  IconLinkedIn,
  IconMail,
} from './icons';
import { UniverseGate } from './UniverseGate';

const SOCIALS = [
  { label: 'GitHub', href: PERSONAL.contact.github, external: true, icon: <IconGitHub size={14} /> },
  { label: 'LinkedIn', href: PERSONAL.contact.linkedin, external: true, icon: <IconLinkedIn size={14} /> },
  { label: 'Email', href: `mailto:${PERSONAL.contact.email}`, external: false, icon: <IconMail size={14} /> },
];

/** Load-sequence delay for `.pv-enter`, in ms. */
const at = (ms: number) => ({ ['--pv-d' as string]: String(ms) }) as CSSProperties;

/** Crossings of the construction grid: four column edges x two rows. */
const PLUSES = [0, 1, 2, 3].flatMap((col) => [0, 1].map((row) => ({ col, row })));

export function Hero() {
  const { hero, nav } = PRO;
  const showPortrait = PORTRAIT.ready;
  const [first = hero.name, ...rest] = hero.name.split(' ');
  const redRef = useRef<HTMLDivElement>(null);
  useHeroReplay(redRef);

  return (
    <section className={`pv-hero${showPortrait ? '' : ' pv-hero--bare'}`}>
      <div ref={redRef} className="pv-hero__red pv-on-dark">
        <span id="pv-nav-sentinel" className="pv-hero__sentinel" aria-hidden="true" />

        <div className="pv-hero__grid" aria-hidden="true">
          {PLUSES.map(({ col, row }) => (
            <span
              key={`${col}-${row}`}
              className="pv-hero__plus"
              style={{ ['--col' as string]: String(col), ['--row' as string]: String(row) } as CSSProperties}
            />
          ))}
        </div>

        <div className="pv-hero__stage pv-container">
          <div className="pv-hero__back" aria-hidden="true">
            <span className="pv-hero__giant pv-enter pv-enter--fade" style={at(150)}>
              {hero.giant}
            </span>
          </div>

          <div className="pv-hero__lower">
            <h1 className="pv-hero__name pv-enter" style={at(0)}>
              <span>{first}</span> <span>{rest.join(' ')}</span>
            </h1>
            <p className="pv-hero__status pv-enter" style={at(60)}>
              <IconAsterisk size={12} />
              {hero.status}
            </p>
          </div>

          <div className="pv-hero__upper">
            <p className="pv-blurb pv-hero__blurb pv-enter" style={at(220)}>
              {hero.headline.before}
              <span className="pv-hero__accent">{hero.headline.accent}</span>
              {hero.headline.after}
            </p>

            {/* pv-lead, pv-btn--primary and pv-btn--ghost are the hooks qa/pro.py looks for. */}
            <p className="pv-lead pv-hero__sub pv-enter" style={at(300)}>
              {hero.sub}
            </p>

            <div className="pv-hero__ctas pv-enter" style={at(380)}>
              <a className="pv-btn pv-btn--primary pv-btn--on-red" href="#projects">
                <span>{hero.ctaProjects}</span>
                <span className="pv-btn__icon">
                  <IconArrowDown size={14} />
                </span>
              </a>
              <a className="pv-btn pv-btn--ghost pv-btn--on-red pv-btn--outline" href={RESUME_URL} download>
                <span>{hero.ctaResume}</span>
                <span className="pv-btn__icon">
                  <IconDownload size={14} />
                </span>
              </a>
            </div>
          </div>

          {showPortrait ? (
            <div className="pv-hero__figure">
              <img
                className="pv-hero__portrait pv-enter pv-enter--fade"
                style={at(320)}
                src={PORTRAIT.src}
                width={PORTRAIT.width}
                height={PORTRAIT.height}
                alt={PORTRAIT.alt}
                decoding="async"
                {...({ fetchpriority: 'high' } as object)}
              />
            </div>
          ) : null}

          <div className="pv-hero__card pv-enter" style={at(560)}>
            <UniverseGate variant="card" />
          </div>

          <div className="pv-hero__side">
            <a className="pv-hero__mini pv-enter" style={at(640)} href="#contact">
              <span className="pv-hero__mono" aria-hidden="true">
                {nav.monogram}
              </span>
              <span className="pv-hero__mini-text">
                <span className="pv-hero__mini-talk">{hero.talk}</span>
                <span className="pv-hero__mini-name">{hero.name}</span>
                <span className="pv-hero__mini-title">{hero.title}</span>
              </span>
              <span className="pv-hero__mini-arrow" aria-hidden="true">
                <IconArrowUpRight size={14} />
              </span>
            </a>

            <ul className="pv-hero__socials pv-enter" style={at(700)} role="list">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a
                    className="pv-hero__social"
                    href={s.href}
                    {...(s.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {s.icon}
                    {s.label}
                    {s.external ? <span className="pv-vh"> (opens in a new tab)</span> : null}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="pv-hero__strip">
        <div className="pv-hero__strip-in pv-container">
          <span className="pv-label pv-hero__strip-label">
            <IconAsterisk size={12} /> {hero.proofsLabel}
          </span>
          <ul className="pv-hero__proofs" role="list">
            {hero.proofs.map((proof, i) => (
              <li
                key={proof.value}
                className="pv-hero__proof pv-rv"
                style={{ ['--pv-i' as string]: String(i) } as CSSProperties}
              >
                <CountUp value={proof.value} className="pv-hero__proof-n" />
                <span className="pv-hero__proof-label">{proof.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
