import { useEffect, useState } from 'react';
import {
  useJourney,
  REGION_LABEL,
  REGION_DESIGNATION,
  type Region,
} from '@/store/journey';
import { MILANO } from '@/data/milano';
import { audioPreference, startAmbience, stopAmbience, blip } from '@/audio/ambience';
import './hud.css';

const NAV: Array<{ region: Region; index: string }> = [
  { region: 'hero', index: '01' },
  { region: 'about', index: '02' },
  { region: 'skills', index: '03' },
  { region: 'projects', index: '04' },
];

function AudioToggle() {
  const audioEnabled = useJourney((s) => s.audioEnabled);
  const toggleAudio = useJourney((s) => s.toggleAudio);
  const reducedMotion = useJourney((s) => s.reducedMotion);

  // Reduced motion means reduced everything. Never start a loop.
  if (reducedMotion) return null;

  return (
    <button
      type="button"
      className={`hud-audio hit${audioEnabled ? ' is-on' : ''}`}
      onClick={() => {
        if (audioEnabled) stopAmbience();
        else startAmbience();
        toggleAudio();
      }}
      aria-pressed={audioEnabled}
      aria-label={audioEnabled ? 'Mute ambient audio' : 'Unmute ambient audio'}
      title={audioEnabled ? 'Mute' : 'Unmute'}
    >
      <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M2 5.5h2.5L8 2.5v10L4.5 9.5H2z" />
        {audioEnabled ? (
          <>
            <path d="M10.5 5c.9.9.9 4.1 0 5" />
            <path d="M12.4 3.2c1.8 1.8 1.8 7 0 8.6" />
          </>
        ) : (
          <path d="M10.5 5.5l3 4M13.5 5.5l-3 4" />
        )}
      </svg>
    </button>
  );
}

/**
 * Spacecraft navigation, not a navbar. Sits bottom-left on desktop as an
 * instrument cluster; becomes a bottom bar on mobile. Every entry is a
 * real <button> with aria-current, so the whole universe is reachable
 * without ever clicking a mesh.
 */
export function HUD() {
  const region = useJourney((s) => s.region);
  const focus = useJourney((s) => s.focus);
  const phase = useJourney((s) => s.phase);
  const entered = useJourney((s) => s.entered);
  const milanoFound = useJourney((s) => s.milanoFound);
  const travelTo = useJourney((s) => s.travelTo);
  const enterMilano = useJourney((s) => s.enterMilano);
  const toggleAudio = useJourney((s) => s.toggleAudio);
  const audioEnabled = useJourney((s) => s.audioEnabled);
  const [clock, setClock] = useState('');

  // Restore the saved audio preference, but only after the first gesture —
  // browsers won't allow a context before that, and shouldn't.
  useEffect(() => {
    if (!audioPreference() || audioEnabled) return;
    const onFirstGesture = () => {
      startAmbience();
      toggleAudio();
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
    };
    window.addEventListener('pointerdown', onFirstGesture, { once: true });
    window.addEventListener('keydown', onFirstGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
    };
  }, [audioEnabled, toggleAudio]);

  // Mission clock. Reads as telemetry; costs one interval.
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(
        `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(
          d.getUTCSeconds(),
        ).padStart(2, '0')}`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const inShip = region === 'milano-interior';

  return (
    <>
      {/* --- Status readout: where you are, top-left --- */}
      <div className="hud-status" aria-hidden="true">
        <div className="hud-status-row">
          <span className="hud-key">POS</span>
          <span className="readout">{REGION_DESIGNATION[region]}</span>
        </div>
        <div className="hud-status-row">
          <span className="hud-key">UTC</span>
          <span className="readout">{clock}</span>
        </div>
        <div className="hud-status-row">
          <span className="hud-key">NAV</span>
          <span className={`readout${phase === 'traveling' ? ' is-active' : ''}`}>
            {phase === 'traveling' ? 'IN TRANSIT' : 'HOLDING'}
          </span>
        </div>
      </div>

      {/* Announce region changes to screen readers. */}
      <p className="spine-clipped" aria-live="polite">
        {phase === 'idle'
          ? `Arrived at ${REGION_LABEL[region]}${focus.id ? `, viewing ${focus.id}` : ''}`
          : ''}
      </p>

      {/* --- Navigation cluster --- */}
      <nav className="hud-nav" aria-label="Universe navigation">
        <ul>
          {NAV.map((item) => {
            const active = region === item.region;
            return (
              <li key={item.region}>
                <button
                  type="button"
                  className={`hud-nav-btn hit${active ? ' is-active' : ''}`}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => {
                    blip('select');
                    travelTo(item.region);
                  }}
                >
                  <span className="hud-nav-index">{item.index}</span>
                  <span className="hud-nav-label">{REGION_LABEL[item.region]}</span>
                  <span className="hud-nav-tick" aria-hidden="true" />
                </button>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              className={`hud-nav-btn hud-nav-btn--ship hit${inShip ? ' is-active' : ''}`}
              aria-current={inShip ? 'true' : undefined}
              onClick={() => {
                blip('approach');
                enterMilano();
              }}
            >
              <span className="hud-nav-index">05</span>
              <span className="hud-nav-label">
                {milanoFound ? REGION_LABEL['milano-interior'] : '· · · · ·'}
              </span>
              <span className="hud-nav-tick" aria-hidden="true" />
            </button>
          </li>
        </ul>
      </nav>

      {/* --- Right rail: audio + hints --- */}
      <div className="hud-rail">
        <AudioToggle />
        {entered && !milanoFound && region === 'skills' && (
          <p className="hud-hint" role="note">
            <span className="hud-hint-dot" aria-hidden="true" />
            {MILANO.marker} detected in the ring gap
          </p>
        )}
      </div>

      {/* --- Keyboard legend, desktop only --- */}
      <p className="hud-keys" aria-hidden="true">
        <kbd>↑</kbd><kbd>↓</kbd> travel · <kbd>1</kbd>–<kbd>5</kbd> jump · <kbd>Esc</kbd> back
      </p>
    </>
  );
}
