import { useEffect, useState } from 'react';

export type Tier = 'high' | 'medium' | 'low';

export interface Capabilities {
  /** False when WebGL cannot be created at all, or the context was lost. */
  webgl: boolean;
  reducedMotion: boolean;
  tier: Tier;
  touch: boolean;
  /** Renderer string, kept for diagnostics in the HUD. */
  renderer: string;
}

/** Probe WebGL once, on a throwaway canvas we dispose immediately. */
function probeWebGL(): { ok: boolean; renderer: string } {
  if (typeof document === 'undefined') return { ok: false, renderer: '' };
  const canvas = document.createElement('canvas');
  // WebGL2 only: three r163+ dropped WebGL1, so a WebGL1-only browser must
  // get the document, not a dead canvas.
  const gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
  if (!gl) return { ok: false, renderer: '' };

  let renderer = '';
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  if (dbg) renderer = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) ?? '');

  // Release the probe context so it doesn't count against the browser's limit.
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return { ok: true, renderer };
}

/**
 * Known-slow mobile GPU families. Matching here is a starting guess only —
 * useAutoTier() in scene/quality.ts corrects it from real frame times.
 */
const SLOW_GPU = /mali-[gt]?[1-5]\d{2}\b|adreno.*(3\d\d|4\d\d|5\d\d)\b|powervr|videocore|swiftshader|llvmpipe|software/i;

/* Integrated desktop/laptop GPUs (Intel UHD/Iris, AMD APUs — the bare
   "Radeon Graphics" string with no model number is the APU signature).
   Perfectly capable, but not of the high tier at 1080p+: start them at
   medium and let the runtime governor take them lower if needed. */
const INTEGRATED_GPU = /intel(\(r\))?\s*(hd|uhd|iris|graphics)|mesa.*intel|radeon(\(tm\))?\s+graphics(?!\s+\d)/i;

function classify(renderer: string): Tier {
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;

  if (SLOW_GPU.test(renderer) || cores <= 2 || mem <= 2) return 'low';
  if (INTEGRATED_GPU.test(renderer) || cores <= 4 || mem <= 4) return 'medium';
  return 'high';
}

/**
 * ?tier=low|medium|high forces a quality tier. Exists so the low-end path
 * can actually be exercised — without it the reduced budgets only ever run
 * on hardware nobody testing has, which is how they rot.
 */
function tierOverride(): Tier | null {
  if (typeof location === 'undefined') return null;
  const t = new URLSearchParams(location.search).get('tier');
  return t === 'low' || t === 'medium' || t === 'high' ? t : null;
}

export function useCapabilities(): Capabilities {
  const [caps, setCaps] = useState<Capabilities>(() => {
    const { ok, renderer } = probeWebGL();
    const forced = tierOverride();
    return {
      webgl: ok,
      renderer,
      tier: forced ?? (ok ? classify(renderer) : 'low'),
      reducedMotion:
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      touch: typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
    };
  });

  // Reduced-motion is a live preference — the user can flip it mid-session.
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = window.matchMedia('(pointer: coarse)');
    const sync = () =>
      setCaps((c) => ({ ...c, reducedMotion: motion.matches, touch: pointer.matches }));
    motion.addEventListener('change', sync);
    pointer.addEventListener('change', sync);
    return () => {
      motion.removeEventListener('change', sync);
      pointer.removeEventListener('change', sync);
    };
  }, []);

  // A lost context must drop us to the fallback rather than a black canvas.
  useEffect(() => {
    const onLost = () => setCaps((c) => ({ ...c, webgl: false }));
    window.addEventListener('webglcontextlost', onLost);
    return () => window.removeEventListener('webglcontextlost', onLost);
  }, []);

  return caps;
}
