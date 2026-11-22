import { useEffect, useState } from 'react';
import { useJourney, REGION_LABEL, REGION_DESIGNATION } from '@/store/journey';
import { MILANO } from '@/data/milano';
import { audioPreference, startAmbience, stopAmbience } from '@/audio/ambience';
import './hud.css';

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

      {/* --- Right rail: exit to the professional view, audio, hints --- */}
      <div className="hud-rail">
        <a className="hud-exit hit" href="/" aria-label="Professional view" title="Professional view">
          <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M9 2.5h3.5V6M12.5 2.5L7 8" />
            <path d="M10.5 9v3.5h-8v-8H6" />
          </svg>
          <span className="hud-exit-label">Professional view</span>
        </a>
        <AudioToggle />
        {entered && !milanoFound && region === 'projects' && (
          <p className="hud-hint" role="note">
            <span className="hud-hint-dot" aria-hidden="true" />
            {MILANO.marker} — docking beacon past the belt
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
