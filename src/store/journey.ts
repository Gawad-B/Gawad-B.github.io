import { create } from 'zustand';
import type { Tier } from '@/content/useCapabilities';

export type Region =
  | 'hero'
  | 'system'
  | 'about'
  | 'skills'
  | 'projects'
  | 'milano-interior';

export type FocusKind = 'none' | 'project' | 'skill' | 'milano';

export interface Focus {
  kind: FocusKind;
  id?: string;
}

/** Boarding the ship is a sequence, not a teleport: fly to the parked
    vessel, hold on it, then push into the canopy under the airlock veil. */
export type Docking = null | 'approach' | 'ingress';

/** One-shot camera instruction, consumed non-reactively by the rig:
    'snap' cuts (used under the veil), 'from-ship' restarts the camera at
    the ship's hull so a departure flight begins where the ship really is. */
export type CameraCue = null | 'snap' | 'from-ship';

/** HUD button order. The overview isn't a button — it's the zoomed-out
    stop between Home and About that ENTER THE UNIVERSE reveals. */
export const REGION_ORDER: Region[] = ['hero', 'about', 'skills', 'projects'];

/** What scrolling (and ↑/↓) traverses, in order. One list, one truth:
    wheel, swipe and arrows all walk this. */
export const SCROLL_ORDER: Region[] = [
  'hero',
  'system',
  'about',
  'skills',
  'projects',
  'milano-interior',
];

export const REGION_LABEL: Record<Region, string> = {
  hero: 'Home',
  system: 'System',
  about: 'About',
  skills: 'Skills',
  projects: 'Projects',
  'milano-interior': 'Contact',
};

/** Mono designation shown in the HUD readout. */
export const REGION_DESIGNATION: Record<Region, string> = {
  hero: 'STEPHENSON 2-18',
  system: 'HELIOCENTRIC SURVEY',
  about: 'HD 189733 b',
  skills: 'SOL VI · SATURN',
  projects: 'EXOPLANET BELT',
  'milano-interior': 'THE MILANO · INTERIOR',
};

interface JourneyState {
  region: Region;
  focus: Focus;
  phase: 'loading' | 'idle' | 'traveling';
  tier: Tier;
  reducedMotion: boolean;
  audioEnabled: boolean;
  /** True once the visitor has left the hero. */
  entered: boolean;
  /** True once they've found the ship, so the HUD can stop teasing it. */
  milanoFound: boolean;
  /** Which skill band is isolated in the HUD selector; null = all. */
  isolatedBand: string | null;
  /** Stage of the Milano boarding sequence; null when not boarding. */
  docking: Docking;
  /** Airlock cross-fade covering the exterior↔interior camera swap. */
  veil: boolean;
  cameraCue: CameraCue;

  travelTo: (region: Region) => void;
  focusOn: (kind: Exclude<FocusKind, 'none'>, id: string) => void;
  clearFocus: () => void;
  enterMilano: () => void;
  /** Leave the vessel. Defaults to where it's parked (skills); the scroll
      path passes 'projects' so scrolling back up stays reversible. */
  exitMilano: (to?: Region) => void;
  beginIngress: () => void;
  commitBoard: () => void;
  /** Called by the interior after its first real frames. */
  lowerVeil: () => void;
  raiseVeil: () => void;
  consumeCameraCue: () => void;
  isolateBand: (groupId: string | null) => void;
  beginTravel: () => void;
  endTravel: () => void;
  setTier: (tier: Tier) => void;
  setReducedMotion: (v: boolean) => void;
  toggleAudio: () => void;
  finishLoading: () => void;
  /** Advance/retreat through SCROLL_ORDER — wheel, swipe and arrows. */
  advance: (delta: 1 | -1) => void;
}

/** The ship is parked in Saturn's rings, so leaving it returns there. */
const MILANO_HOME: Region = 'skills';

/* The boarding/exit sequences hold short timers (veil up → swap → veil
   down). Any direct navigation must cancel them, or a stale timer would
   yank the veil around a flight it no longer belongs to. */
let veilTimer: ReturnType<typeof setTimeout> | undefined;
let exitTimer: ReturnType<typeof setTimeout> | undefined;
function clearSequenceTimers() {
  clearTimeout(veilTimer);
  clearTimeout(exitTimer);
}

