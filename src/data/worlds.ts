/**
 * The celestial bodies. All astronomy here is factual — radii,
 * temperatures, distances and signature phenomena are real, and each
 * world's shader parameters are derived from them rather than picked
 * for looks. That is what keeps seven planets from reading as seven
 * re-tinted spheres.
 *
 * `panelMode` is a readability contract, not a style choice: worlds
 * that are genuinely near-black (WASP-76 b's nightside, TrES-2b) force
 * the light panel variant so their text still has contrast.
 */

export type WorldId =
  | 'stephenson-2-18'
  | 'hd-189733-b'
  | 'saturn'
  | 'wasp-76-b'
  | '55-cancri-e'
  | 'tres-2b'
  | 'kelt-9b'
  | 'kepler-16b'
  | 'k2-18b'
  | 'hd-110067'
  | 'wasp-193-b'
  | 'psr-b1257-12-b';

export interface PlanetShaderParams {
  /** Mid-tone body colour. */
  baseColor: string;
  /** Dayside / hot end of the gradient. */
  hotColor: string;
  /** Nightside / cool end. */
  coolColor: string;
  /** Fresnel rim colour. */
  atmosphereColor: string;
  /** 0 = airless rock, 1 = thick shell. */
  atmosphereDensity: number;
  /** Self-illumination. 0 for cold worlds, >1 for the incandescent ones. */
  emission: number;
  /** Zonal banding strength — gas giants high, rocky worlds ~0. */
  bandStrength: number;
  /** Domain-warp turbulence. */
  warpStrength: number;
  /** fBm base frequency. */
  noiseScale: number;
  /** Cloud-deck advection speed. */
  cloudSpeed: number;
  /** 0.05 = soft twilight, 1.0 = razor terminator (tidally locked). */
  terminatorSharpness: number;
  /** Outer bloom halo strength. */
  glowStrength: number;
  /** Base fBm octaves; scaled down at lower device tiers. */
  octaves: number;
  /** Feature flags — each drives an extra shader branch or child mesh. */
  ringed: boolean;
  /** Photoevaporation tail (KELT-9b). */
  tail: boolean;
  /** Second light source → doubled terminator (Kepler-16b). */
  twoSuns: boolean;
  /** Condensate falling sideways: iron rain, silicate glass rain. */
  rainStreaks: number;
  /** Emissive crack network over a magma ocean. */
  lavaCracks: number;
}

export interface World {
  id: WorldId;
  displayName: string;
  /** Mono designation for HUD readouts. */
  designation: string;
  /** Which project this world carries, if any. */
  project?: string;
  /** Radius in scene units. */
  radius: number;
  /** Rotation rate, radians/second. */
  spin: number;
  accent: string;
  panelMode: 'light' | 'dark';
  /** Real astronomical facts, shown in the panel telemetry sidebar. */
  facts: string[];
  shader: PlanetShaderParams;
  /** Reserved slot for a future project — defined but not placed. */
  unused?: boolean;
}

