import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useJourney, type Region } from '@/store/journey';

export interface Waypoint {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  /** Slow, weighty arrivals for big objects; quicker for small ones. */
  damping?: number;
}

/**
 * Where the camera sits for each region, and for each focusable target.
 * Focus keys are `${kind}:${id}` so a region and a target can share the
 * same lookup.
 */
export const WAYPOINTS: Record<string, Waypoint> = {
  // Stephenson 2-18 is radius 60; sit far enough back that it fills the
  // frame but the limb still curves off screen — that's the scale cue.
  hero: { position: [0, 8, 165], target: [0, 0, 0], fov: 42, damping: 0.9 },
  about: { position: [7.5, 1.8, 11], target: [-1.2, 0, 0], fov: 40 },
  skills: { position: [0, 7.5, 26], target: [0, 0, 0], fov: 44, damping: 1.1 },
  projects: { position: [0, 6, 62], target: [0, 0, 0], fov: 50, damping: 1.2 },
  'milano-interior': { position: [0, 0.35, 2.4], target: [0, 0.15, -2], fov: 62, damping: 0.7 },
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
  if (focusKind === 'milano' && WAYPOINTS['milano']) return 'milano';
  return region;
}

/**
 * The camera. Position and look-at are damped independently and at
 * different rates, so the framing settles a beat after the movement
 * stops — that lag is what reads as a real camera operator rather than a
 * lerp. Long jumps briefly widen the FOV, which is the warp.
 */
export function CameraRig({ mobile }: { mobile: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const region = useJourney((s) => s.region);
  const focus = useJourney((s) => s.focus);
  const phase = useJourney((s) => s.phase);
  const reducedMotion = useJourney((s) => s.reducedMotion);
  const endTravel = useJourney((s) => s.endTravel);

  const lookAt = useRef(new THREE.Vector3(0, 0, 0));
  const desiredPos = useRef(new THREE.Vector3());
  const desiredTarget = useRef(new THREE.Vector3());
  const warp = useRef(0);
  const settleTimer = useRef(0);

  const scratch = useMemo(() => new THREE.Vector3(), []);

  const activeKey = keyFor(region, focus.kind, focus.id);

  // Retarget whenever the destination changes.
  useEffect(() => {
    const wp = WAYPOINTS[activeKey] ?? WAYPOINTS.hero!;
    desiredPos.current.set(...wp.position);
    desiredTarget.current.set(...wp.target);

    const distance = camera.position.distanceTo(desiredPos.current);
    // Only genuinely long hauls get the warp flare.
    warp.current = reducedMotion ? 0 : Math.min(1, distance / 90);
    settleTimer.current = 0;

    if (reducedMotion) {
      camera.position.copy(desiredPos.current);
      lookAt.current.copy(desiredTarget.current);
      camera.lookAt(lookAt.current);
      endTravel();
    }
  }, [activeKey, camera, reducedMotion, endTravel]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30); // don't let a hitch teleport us
    const wp = WAYPOINTS[activeKey] ?? WAYPOINTS.hero!;
    const damping = wp.damping ?? 1;

    // Exponential damping, framerate-independent. Position leads.
    const posRate = 1 - Math.pow(0.0016, delta / damping);
    const lookRate = 1 - Math.pow(0.010, delta / damping); // slower → settles after

    camera.position.lerp(desiredPos.current, posRate);
    lookAt.current.lerp(desiredTarget.current, lookRate);
    camera.lookAt(lookAt.current);

    // Warp: widen briefly, then relax back. Reads as acceleration.
    warp.current = Math.max(0, warp.current - delta * 1.5);
    const targetFov = (mobile ? wp.fov + MOBILE_FOV_BOOST : wp.fov) + warp.current * 16;
    if (Math.abs(camera.fov - targetFov) > 0.01) {
      camera.fov += (targetFov - camera.fov) * (1 - Math.pow(0.02, delta));
      camera.updateProjectionMatrix();
    }

    // Arrival: close enough, and no longer moving meaningfully.
    if (phase === 'traveling') {
      const dist = scratch.copy(camera.position).sub(desiredPos.current).length();
      if (dist < 0.35) {
        settleTimer.current += delta;
        if (settleTimer.current > 0.12) endTravel();
      } else {
        settleTimer.current = 0;
      }
    }
  });

  return null;
}
