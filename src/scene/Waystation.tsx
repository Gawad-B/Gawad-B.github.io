import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Milano } from './Milano';
import { registerBody, unregisterBody } from './bodies';
import { useJourney } from '@/store/journey';
import { QUALITY } from './quality';

/**
 * Aphelion Station — the harbor at the far point of the survey, and the
 * one piece of human engineering in an otherwise natural system. The
 * Milano is docked at its visitor berth (eleven years into a fifteen
 * minute limit).
 *
 * Entirely procedural, and deliberately ASYMMETRIC: a long axial truss
 * with the mass distributed unevenly — hab ring near one end, tanks and
 * a sunward dish at the other — because evenly repeated radial symmetry
 * is how a station ends up reading as programmer art.
 *
 * Draw calls are disciplined: one merged vertex-coloured mesh for the
 * static structure, one for the rotating ring assembly, one instanced
 * mesh of lit windows, one emissive berth collar, two strobes. The hull
 * merge on the Milano paid for all of it.
 */

const STRUT = '#232b3a';
const HULL = '#8a94a8';
const HULL_DIM = '#4a5468';
const PANEL = '#39435a';
const TANK = '#9a5e2c';
const WINDOW_WARM = '#e8a35c';

const RING_R = 2.6;
const RING_TUBE = 0.3;
const HUB_X = -0.9;

/** Bake one primitive into a merge list with a solid vertex colour. */
function bake(
  list: THREE.BufferGeometry[],
  geo: THREE.BufferGeometry,
  color: string,
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
  scale: [number, number, number] = [1, 1, 1],
) {
  const g = geo.toNonIndexed();
  geo.dispose();
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(...position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
    new THREE.Vector3(...scale),
  );
  g.applyMatrix4(m);
  const c = new THREE.Color(color);
  const n = g.attributes.position!.count;
  const colors = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.deleteAttribute('uv');
  list.push(g);
}

/** Static spine: truss, hub, docking arm, dish, radiators, tanks. */
function useStructure() {
  return useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];

    // Main truss along X — the spine everything hangs from.
    bake(parts, new THREE.BoxGeometry(7.4, 0.3, 0.3), STRUT, [0.4, 0, 0]);
    bake(parts, new THREE.BoxGeometry(7.4, 0.08, 0.46), PANEL, [0.4, 0.19, 0]);

    // Hub the ring spins around.
    bake(parts, new THREE.CylinderGeometry(0.72, 0.72, 1.35, 20), HULL,
      [HUB_X, 0, 0], [0, 0, Math.PI / 2]);
    bake(parts, new THREE.CylinderGeometry(0.4, 0.72, 0.5, 20), HULL_DIM,
      [HUB_X - 0.92, 0, 0], [0, 0, Math.PI / 2]);

    // Comms dish at the sunward end — a station talks to somebody.
    bake(parts, new THREE.CylinderGeometry(0.05, 0.05, 1.1, 8), STRUT,
      [-3.6, 0.45, 0], [0, 0, 0.5]);
    bake(parts, new THREE.SphereGeometry(0.85, 20, 12, 0, Math.PI * 2, 0, 0.6), HULL,
      [-3.95, 0.95, 0], [0.4, 0, -2.2]);

    // Radiator fins, dark and thin, hung below the truss mid-span.
    bake(parts, new THREE.BoxGeometry(2.1, 0.02, 0.62), PANEL, [1.4, -0.5, 0.22], [0.35, 0, 0]);
    bake(parts, new THREE.BoxGeometry(2.1, 0.02, 0.62), PANEL, [1.4, -0.5, -0.22], [-0.35, 0, 0]);

    // Propellant tanks clustered off-axis near the dish end.
    bake(parts, new THREE.SphereGeometry(0.34, 14, 10), TANK, [-2.5, -0.42, 0.3]);
    bake(parts, new THREE.SphereGeometry(0.34, 14, 10), HULL_DIM, [-2.9, -0.35, -0.28]);
    bake(parts, new THREE.SphereGeometry(0.26, 12, 8), TANK, [-2.15, -0.5, -0.18]);

    // Docking arm reaching out of the plane of everything else (+Z),
    // ending at the visitor berth. Kinked once — assembled, not drawn.
    bake(parts, new THREE.BoxGeometry(0.16, 0.16, 2.2), STRUT, [2.6, 0.1, 1.15], [0.12, 0, 0]);
    bake(parts, new THREE.BoxGeometry(0.16, 0.16, 1.4), STRUT, [2.6, 0.32, 2.85], [-0.1, 0, 0]);
    bake(parts, new THREE.BoxGeometry(0.5, 0.34, 0.5), HULL_DIM, [2.6, 0.3, 3.6]);

    // Running-light masts at the truss ends.
    bake(parts, new THREE.BoxGeometry(0.05, 0.7, 0.05), STRUT, [4.05, 0.3, 0]);

    return mergeGeometries(parts, false)!;
  }, []);
}