export const WORLDS: Record<WorldId, World> = {
  /* ---------------------------------------------------------------
     HERO — a red hypergiant so large that Saturn's whole orbit would
     fit inside it. The scale is the point.
     --------------------------------------------------------------- */
  'stephenson-2-18': {
    id: 'stephenson-2-18',
    displayName: 'Stephenson 2-18',
    designation: 'ST2-18 · SCUTUM',
    radius: 60,
    spin: 0.004,
    accent: '#ff7043',
    panelMode: 'dark',
    facts: [
      'Radius ≈ 2,150 R☉ — among the largest stars known',
      'Surface ≈ 3,200 K — cool enough to glow red',
      '≈ 19,000 light years away, in the Stephenson 2 cluster',
      'Luminosity ≈ 440,000 × the Sun',
    ],
    shader: {
      baseColor: '#8c2410',
      hotColor: '#ff8a4c',
      coolColor: '#4a0f06',
      atmosphereColor: '#ff5722',
      atmosphereDensity: 0.85,
      emission: 1.6,
      bandStrength: 0.06,
      warpStrength: 0.85,
      noiseScale: 2.1,
      cloudSpeed: 0.012,
      terminatorSharpness: 0.02,
      glowStrength: 1.5,
      octaves: 6,
      ringed: false,
      tail: false,
      twoSuns: false,
      rainStreaks: 0,
      lavaCracks: 0,
    },
  },

  /* ---------------------------------------------------------------
     ABOUT — the cobalt hot Jupiter. Blue not from water but from
     silicate haze scattering light, with molten glass blown sideways
     at nearly nine thousand km/h.
     --------------------------------------------------------------- */
  'hd-189733-b': {
    id: 'hd-189733-b',
    displayName: 'HD 189733 b',
    designation: 'HD189733b · VULPECULA',
    radius: 3.2,
    spin: 0.05,
    accent: '#2e6fd9',
    panelMode: 'dark',
    facts: [
      'Deep blue from silicate haze, not from oceans',
      'Winds reach ≈ 8,700 km/h across the terminator',
      'Silicate glass rain falls sideways, never down',
      '≈ 64 light years away · orbits its star in 2.2 days',
    ],
    shader: {
      baseColor: '#12386e',
      hotColor: '#4f8fe0',
      coolColor: '#050f24',
      atmosphereColor: '#5aa2ff',
      atmosphereDensity: 0.95,
      emission: 0.12,
      bandStrength: 0.78,
      warpStrength: 0.42,
      noiseScale: 3.4,
      cloudSpeed: 0.09,
      terminatorSharpness: 0.55,
      glowStrength: 0.7,
      octaves: 5,
      ringed: false,
      tail: false,
      twoSuns: false,
      rainStreaks: 0.75,
      lavaCracks: 0,
    },
  },

  /* ---------------------------------------------------------------
     SKILLS — Saturn. Less dense than water, tilted 26.7°, with a
     4,700 km gap in its rings that makes a very good parking space.
     --------------------------------------------------------------- */
  saturn: {
    id: 'saturn',
    displayName: 'Saturn',
    designation: 'SOL VI · 9.5 AU',
    radius: 4.6,
    spin: 0.07,
    accent: '#d6c08a',
    panelMode: 'dark',
    facts: [
      'Rings are ≈ 99% water ice, and only tens of metres thick',
      'The Cassini Division is a 4,700 km gap between the A and B rings',
      'Density 0.687 g/cm³ — it would float on water',
      'Axial tilt 26.7°, which is why the rings open and close',
    ],
    shader: {
      baseColor: '#c9ac74',
      hotColor: '#efdcae',
      coolColor: '#6b5533',
      atmosphereColor: '#f0dcae',
      atmosphereDensity: 0.5,
      emission: 0.04,
      bandStrength: 0.92,
      warpStrength: 0.3,
      noiseScale: 4.2,
      cloudSpeed: 0.05,
      terminatorSharpness: 0.32,
      glowStrength: 0.35,
      octaves: 5,
      ringed: true,
      tail: false,
      twoSuns: false,
      rainStreaks: 0,
      lavaCracks: 0,
    },
  },

  /* ---------------------------------------------------------------
     01 · LABORA — a world whose invisible chemistry was measured from
     640 light years away. Iron boils on the dayside and rains on the
     nightside. Fitting for a laboratory system.
     --------------------------------------------------------------- */
  'wasp-76-b': {
    id: 'wasp-76-b',
    displayName: 'WASP-76 b',
    designation: 'WASP-76b · PISCES',
    project: 'labora',
    radius: 2.9,
    spin: 0.03,
    accent: '#ff7a3d',
    panelMode: 'light',
    facts: [
      'Dayside ≈ 2,400 °C — hot enough to vaporise iron',
      'Winds carry iron vapour to the nightside, where it rains',
      'Tidally locked: one face never sees darkness',
      'Iron rain confirmed in 2020 with ESPRESSO at the VLT',
    ],
    shader: {
      baseColor: '#5a1c0c',
      hotColor: '#ffb066',
      coolColor: '#08060a',
      atmosphereColor: '#ff8340',
      atmosphereDensity: 0.8,
      emission: 0.85,
      bandStrength: 0.35,
      warpStrength: 0.7,
      noiseScale: 3.0,
      cloudSpeed: 0.14,
      terminatorSharpness: 0.95,
      glowStrength: 1.15,
      octaves: 5,
      ringed: false,
      tail: false,
      twoSuns: false,
      rainStreaks: 1.0,
      lavaCracks: 0.25,
    },
  },

  /* ---------------------------------------------------------------
     02 · QUIZZY — still molten, still being rebuilt. A super-Earth
     with a magma ocean and a year that lasts under 18 hours.
     --------------------------------------------------------------- */
  '55-cancri-e': {
    id: '55-cancri-e',
    displayName: '55 Cancri e',
    designation: '55 CNC e · CANCER',
    project: 'quizzy',
    radius: 1.9,
    spin: 0.02,
    accent: '#ff5c1f',
    panelMode: 'dark',
    facts: [
      'A year lasts 17.7 hours',
      'Dayside ≈ 2,400 K — likely a global magma ocean',
      '8.8 × Earth’s mass, packed into twice its radius',
      'JWST found signs of a volatile-rich atmosphere in 2024',
    ],
    shader: {
      baseColor: '#2a0d06',
      hotColor: '#ff7a26',
      coolColor: '#140604',
      atmosphereColor: '#ff6a2a',
      atmosphereDensity: 0.35,
      emission: 1.05,
      bandStrength: 0.0,
      warpStrength: 0.95,
      noiseScale: 5.5,
      cloudSpeed: 0.03,
      terminatorSharpness: 0.88,
      glowStrength: 0.95,
      octaves: 6,
      ringed: false,
      tail: false,
      twoSuns: false,
      rainStreaks: 0,
      lavaCracks: 1.0,
    },
  },

  /* ---------------------------------------------------------------
     03 · PRAYER TIMES — the darkest planet known. Reflects under 1%
     of the light that hits it and gives off only a faint ember of its
     own heat. Runs quietly in the background, like the extension does.
     --------------------------------------------------------------- */
  'tres-2b': {
    id: 'tres-2b',
    displayName: 'TrES-2b',
    designation: 'TrES-2b · DRACO',
    project: 'prayer-times',
    radius: 2.6,
    spin: 0.025,
    accent: '#c1352b',
    panelMode: 'light',
    facts: [
      'Reflects less than 1% of the light that reaches it',
      'The darkest exoplanet known — blacker than coal',
      '≈ 1,100 °C, visible only by its own faint red glow',
      'Albedo measured in 2011 using Kepler photometry',
    ],
    shader: {
      baseColor: '#0a0708',
      hotColor: '#4a1410',
      coolColor: '#020203',
      atmosphereColor: '#8e2a20',
      atmosphereDensity: 0.42,
      emission: 0.3,
      bandStrength: 0.22,
      warpStrength: 0.5,
      noiseScale: 2.6,
      cloudSpeed: 0.02,
      terminatorSharpness: 0.2,
      glowStrength: 0.4,
      octaves: 4,
      ringed: false,
      tail: false,
      twoSuns: false,
      rainStreaks: 0,
      lavaCracks: 0,
    },
  },

  /* ---------------------------------------------------------------
     04 · RDMID — matter torn apart and reassembled. The hottest gas
     giant known, with its atmosphere being stripped into a tail and
     its molecules dissociating. Diffusion, at planetary scale.
     --------------------------------------------------------------- */
  'kelt-9b': {
    id: 'kelt-9b',
    displayName: 'KELT-9b',
    designation: 'KELT-9b · CYGNUS',
    project: 'rdmid',
    radius: 3.4,
    spin: 0.045,
    accent: '#b8d8ff',
    panelMode: 'dark',
    facts: [
      'Dayside ≈ 4,300 K — hotter than most stars',
      'Hydrogen molecules are torn apart on the day side',
      'Its atmosphere is being stripped into a comet-like tail',
      'First exoplanet found with iron and titanium vapour, 2018',
    ],
    shader: {
      baseColor: '#3d5f8f',
      hotColor: '#eaf4ff',
      coolColor: '#101c33',
      atmosphereColor: '#9cc8ff',
      atmosphereDensity: 1.0,
      emission: 1.75,
      bandStrength: 0.28,
      warpStrength: 0.6,
      noiseScale: 2.4,
      cloudSpeed: 0.2,
      terminatorSharpness: 0.7,
      glowStrength: 1.8,
      octaves: 5,
      ringed: false,
      tail: true,
      twoSuns: false,
      rainStreaks: 0,
      lavaCracks: 0,
    },
  },

  /* ---------------------------------------------------------------
     05 · ATTG — the Tatooine planet. Orbits two stars, so everything
     on it casts two shadows. A scheduler balancing two constraints.
     --------------------------------------------------------------- */
  'kepler-16b': {
    id: 'kepler-16b',
    displayName: 'Kepler-16b',
    designation: 'KEPLER-16b · CYGNUS',
    project: 'attg',
    radius: 3.0,
    spin: 0.035,
    accent: '#cbb894',
    panelMode: 'dark',
    facts: [
      'Orbits two stars — everything here casts two shadows',
      'First confirmed transiting circumbinary planet, 2011',
      'Saturn-class and cold: roughly −73 to −101 °C',
      'One orbit around both suns takes 229 days',
    ],
    shader: {
      baseColor: '#8a7c62',
      hotColor: '#d8c9a4',
      coolColor: '#241f18',
      atmosphereColor: '#c9b894',
      atmosphereDensity: 0.6,
      emission: 0.02,
      bandStrength: 0.7,
      warpStrength: 0.35,
      noiseScale: 3.8,
      cloudSpeed: 0.04,
      terminatorSharpness: 0.4,
      glowStrength: 0.3,
      octaves: 5,
      ringed: true,
      tail: false,
      twoSuns: true,
      rainStreaks: 0,
      lavaCracks: 0,
    },
  },

  /* ---------------------------------------------------------------
     06 · CVD PREDICTION — a world where we are looking for a signal
     of life we cannot see directly. Biosignature, biomarker.
     --------------------------------------------------------------- */
  'k2-18b': {
    id: 'k2-18b',
    displayName: 'K2-18b',
    designation: 'K2-18b · LEO',
    project: 'cvd',
    radius: 2.7,
    spin: 0.04,
    accent: '#4fb8c9',
    panelMode: 'dark',
    facts: [
      'Water vapour detected in its atmosphere in 2019',
      'Sits in its red dwarf’s habitable zone, 124 light years out',
      'JWST found methane and CO₂ in 2023 — consistent with an ocean',
      'A possible dimethyl sulfide signal remains contested',
    ],
    shader: {
      baseColor: '#1d5a68',
      hotColor: '#8fd8e4',
      coolColor: '#071a20',
      atmosphereColor: '#6fd0e0',
      atmosphereDensity: 1.0,
      emission: 0.06,
      bandStrength: 0.4,
      warpStrength: 0.55,
      noiseScale: 2.8,
      cloudSpeed: 0.06,
      terminatorSharpness: 0.3,
      glowStrength: 0.85,
      octaves: 6,
      ringed: false,
      tail: false,
      twoSuns: false,
      rainStreaks: 0,
      lavaCracks: 0,
    },
  },

  /* ---------------------------------------------------------------
     07 · THIS UNIVERSE — not one planet but six, locked in a perfect
     resonant chain. A system of parts in harmony, which is either a
     good metaphor for a portfolio or a very smug one.
     --------------------------------------------------------------- */
  'hd-110067': {
    id: 'hd-110067',
    displayName: 'HD 110067',
    designation: 'HD 110067 · COMA BERENICES',
    project: 'this-portfolio',
    radius: 1.15,
    spin: 0.05,
    accent: '#c8d2e0',
    panelMode: 'dark',
    facts: [
      'Six sub-Neptunes locked in a 3:2·3:2·3:2·4:3·4:3 resonance',
      'For every 3 orbits of one planet, the next completes exactly 2',
      'The most harmonious multi-planet system known · found 2023',
      '≈ 100 light years away — all six kept their original atmospheres',
    ],
    shader: {
      baseColor: '#5a6a80',
      hotColor: '#d6dfeb',
      coolColor: '#111823',
      atmosphereColor: '#a8bcd4',
      atmosphereDensity: 0.75,
      emission: 0.05,
      bandStrength: 0.5,
      warpStrength: 0.3,
      noiseScale: 3.2,
      cloudSpeed: 0.05,
      terminatorSharpness: 0.35,
      glowStrength: 0.55,
      octaves: 4,
      ringed: false,
      tail: false,
      twoSuns: false,
      rainStreaks: 0,
      lavaCracks: 0,
    },
  },

  /* ---------------------------------------------------------------
     Reserved. Defined so that adding project 08 or 09 later is a
     one-line change in projects.ts, not a modelling exercise.
     --------------------------------------------------------------- */
  'wasp-193-b': {
    id: 'wasp-193-b',
    displayName: 'WASP-193 b',
    designation: 'WASP-193b · RESERVED',
    radius: 4.0,
    spin: 0.03,
    accent: '#e8c8a0',
    panelMode: 'dark',
    unused: true,
    facts: [
      'Density 0.059 g/cm³ — very nearly cotton candy',
      'Jupiter-sized but only 14% of Jupiter’s mass',
      'Second-lowest-density planet known · announced 2024',
    ],
    shader: {
      baseColor: '#d8bfa0',
      hotColor: '#f6e6cf',
      coolColor: '#4a3a2c',
      atmosphereColor: '#f0d8b8',
      atmosphereDensity: 1.0,
      emission: 0.1,
      bandStrength: 0.3,
      warpStrength: 0.8,
      noiseScale: 1.8,
      cloudSpeed: 0.11,
      terminatorSharpness: 0.18,
      glowStrength: 1.0,
      octaves: 5,
      ringed: false,
      tail: false,
      twoSuns: false,
      rainStreaks: 0,
      lavaCracks: 0,
    },
  },

  'psr-b1257-12-b': {
    id: 'psr-b1257-12-b',
    displayName: 'PSR B1257+12 b',
    designation: 'PSR B1257+12 b · RESERVED',
    radius: 1.0,
    spin: 0.09,
    accent: '#9d8fd4',
    panelMode: 'dark',
    unused: true,
    facts: [
      'Orbits a millisecond pulsar, swept by intense radiation',
      'Part of the first exoplanet system ever confirmed, in 1992',
      'Roughly 2% of Earth’s mass · also called Draugr',
    ],
    shader: {
      baseColor: '#3a3450',
      hotColor: '#b9a8f0',
      coolColor: '#0b0a14',
      atmosphereColor: '#a898e8',
      atmosphereDensity: 0.15,
      emission: 0.5,
      bandStrength: 0.0,
      warpStrength: 0.9,
      noiseScale: 7.0,
      cloudSpeed: 0.01,
      terminatorSharpness: 0.6,
      glowStrength: 1.2,
      octaves: 4,
      ringed: false,
      tail: false,
      twoSuns: false,
      rainStreaks: 0,
      lavaCracks: 0,
    },
  },
};

/** The seven project worlds, in nav-manifest order. */
export const PROJECT_WORLD_IDS: WorldId[] = [
  'wasp-76-b',
  '55-cancri-e',
  'tres-2b',
  'kelt-9b',
  'kepler-16b',
  'k2-18b',
  'hd-110067',
];

export const PROJECT_WORLDS: World[] = PROJECT_WORLD_IDS.map((id) => WORLDS[id]);

export function worldForProject(projectId: string): World | undefined {
  return PROJECT_WORLDS.find((w) => w.project === projectId);
}
