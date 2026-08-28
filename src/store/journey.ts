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

  travelTo: (region: Region) => void;
  focusOn: (kind: Exclude<FocusKind, 'none'>, id: string) => void;
  clearFocus: () => void;
  enterMilano: () => void;
  exitMilano: () => void;
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

  travelTo: (region) =>
    set((s) => ({
      region,
      // Focus belongs to a region; carrying it across would frame nothing.
      focus: { kind: 'none' },
      phase: 'traveling',
      entered: s.entered || region !== 'hero',
      isolatedBand: region === 'skills' ? s.isolatedBand : null,
    })),

  focusOn: (kind, id) =>
    set(() => ({
      focus: { kind, id },
      // Focusing a target implies being in the region that holds it.
      ...(kind === 'project' ? { region: 'projects' as Region } : {}),
      ...(kind === 'skill' ? { region: 'skills' as Region } : {}),
      phase: 'traveling',
    })),

  clearFocus: () => set({ focus: { kind: 'none' }, phase: 'traveling' }),

  enterMilano: () =>
    set({
      region: 'milano-interior',
      focus: { kind: 'milano' },
      phase: 'traveling',
      entered: true,
      milanoFound: true,
    }),

  exitMilano: () =>
    set({ region: MILANO_HOME, focus: { kind: 'none' }, phase: 'traveling' }),

  isolateBand: (groupId) => set({ isolatedBand: groupId }),

  beginTravel: () => set({ phase: 'traveling' }),
  endTravel: () => set((s) => (s.phase === 'traveling' ? { phase: 'idle' } : {})),

  setTier: (tier) => set({ tier }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),
  finishLoading: () => set((s) => (s.phase === 'loading' ? { phase: 'idle' } : {})),

  advance: (delta) => {
    const { region, travelTo, enterMilano } = get();
    const i = SCROLL_ORDER.indexOf(region);
    const next = SCROLL_ORDER[i + delta];
    if (!next || next === region) return;
    // The last stop is inside the ship; entering it is its own action so
    // the discovery flag and focus state stay correct.
    if (next === 'milano-interior') return enterMilano();
    // Scrolling back OUT of the ship reverses the scroll path (projects),
    // unlike the Exit Vessel button, which returns to where it's parked.
    travelTo(next);
  },
}));
