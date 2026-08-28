import { useEffect, useState } from 'react';
import { PERSONAL } from '@/data/personal';
import { WORLDS } from '@/data/worlds';
import { useJourney } from '@/store/journey';
import { blip } from '@/audio/ambience';
import './hero.css';

const STAR = WORLDS['stephenson-2-18'];

export function HeroOverlay() {
  const travelTo = useJourney((s) => s.travelTo);
  const reducedMotion = useJourney((s) => s.reducedMotion);
  const [roleIndex, setRoleIndex] = useState(0);

  // Rotate the role line — but hold still under reduced motion.
  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => {
      setRoleIndex((i) => (i + 1) % PERSONAL.roles.length);
    }, 3400);
    return () => clearInterval(id);
  }, [reducedMotion]);

  return (
    <div className="hero">
      {/* Scrim: the photosphere fills most of the frame, so the text
          column needs its own ground to stay legible over it. */}
      <div className="hero-scrim" aria-hidden="true" />

      <div className="hero-inner">
        <p className="hero-locale">
          {PERSONAL.location} · {PERSONAL.institutionShort}
        </p>
        <p className="eyebrow hero-eyebrow">{STAR.designation} · 2150 R☉</p>

        {/* The real <h1> lives in ContentSpine; this is the visual title. */}
        <p className="hero-name" aria-hidden="true">
          {PERSONAL.name}
        </p>

        <div className="hero-role-slot">
          {reducedMotion ? (
            <p className="hero-role">{PERSONAL.roles.join(' · ')}</p>
          ) : (
            <p key={roleIndex} className="hero-role hero-role--cycling">
              {PERSONAL.roles[roleIndex]}
            </p>
          )}
        </div>

        <p className="hero-intro">{PERSONAL.intro}</p>

        <button
          type="button"
          className="hero-cta hit"
          onClick={() => {
            blip('approach');
            travelTo('about');
          }}
        >
          <span>Enter the universe</span>
          <span className="hero-cta-icon" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4.2M9.5 2.5V7.8" />
            </svg>
          </span>
        </button>

      </div>
    </div>
  );
}
