import { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CASSINI_MID } from './SaturnRings';
import { Hotspot } from './Hotspot';
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
 * Parked in the Cassini Division — a real 4,700 km gap between the A and B
 * rings, and therefore the single worst legal parking space in the solar
 * system.
 */

const HULL_BLUE = '#2c4a68';
const HULL_ORANGE = '#b8541f';
const HULL_DARK = '#1a2230';
const ENGINE_GLOW = '#7fd4e8';

function ShipBody() {
  const materials = useMemo(
    () => ({
      hull: new THREE.MeshStandardMaterial({
        color: new THREE.Color(HULL_BLUE),
        roughness: 0.62,
        metalness: 0.58,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: new THREE.Color(HULL_ORANGE),
        roughness: 0.5,
        metalness: 0.45,
      }),
      dark: new THREE.MeshStandardMaterial({
        color: new THREE.Color(HULL_DARK),
        roughness: 0.8,
        metalness: 0.35,
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
      {/* Fuselage — a stretched capsule, nose forward on -Z. */}
      <mesh material={materials.hull} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.19, 0.92, 6, 16]} />
      </mesh>

      {/* Nose cone */}
      <mesh material={materials.accent} position={[0, 0, -0.78]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.19, 0.34, 16]} />
      </mesh>

      {/* Canopy — offset up and forward, faceted rather than smooth. */}
      <mesh material={materials.glass} position={[0, 0.13, -0.38]} scale={[0.9, 0.6, 1.5]}>
        <icosahedronGeometry args={[0.15, 1]} />
      </mesh>

      {/* Forward-swept wings. Swept toward the nose, which is the whole
          silhouette. */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh
            material={materials.hull}
            position={[side * 0.44, -0.02, 0.06]}
            rotation={[0, side * -0.34, side * 0.12]}
          >
            <boxGeometry args={[0.72, 0.035, 0.3]} />
          </mesh>
          {/* Wing stripe */}
          <mesh
            material={materials.accent}
            position={[side * 0.6, -0.005, 0.06]}
            rotation={[0, side * -0.34, side * 0.12]}
          >
            <boxGeometry args={[0.3, 0.038, 0.075]} />
          </mesh>
          {/* Nacelle on the wingtip */}
          <mesh
            material={materials.dark}
            position={[side * 0.78, -0.03, 0.18]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.072, 0.06, 0.44, 12]} />
          </mesh>
          {/* Engine bell, emissive */}
          <mesh material={materials.engine} position={[side * 0.78, -0.03, 0.41]}>
            <circleGeometry args={[0.058, 12]} />
          </mesh>
        </group>
      ))}

      {/* Dorsal fin */}
      <mesh material={materials.dark} position={[0, 0.22, 0.34]} rotation={[0.28, 0, 0]}>
        <boxGeometry args={[0.03, 0.28, 0.26]} />
      </mesh>

      {/* Main thruster cluster */}
      <mesh material={materials.dark} position={[0, 0, 0.56]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.17, 0.16, 14]} />
      </mesh>
      <mesh material={materials.engine} position={[0, 0, 0.645]}>
        <circleGeometry args={[0.125, 14]} />
      </mesh>

      {/* Landing skids — it is, after all, parked. */}
      {[-1, 1].map((side) => (
        <mesh key={`skid${side}`} material={materials.dark} position={[side * 0.16, -0.21, 0.05]}>
          <boxGeometry args={[0.035, 0.12, 0.42]} />
        </mesh>
      ))}
    </group>
  );
}

/** The engines are cold; only the standby lamps are lit. */
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

  return <pointLight ref={ref} position={[0, 0.05, 0.4]} color={ENGINE_GLOW} distance={3.5} />;
}

interface Props {
  planetRadius: number;
}

/**
 * Places the ship in the ring gap and makes it the contact entry point.
 * It has a HUD nav entry too, so discovering it is a bonus rather than a
 * requirement — an easter egg that gates your contact details isn't an
 * easter egg, it's a maze.
 */
export function Milano({ planetRadius }: Props) {
  const group = useRef<THREE.Group>(null);
  const enterMilano = useJourney((s) => s.enterMilano);
  const reducedMotion = useJourney((s) => s.reducedMotion);
  const [hovered, setHovered] = useState(false);

  const camera = useThree((s) => s.camera);
  const viewport = useThree((s) => s.size);
  const projected = useMemo(() => new THREE.Vector3(), []);

  // Sitting in the middle of the Cassini Division, off to one side of the
  // planet so it's silhouetted against the gap rather than lost in the ring.
  const orbitRadius = CASSINI_MID * planetRadius;
  const angle = -0.72;
  const position = useMemo<[number, number, number]>(
    () => [Math.cos(angle) * orbitRadius, 0.06, Math.sin(angle) * orbitRadius],
    [orbitRadius],
  );

  useFrame((state) => {
    if (!group.current) return;

    if (!reducedMotion) {
      const t = state.clock.elapsedTime;
      // Badly parked: rolled over, nose down, drifting very slightly.
      group.current.rotation.z = -0.34 + Math.sin(t * 0.21) * 0.02;
      group.current.rotation.x = 0.16 + Math.cos(t * 0.17) * 0.015;
      group.current.position.y = position[1] + Math.sin(t * 0.28) * 0.03;
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
    <group ref={group} position={position} rotation={[0.16, 2.1, -0.34]}>
      <group scale={hovered ? 1.06 : 1}>
        <ShipBody />
        <StandbyLamps />
      </group>

      <Hotspot
        radius={0.62}
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
