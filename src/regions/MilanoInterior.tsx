import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { MonitorScreen } from '@/ui/MonitorScreen';
import { SaturnRings } from '@/scene/SaturnRings';
import { Planet } from '@/scene/Planet';
import { WORLDS } from '@/data/worlds';
import { useJourney } from '@/store/journey';

const SATURN = WORLDS.saturn;

/**
 * The cockpit.
 *
 * The hull is an OPEN-ENDED tube, not a capsule. The first version closed
 * the geometry, which meant the camera sat inside a sealed shell looking at
 * the inside of the hull — there was no canopy, and Saturn was occluded by
 * the very thing that was supposed to frame it. An interior you cannot see
 * out of is a room, and the whole point of parking in the ring gap is that
 * you can see where you left the universe.
 */
function Cockpit() {
  const materials = useMemo(
    () => ({
      hull: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#1a2230'),
        roughness: 0.78,
        metalness: 0.42,
        side: THREE.BackSide,
      }),
      bulkhead: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#141a26'),
        roughness: 0.85,
        metalness: 0.3,
      }),
      trim: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#b8541f'),
        roughness: 0.55,
        metalness: 0.4,
      }),
      panel: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#0e131d'),
        roughness: 0.65,
        metalness: 0.5,
      }),
      seat: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#2a2028'),
        roughness: 0.92,
        metalness: 0.05,
      }),
      lamp: new THREE.MeshBasicMaterial({ color: new THREE.Color('#7fd4e8'), toneMapped: false }),
      warn: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb35c'), toneMapped: false }),
    }),
    [],
  );

  return (
    <group>
      {/* Hull walls: open at both ends, axis along Z, seen from inside. */}
      <mesh material={materials.hull} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.4]}>
        <cylinderGeometry args={[3.2, 3.2, 7.4, 28, 1, true]} />
      </mesh>

      {/* Rear bulkhead, so it isn't open space behind your head. */}
      <mesh material={materials.bulkhead} position={[0, 0, 3.3]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[3.2, 28]} />
      </mesh>

      {/* Ribbing along the walls. */}
      {[-2.4, -1.2, 0, 1.2, 2.4].map((z) => (
        <mesh key={z} material={materials.panel} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.16, 0.05, 6, 28]} />
        </mesh>
      ))}

      {/* Canopy frame, close enough to the camera to actually frame the
          view beyond — this is what reads as sitting behind a windscreen. */}
      <group position={[0, 0.1, -2.9]}>
        {[-2.1, -0.7, 0.7, 2.1].map((x) => (
          <mesh key={x} material={materials.trim} position={[x, 0, 0]} rotation={[0, 0, x * 0.1]}>
            <boxGeometry args={[0.06, 4.2, 0.1]} />
          </mesh>
        ))}
        <mesh material={materials.trim} position={[0, 2.05, 0]}>
          <boxGeometry args={[4.5, 0.08, 0.11]} />
        </mesh>
        <mesh material={materials.trim} position={[0, -0.1, 0]}>
          <boxGeometry args={[4.5, 0.06, 0.11]} />
        </mesh>
      </group>

      {/* Instrument shelf, tilted toward the pilot. */}
      <mesh material={materials.panel} position={[0, -1.05, -2.2]} rotation={[-0.4, 0, 0]}>
        <boxGeometry args={[3.4, 1.1, 0.12]} />
      </mesh>
      <mesh material={materials.trim} position={[0, -0.55, -2.42]} rotation={[-0.4, 0, 0]}>
        <boxGeometry args={[3.4, 0.05, 0.13]} />
      </mesh>

      {/* Status lamps. Most nominal, one insisting otherwise. */}
      {[-1.15, -0.85, -0.55, 0.55, 0.85, 1.15].map((x, i) => (
        <mesh
          key={x}
          material={i === 4 ? materials.warn : materials.lamp}
          position={[x, -0.78, -2.42]}
          rotation={[-0.4, 0, 0]}
        >
          <circleGeometry args={[0.03, 8]} />
        </mesh>
      ))}

      {/* Two seats, just inside peripheral vision. */}
      {[-1.25, 1.25].map((x) => (
        <group key={x} position={[x, -1.35, -0.3]}>
          <mesh material={materials.seat}>
            <boxGeometry args={[0.72, 0.16, 0.78]} />
          </mesh>
          <mesh material={materials.seat} position={[0, 0.58, 0.36]} rotation={[0.15, 0, 0]}>
            <boxGeometry args={[0.72, 1.1, 0.14]} />
          </mesh>
          <mesh material={materials.trim} position={[0, 0.12, -0.36]}>
            <boxGeometry args={[0.74, 0.05, 0.06]} />
          </mesh>
        </group>
      ))}

      {/* Overhead conduit — an interior with a bare ceiling reads as a
          room, not a vehicle. */}
      <mesh material={materials.panel} position={[0, 2.1, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 5.4, 8]} />
      </mesh>
      {[-2, -0.9, 0.2, 1.3, 2.4].map((z) => (
        <mesh key={z} material={materials.trim} position={[0, 2.1, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.06, 8]} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * The view through the canopy: Saturn and its rings, still turning outside.
 * This is the payoff for the ship being parked in the Cassini Division —
 * the reason the interior doesn't feel like a modal is that you can see
 * where you left the universe.
 */
function CanopyView() {
  const group = useRef<THREE.Group>(null);
  const reducedMotion = useJourney((s) => s.reducedMotion);

  useFrame((_, delta) => {
    // The ship is drifting slightly, so the view outside drifts with it.
    if (!reducedMotion && group.current) group.current.rotation.y += delta * 0.008;
  });

  return (
    <group ref={group} position={[-20, 6.5, -44]} rotation={[0.2, 0.5, 0.12]} scale={1.75}>
      <group scale={[1, 0.9, 1]}>
        <Planet world={SATURN} lightDir={[1, 0.42, 0.5]} />
      </group>
      <SaturnRings planetRadius={SATURN.radius} />
    </group>
  );
}

/** Interior lighting: panel glow from below plus a cool fill. */
function InteriorLights() {
  const flicker = useRef<THREE.PointLight>(null);
  const reducedMotion = useJourney((s) => s.reducedMotion);

  useFrame((state) => {
    if (!flicker.current) return;
    const t = state.clock.elapsedTime;
    flicker.current.intensity = reducedMotion
      ? 2.2
      : 1.8 + Math.abs(Math.sin(t * 2.3) * Math.sin(t * 0.61)) * 1.3;
  });

  return (
    <>
      {/* Instrument glow, up from the shelf — the classic cockpit key. */}
      <pointLight position={[0, -0.7, -2.0]} intensity={9} distance={7} color="#7fd4e8" />
      {/* Warm cabin fill from behind the seats. */}
      <pointLight position={[0, 1.2, 2.4]} intensity={7} distance={8} color="#ffb35c" />
      {/* A lamp that can't quite commit. */}
      <pointLight ref={flicker} position={[1.8, 1.1, -0.6]} distance={5} color="#ff5f57" />
      {/* Cold spill from the ring system outside. */}
      <directionalLight position={[-3, 1, -8]} intensity={1.3} color="#cfe0f5" />
      <ambientLight intensity={0.5} color="#3a4a68" />
    </>
  );
}

/**
 * The ship's computer: a physical housing bolted above the instrument
 * shelf, with the contact interface CSS-3D-projected onto its screen.
 * The visitor reads the machine, not a floating window — that's the
 * difference between being in a cockpit and being on a website.
 */
function Monitor() {
  const materials = useMemo(
    () => ({
      housing: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#1a2230'),
        roughness: 0.6,
        metalness: 0.5,
      }),
      trim: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#b8541f'),
        roughness: 0.55,
        metalness: 0.4,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#050a12'),
        roughness: 0.25,
        metalness: 0.7,
        emissive: new THREE.Color('#0a1622'),
        emissiveIntensity: 0.65,
      }),
    }),
    [],
  );

  return (
    <group position={[0, -0.18, -2.1]} rotation={[-0.08, 0, 0]}>
      {/* Housing shell */}
      <mesh material={materials.housing}>
        <boxGeometry args={[2.06, 1.5, 0.12]} />
      </mesh>
      {/* Accent trim along the top edge */}
      <mesh material={materials.trim} position={[0, 0.77, 0]}>
        <boxGeometry args={[2.06, 0.04, 0.13]} />
      </mesh>
      {/* Mounting arm down to the shelf */}
      <mesh material={materials.housing} position={[0, -0.86, -0.06]}>
        <boxGeometry args={[0.34, 0.5, 0.08]} />
      </mesh>
      {/* Dark glass face the UI sits on */}
      <mesh material={materials.glass} position={[0, 0, 0.062]}>
        <planeGeometry args={[1.94, 1.38]} />
      </mesh>

      {/* The interface, projected onto the glass. The scale constant is
          MEASURED, not derived: drei's transform mode maps px to world by
          an internal factor, so we rendered once, read the element's
          getBoundingClientRect, and solved for the scale that puts the
          660px document just inside the glass. */}
      <Html
        transform
        position={[0, 0, 0.075]}
        scale={0.135}
        zIndexRange={[24, 10]}
        style={{ pointerEvents: 'auto' }}
      >
        <MonitorScreen />
      </Html>

      {/* Glow the screen casts back into the cabin */}
      <pointLight position={[0, 0, 0.7]} intensity={2.6} distance={3.2} color="#7fd4e8" />
    </group>
  );
}

/** Lowers the airlock veil once the cockpit has actually been drawn —
    two frames, so the first (which may include shader compilation) and a
    clean one after it have both hit the screen. */
function VeilRelease() {
  const frames = useRef(0);
  useFrame(() => {
    if (frames.current > 2) return;
    frames.current += 1;
    if (frames.current === 2) useJourney.getState().lowerVeil();
  });
  return null;
}

export function MilanoInterior() {
  return (
    <group>
      <VeilRelease />
      <Cockpit />
      <CanopyView />
      <Monitor />
      <InteriorLights />
    </group>
  );
}
