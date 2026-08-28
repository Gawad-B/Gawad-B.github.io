import { useEffect, useRef } from 'react';
import { useJourney } from '@/store/journey';
import type { Tier } from '@/content/useCapabilities';

export interface QualityBudget {
  /** react-three-fiber dpr range. Capped below 2 even at high tier. */
  dpr: [number, number];
  /** fBm octaves handed to every planet shader. */
  octaves: number;
  stars: number;
  dust: number;
  nebulaBillboards: number;
  ringParticles: number;
  /** Sphere segment counts. */
  planetSegments: number;
  moonSegments: number;
  /** Whether the post-processing composer runs at all. */
  post: boolean;
  /** Bloom render-target divisor — 2 = half resolution. */
  bloomDivisor: number;
}

export const QUALITY: Record<Tier, QualityBudget> = {
  high: {
    dpr: [1, 1.75],
    octaves: 6,
    stars: 6000,
    dust: 1400,
    nebulaBillboards: 7,
    ringParticles: 9000,
    planetSegments: 96,
    moonSegments: 16,
    post: true,
    bloomDivisor: 2,
  },
  medium: {
    dpr: [1, 1.4],
    octaves: 4,
    stars: 3200,
    dust: 700,
    nebulaBillboards: 5,
    ringParticles: 4500,
    planetSegments: 64,
    moonSegments: 12,
    post: true,
    bloomDivisor: 3,
  },
  low: {
    dpr: [1, 1],
    octaves: 3,
    stars: 1400,
    dust: 0,
    nebulaBillboards: 3,
    ringParticles: 1800,
    planetSegments: 40,
    moonSegments: 8,
    post: false,
    bloomDivisor: 4,
  },
};

const NEXT_TIER_DOWN: Record<Tier, Tier | null> = { high: 'medium', medium: 'low', low: null };

/**
 * The static probe in useCapabilities is only a guess. This watches real
 * frame times and steps the tier down while the device can't keep up —
 * one step per measurement window (each window re-arms after the drop,
 * with its own warm-up, so a machine that needs low doesn't get stranded
 * at medium) — measured over a window so a single hitch (a region
 * mounting, a shader compiling) can't trigger it. It only ever steps
 * DOWN, so it cannot oscillate.
 */
/** An explicit ?tier= override wins over runtime measurement. */
function tierForced(): boolean {
  if (typeof location === 'undefined') return false;
  return new URLSearchParams(location.search).has('tier');
}

export function useAutoTier(enabled = true) {
  const tier = useJourney((s) => s.tier);
  const setTier = useJourney((s) => s.setTier);
  const samples = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled || tierForced()) return;
    samples.current = [];
    const next = NEXT_TIER_DOWN[tier];
    if (!next) return;

    let raf = 0;
    let last = performance.now();
    // Ignore the first second: mount and shader compilation live there.
    const startedAt = last;

    const loop = () => {
      const now = performance.now();
      const dt = now - last;
      last = now;

      if (now - startedAt > 1000) {
        samples.current.push(dt);
        if (samples.current.length >= 90) {
          const sorted = [...samples.current].sort((a, b) => a - b);
          const median = sorted[Math.floor(sorted.length / 2)] ?? 16;
          samples.current = [];
          // 25ms median ≈ 40fps sustained. Stepping down changes `tier`,
          // which re-runs this effect with a fresh warm-up window.
          if (median > 25) {
            setTier(next);
            return;
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [enabled, tier, setTier]);
}