export const useJourney = create<JourneyState>((set, get) => ({
  region: 'hero',
  focus: { kind: 'none' },
  phase: 'loading',
  tier: 'high',
  reducedMotion: false,
  audioEnabled: false,
  entered: false,
  milanoFound: false,
  isolatedBand: null,
  docking: null,
  veil: false,
  cameraCue: null,

  travelTo: (region) => {
    clearSequenceTimers();
    set((s) => ({
      region,
      // Focus belongs to a region; carrying it across would frame nothing.
      focus: { kind: 'none' },
      phase: 'traveling',
      entered: s.entered || region !== 'hero',
      isolatedBand: region === 'skills' ? s.isolatedBand : null,
      // Direct navigation aborts any boarding sequence cleanly.
      docking: null,
      veil: false,
      cameraCue: null,
    }));
  },

  focusOn: (kind, id) => {
    clearSequenceTimers();
    set(() => ({
      focus: { kind, id },
      // Focusing a target implies being in the region that holds it.
      ...(kind === 'project' ? { region: 'projects' as Region } : {}),
      ...(kind === 'skill' ? { region: 'skills' as Region } : {}),
      phase: 'traveling',
      docking: null,
      veil: false,
      cameraCue: null,
    }));
  },

  clearFocus: () => set({ focus: { kind: 'none' }, phase: 'traveling' }),

  enterMilano: () => {
    const s = get();
    if (s.region === 'milano-interior' || s.docking) return;
    clearSequenceTimers();
    set({
      docking: 'approach',
      focus: { kind: 'none' },
      phase: 'traveling',
      entered: true,
      milanoFound: true,
      veil: false,
      cameraCue: null,
    });
  },

  exitMilano: (to) => {
    const s = get();
    if (s.region !== 'milano-interior') return;
    clearSequenceTimers();
    // Veil first; swap regions only once it covers the cut.
    set({ veil: true, phase: 'traveling' });
    exitTimer = setTimeout(() => {
      set({
        region: to ?? MILANO_HOME,
        focus: { kind: 'none' },
        phase: 'traveling',
        cameraCue: 'from-ship',
      });
      veilTimer = setTimeout(() => set({ veil: false }), 320);
    }, 360);
  },

  beginIngress: () =>
    set((s) => (s.docking === 'approach' ? { docking: 'ingress' } : {})),

  lowerVeil: () => {
    clearTimeout(veilTimer);
    if (get().veil) set({ veil: false });
  },

  commitBoard: () => {
    clearSequenceTimers();
    set({
      docking: null,
      region: 'milano-interior',
      focus: { kind: 'milano' },
      phase: 'traveling',
      veil: true,
      cameraCue: 'snap',
    });
    /* The interior lowers the veil itself once it has genuinely drawn
       (first frames can take seconds on a slow GPU while its shaders
       compile — a timer would uncover a half-built cockpit). This is
       only the stranding guard. */
    veilTimer = setTimeout(() => set({ veil: false }), 4000);
  },

  raiseVeil: () => {
    if (!get().veil) set({ veil: true });
  },

  consumeCameraCue: () => {
    if (get().cameraCue) set({ cameraCue: null });
  },

  isolateBand: (groupId) => set({ isolatedBand: groupId }),

  beginTravel: () => set({ phase: 'traveling' }),
  endTravel: () => set((s) => (s.phase === 'traveling' ? { phase: 'idle' } : {})),

  setTier: (tier) => set({ tier }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),
  finishLoading: () => set((s) => (s.phase === 'loading' ? { phase: 'idle' } : {})),

  advance: (delta) => {
    const { region, docking, travelTo, enterMilano, exitMilano } = get();
    // Boarding is a committed action; a stray wheel tick can't interrupt it.
    if (docking) return;
    const i = SCROLL_ORDER.indexOf(region);
    const next = SCROLL_ORDER[i + delta];
    if (!next || next === region) return;
    // The last stop is inside the ship; entering it is its own action so
    // the discovery flag and focus state stay correct.
    if (next === 'milano-interior') return enterMilano();
    // Scrolling back OUT of the ship reverses the scroll path (projects),
    // unlike the Exit Vessel button, which returns to where it's parked —
    // but both leave through the airlock.
    if (region === 'milano-interior') return exitMilano(next);
    travelTo(next);
  },
}));
