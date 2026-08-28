import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Hotspot } from './Hotspot';
import { registerBody, unregisterBody } from './bodies';
import { useJourney } from '@/store/journey';
import { setHoverTarget } from '@/store/hover';
import { MILANO } from '@/data/milano';
import { blip } from '@/audio/ambience';

/**
 * The Milano.
 *
 * ORIGINAL geometry, built from primitives: no third-party model file and
 * no reproduction of anyone's design. Long fuselage, forward-swept wings,
 * twin nacelles, canopy. Chipped orange-and-blue plating, because a
 * salvage hauler should look like it has been somewhere.
 *
 * Docked at Aphelion Station's visitor berth — a 15-minute berth it has
 * occupied for eleven years, which is the closest this pilot gets to
 * legal parking.
 *
 * The hull is MERGED: every opaque primitive is baked into one
 * vertex-coloured geometry (1 draw call instead of 12), the three engine
 * glows into another. That reclaimed budget is what pays for the station.
 */

/* Big enough to read as a vehicle from the region shots. At 1x it was a
   1.4-unit speck — technically present, practically invisible. */
const SHIP_SCALE = 2.3;

const HULL_BLUE = '#2c4a68';
const HULL_ORANGE = '#b8541f';
const HULL_DARK = '#1a2230';
const ENGINE_GLOW = '#7fd4e8';

/** Bake one primitive into the merge list with a solid vertex colour. */
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
  // A single merged material can't vary per piece, so drop per-geometry
  // UVs (unused — everything is flat colour) to keep attributes uniform.
  g.deleteAttribute('uv');
  list.push(g);
}

function useShipGeometry() {
  return useMemo(() => {
    const hull: THREE.BufferGeometry[] = [];
    // Fuselage — a stretched capsule, nose forward on -Z.
    bake(hull, new THREE.CapsuleGeometry(0.19, 0.92, 6, 16), HULL_BLUE, [0, 0, 0], [Math.PI / 2, 0, 0]);
    // Nose cone
    bake(hull, new THREE.ConeGeometry(0.19, 0.34, 16), HULL_ORANGE, [0, 0, -0.78], [-Math.PI / 2, 0, 0]);
    for (const side of [-1, 1]) {
      // Forward-swept wings — swept toward the nose, the whole silhouette.
      bake(hull, new THREE.BoxGeometry(0.72, 0.035, 0.3), HULL_BLUE,
        [side * 0.44, -0.02, 0.06], [0, side * -0.34, side * 0.12]);
      // Wing stripe
      bake(hull, new THREE.BoxGeometry(0.3, 0.038, 0.075), HULL_ORANGE,
        [side * 0.6, -0.005, 0.06], [0, side * -0.34, side * 0.12]);
      // Nacelle on the wingtip
      bake(hull, new THREE.CylinderGeometry(0.072, 0.06, 0.44, 12), HULL_DARK,
        [side * 0.78, -0.03, 0.18], [Math.PI / 2, 0, 0]);
      // Landing skids — vestigial now; it docks more than it lands.
      bake(hull, new THREE.BoxGeometry(0.035, 0.12, 0.42), HULL_DARK, [side * 0.16, -0.21, 0.05]);
    }
    // Dorsal fin
    bake(hull, new THREE.BoxGeometry(0.03, 0.28, 0.26), HULL_DARK, [0, 0.22, 0.34], [0.28, 0, 0]);
    // Main thruster cluster
    bake(hull, new THREE.CylinderGeometry(0.15, 0.17, 0.16, 14), HULL_DARK, [0, 0, 0.56], [Math.PI / 2, 0, 0]);

    // The engines are cold; the bells still carry standby glow.
    // Standby glow, not thrust: small and dimmed — a cold engine's pilot
    // light. Full-brightness discs at docking range read as toys.
    const glow: THREE.BufferGeometry[] = [];
    for (const side of [-1, 1]) {
      bake(glow, new THREE.CircleGeometry(0.042, 12), '#4e8fa2', [side * 0.78, -0.03, 0.41]);
    }
    bake(glow, new THREE.CircleGeometry(0.085, 14), '#4e8fa2', [0, 0, 0.645]);

    return {
      hull: mergeGeometries(hull, false)!,
      glow: mergeGeometries(glow, false)!,
    };
  }, []);
}

