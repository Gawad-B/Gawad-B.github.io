import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useJourney, type Region } from '@/store/journey';
import { easeFlight, easeInstrument } from './easing';
import { getBody, getBodies } from './bodies';
import { WORLDS, PROJECT_WORLD_IDS, worldForProject } from '@/data/worlds';

/**
 * Camera stops in a heliocentric scene.
 *
 * Static coordinates stopped being meaningful the moment everything began
 * orbiting the star, so a waypoint is now a resolver: given scratch
 * vectors, it fills in where the camera should sit and look *right now*.
 * Flights chase the moving endpoint — lerp(start, end(t), easedT) still
 * lands exactly, because at t=1 you are wherever the endpoint currently
 * is — and after arrival the rig stays glued to the resolver, which is
 * what keeps a focused planet centre-frame while it keeps orbiting.
 */

interface Shot {
  fov: number;
  weight?: number;
  /** Mobile widens the FOV by this much (default 12). The interior sets 0:
      the monitor is a flat document, and widening just shrinks it. */
  mobileFovBoost?: number;
  resolve: (pos: THREE.Vector3, target: THREE.Vector3, mobile: boolean) => void;
}

const SUN_R = WORLDS['stephenson-2-18'].radius;

const OUT = new THREE.Vector3();
const SIDE = new THREE.Vector3();
const TMP = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

/**
 * Follow a registered body in ITS OWN orbital frame: `back` units further
 * from the sun, `up` above the ecliptic, `side` along the orbit.
 *
 * A world-fixed offset cannot work here — the body keeps moving, so the
 * sun would swing anywhere in frame depending on orbital phase, including
 * straight into the shot. The camera rides the body's own orbital frame:
 * `side` along the orbit (the main standoff — with the sun ~90° off the
 * view axis it stays out of frame and the body keeps a real terminator),
 * `out` radial (negative = sunward; small, because Saturn's frame distance
 * exceeds its distance to the star — stand fully sunward of it and you are
 * inside the photosphere), `up` above the ecliptic.
 */
function follow(id: string, out: number, up: number, side: number) {
  return (pos: THREE.Vector3, target: THREE.Vector3) => {
    const body = getBody(id);
    if (!body) {
      pos.set(side, up, Math.abs(out) + 10);
      target.set(0, 0, 0);
      return;
    }
    body.getWorldPosition(target);
    OUT.set(target.x, 0, target.z).normalize();
    SIDE.crossVectors(UP, OUT).normalize();
    pos.copy(target).addScaledVector(OUT, out).addScaledVector(SIDE, side);
    pos.y += up;
  };
}

const SHOTS: Record<string, Shot> = {
  /* Home: hard against the photosphere, limb running off frame — the
     star at the centre of everything, seen from embarrassingly close. */
  hero: {
    fov: 42,
    weight: 1.2,
    resolve: (pos, target) => {
      pos.set(-3.4, 1.1, SUN_R * 1.9);
      target.set(SUN_R * 0.85, -SUN_R * 0.55, 0);
    },
  },

  /* ENTER THE UNIVERSE: pull all the way out. The reveal — one star,
     every orbit, everything moving. */
  system: {
    fov: 50,
    weight: 1.35,
    resolve: (pos, target) => {
      pos.set(0, 70, 142);
      target.set(0, -2, 0);
    },
  },

  about: {
    fov: 42,
    resolve: (pos, target, mobile) => {
      follow('hd-189733-b', -3.2, 1.3, 7.8)(pos, target);
      // Phones open the dossier as a bottom sheet — drop the look target
      // so the planet rides the top half of the frame instead of hiding
      // behind the card.
      if (mobile) target.y -= 2.4;
    },
  },

  /* Saturn from above the ring plane, far enough back that all seven
     moon shells fit in frame. */
  skills: { fov: 46, weight: 1.1, resolve: follow('saturn', -7, 13, 33) },

  /* The belt: a dynamic three-quarter shot of wherever the six project
     worlds currently are — they drift, so the framing must too. */
  projects: {
    fov: 50,
    weight: 1.15,
    resolve: (pos, target) => {
      const bodies = getBodies(PROJECT_WORLD_IDS);
      if (bodies.length === 0) {
        pos.set(0, 30, 110);
        target.set(0, 0, 0);
        return;
      }
      // Resolvers run every frame — no allocations here.
      target.set(0, 0, 0);
      for (const b of bodies) target.add(b.getWorldPosition(TMP));
      target.divideScalar(bodies.length);
      // Stand outside the belt, looking back across it toward the sun.
      pos.copy(target);
      const out = TMP.set(target.x, 0, target.z).normalize();
      pos.addScaledVector(out, 46);
      pos.y += 22;
      target.multiplyScalar(0.72); // bias the look toward the sun side
    },
  },

  'milano-interior': {
    fov: 54,
    weight: 0.75,
    mobileFovBoost: 0,
    resolve: (pos, target, mobile) => {
      // Close enough that the monitor IS the interface; further back on
      // phones so the whole glass fits a narrow frame.
      pos.set(0, mobile ? 0.02 : 0.1, mobile ? 0.55 : 0.52);
      target.set(0, -0.26, -2.08);
    },
  },
};

