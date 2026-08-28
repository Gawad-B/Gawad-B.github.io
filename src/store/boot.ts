import { create } from 'zustand';

/**
 * Boot progress.
 *
 * drei's useProgress tracks Three's LoadingManager, which is the right
 * answer for a scene with model and texture files. This build has none —
 * every surface is a procedural shader — so asset progress sits at zero
 * forever and would make the loading screen a lie.
 *
 * These are the steps that genuinely take time here, and each is marked
 * only when it has actually happened.
 */

export type BootStep = 'context' | 'sky' | 'region' | 'firstFrame' | 'warm';

const WEIGHT: Record<BootStep, number> = {
  context: 18,    // WebGL context acquired
  sky: 22,        // starfield + nebula geometry built
  region: 24,     // hero region module resolved and mounted
  firstFrame: 22, // something was actually drawn
  warm: 14,       // shader programs compiled, frame times settled
};

interface BootState {
  done: Record<BootStep, boolean>;
  progress: number;
  mark: (step: BootStep) => void;
}

export const useBoot = create<BootState>((set) => ({
  done: { context: false, sky: false, region: false, firstFrame: false, warm: false },
  progress: 0,
  mark: (step) =>
    set((s) => {
      if (s.done[step]) return s;
      const done = { ...s.done, [step]: true };
      const progress = (Object.keys(WEIGHT) as BootStep[]).reduce(
        (sum, k) => sum + (done[k] ? WEIGHT[k] : 0),
        0,
      );
      return { done, progress };
    }),
}));

/** Convenience for use outside React. */
export const markBoot = (step: BootStep) => useBoot.getState().mark(step);
