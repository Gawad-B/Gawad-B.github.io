import { create } from 'zustand';

/**
 * Screen-space hover readout, kept in its own store rather than in the
 * journey store. It updates at 30Hz while the pointer is over a target, and
 * putting that in the navigation store would re-render every HUD subscriber
 * thirty times a second for a floating label.
 */
export interface HoverTarget {
  id: string;
  label: string;
  sub: string;
  accent: string;
  /** CSS pixels. */
  x: number;
  y: number;
}

interface HoverState {
  target: HoverTarget | null;
  setTarget: (t: HoverTarget | null) => void;
}

export const useHover = create<HoverState>((set) => ({
  target: null,
  setTarget: (target) => set({ target }),
}));

export const setHoverTarget = (t: HoverTarget | null) => useHover.getState().setTarget(t);