function ShipBody() {
  const geo = useShipGeometry();
  const materials = useMemo(
    () => ({
      hull: new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.55,
        metalness: 0.34,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#0d1a2a'),
        roughness: 0.12,
        metalness: 0.9,
        emissive: new THREE.Color('#1d3a52'),
        emissiveIntensity: 0.5,
      }),
      engine: new THREE.MeshBasicMaterial({
        color: new THREE.Color(ENGINE_GLOW),
        toneMapped: false,
      }),
    }),
    [],
  );

  return (
    <group>
      <mesh geometry={geo.hull} material={materials.hull} />
      <mesh geometry={geo.glow} material={materials.engine} />
      {/* Canopy — offset up and forward, faceted rather than smooth.
          Separate: glass wants its own roughness and emissive. */}
      <mesh material={materials.glass} position={[0, 0.13, -0.38]} scale={[0.9, 0.6, 1.5]}>
        <icosahedronGeometry args={[0.15, 1]} />
      </mesh>
    </group>
  );
}

/** Anchor beacon: a double-flash red strobe, the universal signal for
    "parked, unattended, please do not tow". Also how the eye finds a
    dark hull against the void from across the system. */
function Beacon() {
  const ref = useRef<THREE.Mesh>(null);
  const reducedMotion = useJourney((s) => s.reducedMotion);

  useFrame((state) => {
    const mat = ref.current?.material as THREE.MeshBasicMaterial | undefined;
    if (!mat) return;
    if (reducedMotion) {
      mat.opacity = 0.85;
      return;
    }
    const phase = state.clock.elapsedTime % 2.4;
    const on = phase < 0.12 || (phase > 0.3 && phase < 0.42);
    mat.opacity = on ? 1 : 0.08;
  });

  return (
    <mesh ref={ref} position={[0, 0.42, 0.4]}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial color="#ff5f57" transparent toneMapped={false} />
    </mesh>
  );
}

/** The engines are cold; only the standby lamps are lit. They double as
    the berth's fill light — the station adds no light of its own, because
    changing the scene's light count would recompile every lit shader. */
function StandbyLamps() {
  const ref = useRef<THREE.PointLight>(null);
  const reducedMotion = useJourney((s) => s.reducedMotion);

  useFrame((state) => {
    if (!ref.current) return;
    // Irregular flicker — a ship that has been sitting a while.
    const t = state.clock.elapsedTime;
    ref.current.intensity = reducedMotion
      ? 0.5
      : 0.34 + Math.abs(Math.sin(t * 1.7) * Math.sin(t * 0.43)) * 0.5;
  });

  return <pointLight ref={ref} position={[0, 0.05, 0.4]} color={ENGINE_GLOW} distance={9} />;
}

interface Props {
  /** Berth position in the station's local frame. */
  position: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * The contact entry point, docked wherever the station puts it. It has a
 * HUD nav entry too, so discovering it is a bonus rather than a
 * requirement — an easter egg that gates your contact details isn't an
 * easter egg, it's a maze.
 */
export function Milano({ position, rotation = [0, 0, 0] }: Props) {
  const group = useRef<THREE.Group>(null);
  const enterMilano = useJourney((s) => s.enterMilano);
  const reducedMotion = useJourney((s) => s.reducedMotion);
  const [hovered, setHovered] = useState(false);

  const camera = useThree((s) => s.camera);
  const viewport = useThree((s) => s.size);
  const projected = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const node = group.current;
    if (!node) return;
    registerBody('milano-ship', node);
    return () => unregisterBody('milano-ship');
  }, []);

  useFrame((state) => {
    if (!group.current) return;

    if (!reducedMotion) {
      const t = state.clock.elapsedTime;
      // Docked, not rigid: a slow breath against the berth clamps.
      group.current.rotation.z = rotation[2] + Math.sin(t * 0.21) * 0.012;
      group.current.position.y = position[1] + Math.sin(t * 0.28) * 0.02;
    }

    // Keep the marker pinned to the ship while it's hovered.
    if (!hovered) return;
    group.current.getWorldPosition(projected);
    projected.project(camera);
    setHoverTarget({
      id: 'milano',
      label: MILANO.name,
      sub: MILANO.marker,
      accent: '#ff5f57',
      x: ((projected.x + 1) / 2) * viewport.width,
      y: ((1 - projected.y) / 2) * viewport.height,
    });
  });

  return (
    <group ref={group} position={position} rotation={rotation}>
      <group scale={hovered ? SHIP_SCALE * 1.05 : SHIP_SCALE}>
        <ShipBody />
        <StandbyLamps />
        <Beacon />
      </group>

      <Hotspot
        radius={1.7}
        minPixels={56}
        label={`${MILANO.name} — open contact console`}
        onHoverChange={(h) => {
          setHovered(h);
          if (h) blip('select');
          else setHoverTarget(null);
        }}
        onSelect={() => {
          blip('approach');
          setHoverTarget(null);
          enterMilano();
        }}
      />
    </group>
  );
}