/* Boarding the Milano is two shots, not one: the approach frames the
   parked ship against the rings and holds there a beat; the ingress
   pushes to the canopy while the airlock veil rises to cover the moment
   the camera crosses the hull. Both follow the registered ship body, so
   they stay correct while Saturn (and the ship with it) keeps orbiting. */
/* Composed in the STATION's frame, not the orbital frame: the station
   translates along its orbit but never rotates, so a local-space shot is
   stable at every phase — ship in the foreground, berth arm mid-frame,
   hab ring and hub as the backdrop. An orbital-frame follow can't
   guarantee the ring stays behind the ship. */
const MILANO_APPROACH: Shot = {
  fov: 38,
  weight: 1.05,
  resolve: (pos, target) => {
    const st = getBody('waystation');
    if (!st) {
      pos.set(0, 5, 96);
      target.set(0, 0, 84);
      return;
    }
    // Front-starboard quarter: nose and berth collar lead the eye left
    // toward the arm, the hab ring opens as an ellipse behind, and the
    // stern (with its engine glow) stays angled away from the lens.
    pos.set(12.6, 3.4, 2.6);
    st.localToWorld(pos);
    target.set(1.9, 0.3, 4.4);
    st.localToWorld(target);
  },
};
const MILANO_INGRESS: Shot = {
  fov: 46,
  weight: 0.9,
  resolve: follow('milano-ship', -0.5, 0.65, 1.6),
};

/** Close approach for one project world, sized by its radius. */
function projectShot(projectId: string): Shot {
  const world = worldForProject(projectId);
  const r = world?.radius ?? 2;
  const base = world
    ? follow(world.id, -r * 1.9, r * 0.9, r * 5.6)
    : SHOTS.projects!.resolve;
  return {
    fov: 44,
    weight: 0.95,
    resolve: (pos, target, mobile) => {
      base(pos, target, mobile);
      // Same bottom-sheet rule as the about shot: subject in the top half.
      if (mobile) target.y -= r * 1.45;
    },
  };
}

const MOBILE_FOV_BOOST = 12;

function shotFor(
  region: Region,
  focusKind: string,
  focusId: string | undefined,
  docking: string | null,
): Shot {
  if (docking === 'approach') return MILANO_APPROACH;
  if (docking === 'ingress') return MILANO_INGRESS;
  if (focusKind === 'project' && focusId) return projectShot(focusId);
  return SHOTS[region] ?? SHOTS.hero!;
}

/** Flight time scales with distance, within cinematic bounds. */
function durationFor(distance: number, weight: number): number {
  return THREE.MathUtils.clamp(0.85 + distance * 0.011, 0.9, 3.1) * weight;
}

