import { useEffect, useRef, useState } from 'react';
import { useBoot } from '@/store/boot';
import './loading.css';

/**
 * Real progress, no theatre.
 *
 * There are no assets to load — every surface in this build is a
 * procedural shader — so an asset-progress bar would sit at zero and then
 * jump to done. Instead this tracks the steps that genuinely take time:
 * acquiring the WebGL context, building the sky, resolving the hero
 * region's module, drawing the first frame, and shader compilation
 * settling. The sequence is exactly as long as the boot is.
 */

const PHASES: Array<{ at: number; line: string }> = [
  { at: 0, line: 'INITIALIZING SYSTEM' },
  { at: 25, line: 'CALIBRATING ORBITS' },
  { at: 55, line: 'LOADING WORLDS' },
  { at: 82, line: 'CONTACTING MILANO' },
];

const ARRIVAL = 'WELCOME, TRAVELER.';

export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const progress = useBoot((s) => s.progress);
  const [shown, setShown] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const raf = useRef(0);

  /* Ease the displayed number toward the real one. Asset progress arrives
     in jumps; a bar that teleports reads as fake even when it's honest. */
  useEffect(() => {
    const tick = () => {
      setShown((s) => {
        const target = progress;
        const next = s + (target - s) * 0.12;
        return Math.abs(target - s) < 0.4 ? target : next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [progress]);

  /* Hold the arrival line just long enough to read, then get out of the
     way.
     This effect must depend on a value that flips exactly once. Depending
     on `shown` looks natural and is wrong: it keeps ticking after the
     threshold is crossed (99.7 → 100), and each change runs the cleanup,
     which cancels the timers that were just scheduled. `ready` goes
     false→true and stays there. */
  const ready = shown >= 99.5;
  useEffect(() => {
    if (!ready) return;
    setArrived(true);
    const toLeave = setTimeout(() => setLeaving(true), 620);
    const toDone = setTimeout(onDone, 1180);
    return () => {
      clearTimeout(toLeave);
      clearTimeout(toDone);
    };
  }, [ready, onDone]);

  const phase = [...PHASES].reverse().find((p) => shown >= p.at) ?? PHASES[0]!;
  const pct = Math.round(shown);

  return (
    <div className={`ld${leaving ? ' ld--leaving' : ''}`} role="status" aria-live="polite">
      {/* The star: a point of light that grows and ignites with progress. */}
      <div className="ld-stage" aria-hidden="true">
        <div className="ld-halo" style={{ opacity: pct / 190, transform: `scale(${0.4 + pct / 90})` }} />
        <div
          className="ld-core"
          style={{
            transform: `scale(${0.06 + (pct / 100) * 0.94})`,
            filter: `brightness(${0.5 + pct / 90})`,
          }}
        />
        <div className="ld-ring" style={{ opacity: pct > 12 ? 0.4 : 0 }} />
      </div>

      <div className="ld-readout">
        <p className="ld-phase">
          {arrived ? ARRIVAL : `${phase.line}…`}
        </p>
        <div className="ld-bar">
          <span style={{ width: `${pct}%` }} />
        </div>
        <p className="ld-pct readout">
          {String(pct).padStart(3, '0')}<span className="ld-pct-unit">%</span>
        </p>
      </div>
    </div>
  );
}
