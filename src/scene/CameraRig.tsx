import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useJourney, type Region } from '@/store/journey';
import { easeFlight, easeInstrument } from './easing';

export interface Waypoint {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  /** Multiplies the computed flight duration. >1 = weightier arrival. */
  weight?: number;
}

/**
 * Where the camera sits for each region, and for each focusable target.
 * Focus keys are `${kind}:${id}`, so a region and a target share one lookup.
 */
export const WAYPOINTS: Record<string, Waypoint> = {
  // Stephenson 2-18 is radius 60 and sits at [34,-46,12]; this framing
  // puts its limb off two edges of frame.
  hero: { position: [0, 8, 165], target: [10, -14, 0], fov: 42, weight: 1.25 },
  about: { position: [7.5, 1.8, 11], target: [-2.4, -0.3, 0], fov: 40 },
  skills: { position: [0, 13, 54], target: [0, -1, 0], fov: 42, weight: 1.15 },
  projects: { position: [20, 5, 60], target: [20, -1, 2], fov: 50, weight: 1.2 },
  'milano-interior': { position: [0, 0.35, 2.4], target: [0, 0.15, -2], fov: 62, weight: 0.75 },
};

const MOBILE_FOV_BOOST = 12;

export function registerWaypoint(key: string, wp: Waypoint) {
  WAYPOINTS[key] = wp;
}

function keyFor(region: Region, focusKind: string, focusId?: string): string {
  if (focusKind !== 'none' && focusId) {
    const k = `${focusKind}:${focusId}`;
    if (WAYPOINTS[k]) return k;
  }
  if (focusKind === 'milano' && WAYPOINTS.milano) return 'milano';
  return region;
}

/** Flight time scales with distance, but within cinematic bounds. */
function durationFor(distance: number, weight: number): number {
  return THREE.MathUtils.clamp(0.85 + distance * 0.011, 0.9, 2.8) * weight;
}

/**
 * The camera.
 *
 * Duration-based easing rather than exponential damping. Damping looks
 * simpler but is the wrong tool here: its approach is asymptotic, so
 * arrival never definitively happens, and it's framerate-sensitive once
 * you clamp delta to survive hitches — on a slow device the whole flight
 * runs in slow motion and the arrival threshold is never tripped.
 *
 * With an explicit duration, arrival is deterministic and the curve is the
 * same one the DOM transitions use. The look-at target runs on a softer
 * curve so the framing settles a beat after the movement stops — that lag
 * is what reads as a camera operator rather than a lerp.
 */
export function CameraRig({ mobile }: { mobile: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const region = useJourney((s) => s.region);
  const focus = useJourney((s) => s.focus);
  const reducedMotion = useJourney((s) => s.reducedMotion);
  const endTravel = useJourney((s) => s.endTravel);

  const v = useMemo(
    () => ({
      startPos: new THREE.Vector3(),
      startLook: new THREE.Vector3(),
      endPos: new THREE.Vector3(),
      endLook: new THREE.Vector3(),
      look: new THREE.Vector3(),
      scratch: new THREE.Vector3(),
    }),
    [],
  );

  /* -1 means "capture the start time on the next frame". The retarget
     effect has no access to the render clock, so timing starts in the
     frame loop. */
  const startedAt = useRef(-1);
  const duration = useRef(1);
  const startFov = useRef(42);
  const endFov = useRef(42);
  const arrived = useRef(true);
  const idleTime = useRef(0);

  const activeKey = keyFor(region, focus.kind, focus.id);

  useEffect(() => {
    const wp = WAYPOINTS[activeKey] ?? WAYPOINTS.hero!;

    v.startPos.copy(camera.position);
    v.startLook.copy(v.look);
    v.endPos.set(...wp.position);
    v.endLook.set(...wp.target);

    startFov.current = camera.fov;
    endFov.current = mobile ? wp.fov + MOBILE_FOV_BOOST : wp.fov;

    const distance = v.startPos.distanceTo(v.endPos);
    duration.current = reducedMotion ? 0.001 : durationFor(distance, wp.weight ?? 1);
    startedAt.current = -1;
    arrived.current = false;
    idleTime.current = 0;
  }, [activeKey, camera, mobile, reducedMotion, v]);

  useFrame((state, rawDelta) => {
    const now = state.clock.elapsedTime;
    const delta = Math.min(rawDelta, 1 / 20);

    if (!arrived.current) {
      if (startedAt.current < 0) startedAt.current = now;

      /* Wall-clock, not accumulated deltas. Accumulating clamped deltas
         makes a timed flight framerate-dependent: on a device rendering at
         3fps the clamp means elapsed advances far slower than real time and
         a 2.6s flight takes 18s. Reading the clock directly means a slow
         device drops frames — which is correct — instead of entering slow
         motion. */
      const t = Math.min(1, (now - startedAt.current) / duration.current);

      const posT = easeFlight(t);
      // Trails the position slightly, so framing settles last.
      const lookT = easeInstrument(Math.min(1, t * 0.82));

      camera.position.lerpVectors(v.startPos, v.endPos, posT);
      v.look.lerpVectors(v.startLook, v.endLook, lookT);

      /* Warp flare: a brief FOV widening in the first half of a long
         flight. Reads as acceleration; on short hops it's imperceptible,
         which is correct. */
      const flare =
        v.startPos.distanceTo(v.endPos) > 40 && !reducedMotion
          ? Math.sin(Math.min(1, t * 1.4) * Math.PI) * 13
          : 0;
      camera.fov = THREE.MathUtils.lerp(startFov.current, endFov.current, posT) + flare;
      camera.updateProjectionMatrix();

      if (t >= 1) {
        arrived.current = true;
        camera.position.copy(v.endPos);
        v.look.copy(v.endLook);
        camera.fov = endFov.current;
        camera.updateProjectionMatrix();
        endTravel();
      }
    } else if (!reducedMotion) {
      /* Idle breathing. A camera that stops dead reads as a screenshot;
         this is small enough to feel like a held shot, not a drift. */
      idleTime.current += delta;
      const sway = Math.sin(idleTime.current * 0.21) * 0.055;
      const rise = Math.cos(idleTime.current * 0.16) * 0.04;
      camera.position.set(v.endPos.x + sway, v.endPos.y + rise, v.endPos.z);
    }

    camera.lookAt(v.look);

    if ((window as Window & { __rigDebug?: boolean }).__rigDebug) {
      (window as Window & { __rigState?: unknown }).__rigState = {
        activeKey,
        arrived: arrived.current,
        dist: +v.scratch.copy(camera.position).sub(v.endPos).length().toFixed(2),
      };
    }
  });

  return null;
}