export function CameraRig({ mobile }: { mobile: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const region = useJourney((s) => s.region);
  const focus = useJourney((s) => s.focus);
  const reducedMotion = useJourney((s) => s.reducedMotion);
  const endTravel = useJourney((s) => s.endTravel);
  const docking = useJourney((s) => s.docking);

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

  const shot = useRef<Shot>(SHOTS.hero!);
  const startedAt = useRef(-1);
  const duration = useRef(1);
  const startFov = useRef(42);
  const arrived = useRef(true);
  const idleTime = useRef(0);
  /** Wall-clock time to hold on the parked ship before pushing inside. */
  const holdUntil = useRef(-1);

  const focusKey = `${region}|${focus.kind}|${focus.id ?? ''}|${docking ?? ''}`;

  useEffect(() => {
    const next = shotFor(region, focus.kind, focus.id, docking);
    shot.current = next;

    const cue = useJourney.getState().cameraCue;
    if (cue === 'from-ship') {
      /* Departing the vessel: the camera was parked at interior
         coordinates near the origin. Under the veil, restart it just
         outside the hull so the flight begins where the ship really is. */
      MILANO_APPROACH.resolve(v.startPos, v.startLook, mobile);
      camera.position.copy(v.startPos);
      v.look.copy(v.startLook);
    } else {
      v.startPos.copy(camera.position);
      v.startLook.copy(v.look);
    }
    next.resolve(v.endPos, v.endLook, mobile);

    startFov.current = camera.fov;
    const distance = v.startPos.distanceTo(v.endPos);
    duration.current =
      reducedMotion || cue === 'snap'
        ? 0.001
        : durationFor(distance, next.weight ?? 1);
    if (cue) useJourney.getState().consumeCameraCue();
    startedAt.current = -1;
    arrived.current = false;
    idleTime.current = 0;
    holdUntil.current = -1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, camera, reducedMotion, mobile, v]);

  useFrame((state, rawDelta) => {
    const now = state.clock.elapsedTime;
    const delta = Math.min(rawDelta, 1 / 20);
    const active = shot.current;
    const endFov = mobile ? active.fov + (active.mobileFovBoost ?? MOBILE_FOV_BOOST) : active.fov;

    // The destination moves; re-resolve it every frame.
    active.resolve(v.endPos, v.endLook, mobile);

    if (!arrived.current) {
      if (startedAt.current < 0) startedAt.current = now;
      const t = Math.min(1, (now - startedAt.current) / duration.current);

      const posT = easeFlight(t);
      const lookT = easeInstrument(Math.min(1, t * 0.82));

      camera.position.lerpVectors(v.startPos, v.endPos, posT);
      v.look.lerpVectors(v.startLook, v.endLook, lookT);

      // Warp flare on genuinely long hauls only.
      const flare =
        v.startPos.distanceTo(v.endPos) > 40 && !reducedMotion
          ? Math.sin(Math.min(1, t * 1.4) * Math.PI) * 13
          : 0;
      camera.fov = THREE.MathUtils.lerp(startFov.current, endFov, posT) + flare;
      camera.updateProjectionMatrix();

      // The veil must be fully up before the camera crosses the hull.
      if (docking === 'ingress' && t >= 0.4) useJourney.getState().raiseVeil();

      if (t >= 1) {
        arrived.current = true;
        camera.fov = endFov;
        camera.updateProjectionMatrix();
        const j = useJourney.getState();
        if (j.docking === 'approach') {
          // Hold on the parked ship for a beat before pushing to the canopy.
          holdUntil.current = now + (reducedMotion ? 0 : 0.8);
        } else if (j.docking === 'ingress') {
          j.commitBoard();
        } else {
          endTravel();
        }
      }
    } else {
      if (docking === 'approach' && holdUntil.current >= 0 && now >= holdUntil.current) {
        holdUntil.current = -1;
        useJourney.getState().beginIngress();
      }
      /* Follow mode: glued to the resolver, so an orbiting focus stays
         framed. The sway is a held shot, not a drift — except inside the
         ship, where the camera and the monitor are bolted to the same
         hull: any relative motion between them is fake parallax (and it
         makes the projected screen wobble under the pointer). */
      const still = reducedMotion || region === 'milano-interior';
      const sway = still ? 0 : Math.sin(idleTime.current * 0.21) * 0.05;
      const rise = still ? 0 : Math.cos(idleTime.current * 0.16) * 0.035;
      idleTime.current += delta;
      camera.position.set(v.endPos.x + sway, v.endPos.y + rise, v.endPos.z);
      v.look.copy(v.endLook);
      if (Math.abs(camera.fov - endFov) > 0.05) {
        camera.fov += (endFov - camera.fov) * Math.min(1, delta * 6);
        camera.updateProjectionMatrix();
      }
    }

    camera.lookAt(v.look);

    if ((window as Window & { __rigDebug?: boolean }).__rigDebug) {
      (window as Window & { __rigState?: unknown }).__rigState = {
        region,
        arrived: arrived.current,
        dist: +v.scratch.copy(camera.position).sub(v.endPos).length().toFixed(2),
      };
    }
  });

  return null;
}