/** Rotating assembly: hab ring, spokes, and its greebles. */
function useRing() {
  return useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];

    // Hab ring around the X axis (torus is XY-planar by default).
    bake(parts, new THREE.TorusGeometry(RING_R, RING_TUBE, 12, 48), HULL,
      [0, 0, 0], [0, Math.PI / 2, 0]);

    // Four spokes — they spin with the ring, as spokes do.
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      bake(parts, new THREE.CylinderGeometry(0.06, 0.06, RING_R, 8), HULL_DIM,
        [0, Math.cos(a) * RING_R * 0.5, Math.sin(a) * RING_R * 0.5], [a + Math.PI / 2, 0, 0]);
    }

    // Module blocks on the ring — mass, not decoration, so a few and uneven.
    const moduleAngles = [0.4, 1.1, 2.9, 4.6];
    for (const a of moduleAngles) {
      bake(parts, new THREE.BoxGeometry(0.5, 0.5, 0.72), PANEL,
        [0, Math.cos(a) * RING_R, Math.sin(a) * RING_R], [a + Math.PI / 2, 0, 0]);
    }

    return mergeGeometries(parts, false)!;
  }, []);
}

/** Lit windows: one InstancedMesh strip around the hab ring. The warm
    pinpricks are the human-scale ruler that makes the station big. */
function Windows() {
  const tier = useJourney((s) => s.tier);
  const count = Math.round(QUALITY[tier].moonSegments * 4.5); // 72/54/36
  const mesh = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const mat = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    let seed = 977;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    let placed = 0;
    while (placed < m.count) {
      const a = rand() * Math.PI * 2;
      // Windows cluster on the ring's outer face, with dark gaps.
      if (rand() < 0.3) continue;
      const r = RING_R + RING_TUBE * 0.86;
      const jitter = (rand() - 0.5) * 0.16;
      e.set(a + Math.PI / 2, 0, 0);
      q.setFromEuler(e);
      mat.compose(
        new THREE.Vector3(jitter, Math.cos(a) * r, Math.sin(a) * r),
        q,
        new THREE.Vector3(1, 1, 1),
      );
      m.setMatrixAt(placed, mat);
      placed++;
    }
    m.instanceMatrix.needsUpdate = true;
  }, [count]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} key={count}>
      <boxGeometry args={[0.1, 0.028, 0.056]} />
      <meshBasicMaterial color={WINDOW_WARM} toneMapped={false} />
    </instancedMesh>
  );
}

/** Slow aviation-style strobe. Phase-offset per instance so the station
    never blinks in lockstep — synchronized lights read as a screensaver. */
function Strobe({
  position,
  color,
  offset,
}: {
  position: [number, number, number];
  color: string;
  offset: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const reducedMotion = useJourney((s) => s.reducedMotion);

  useFrame((state) => {
    const mat = ref.current?.material as THREE.MeshBasicMaterial | undefined;
    if (!mat) return;
    if (reducedMotion) {
      mat.opacity = 0.7;
      return;
    }
    const phase = (state.clock.elapsedTime + offset) % 3.2;
    mat.opacity = phase < 0.14 ? 1 : 0.05;
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.055, 8, 8]} />
      <meshBasicMaterial color={color} transparent toneMapped={false} />
    </mesh>
  );
}

export function Waystation() {
  const root = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Group>(null);
  const reducedMotion = useJourney((s) => s.reducedMotion);
  const structure = useStructure();
  const ringGeo = useRing();

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.55,
        metalness: 0.3,
      }),
    [],
  );

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    registerBody('waystation', node);
    return () => unregisterBody('waystation');
  }, []);

  useFrame((_, delta) => {
    // Documentary tempo: one revolution in ~90 seconds.
    if (!reducedMotion && ring.current) ring.current.rotation.x += delta * 0.07;
  });

  return (
    /* Tilted off every axis: a station assembled in orbit answers to its
       own geometry, not the ecliptic's. Also breaks up the silhouette. */
    <group ref={root} rotation={[0.14, 0.55, 0.1]}>
      <mesh geometry={structure} material={material} />

      <group ref={ring} position={[HUB_X, 0, 0]}>
        <mesh geometry={ringGeo} material={material} />
        <Windows />
      </group>

      {/* Berth collar — the cyan ring the Milano is nosed into. */}
      <mesh position={[2.6, 0.3, 3.95]}>
        <torusGeometry args={[0.52, 0.05, 8, 28]} />
        {/* A berth guide light, not a portal: dimmed well below the
            bloom threshold so it frames the nose without shouting. */}
        <meshBasicMaterial color="#4a92a8" toneMapped={false} />
      </mesh>

      {/* Berth floodlight — the approach shot's key light. The sun is 84
          units sunward, so a docked ship on the far side would otherwise
          read as pure silhouette. Mounted permanently in this always-on
          scene, so the light count never changes mid-session. */}
      <pointLight position={[2.7, 2.1, 6.6]} intensity={9} distance={13} color="#ffd9b0" />

      <Strobe position={[4.05, 0.72, 0]} color="#ff5f57" offset={0} />
      <Strobe position={[-3.95, 1.35, 0]} color="#ffb35c" offset={1.7} />

      {/* The Milano, nose into the collar, parked slightly crooked —
          eleven years at a fifteen-minute berth breeds complacency. */}
      <Milano position={[2.6, 0.3, 6.15]} rotation={[0.02, 0.1, -0.16]} />
    </group>
  );
}
