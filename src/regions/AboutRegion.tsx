import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Planet } from '@/scene/Planet';
import { QUALITY } from '@/scene/quality';
import { useJourney } from '@/store/journey';
import { WORLDS } from '@/data/worlds';

const WORLD = WORLDS['hd-189733-b'];

/**
 * The silicate haze layer. HD 189733 b is blue because of particles
 * suspended above the cloud deck, not because of anything below — so the
 * haze belongs on its own slightly larger, slowly counter-rotating shell
 * rather than baked into the surface.
 */
function HazeShell({ radius, segments }: { radius: number; segments: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const reducedMotion = useJourney((s) => s.reducedMotion);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#4a7fd0'),
        transparent: true,
        opacity: 0.11,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.FrontSide,
      }),
    [],
  );

  useFrame((_, delta) => {
    // Counter-rotating slower than the body: superrotating haze aloft.
    if (!reducedMotion && ref.current) ref.current.rotation.y -= delta * 0.018;
  });

  return (
    <mesh ref={ref} scale={1.028} material={material}>
      <sphereGeometry args={[radius, segments / 2, segments / 4]} />
    </mesh>
  );
}

/**
 * Glass rain, as streaks rather than droplets.
 *
 * On this planet the wind (≈8,700 km/h) massively outruns terminal
 * velocity, so condensing silicate travels almost horizontally. Modelling
 * it as short instanced streaks aligned to the wind vector reads correctly;
 * falling particles would read as snow, which is the wrong physics.
 */
function GlassRain({ radius, count }: { radius: number; count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const reducedMotion = useJourney((s) => s.reducedMotion);

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        // Distribute over the sphere, biased away from the poles where the
        // zonal jets are weakest.
        lat: (Math.sin(i * 2.399) * 0.72) * (Math.PI / 2),
        lon: (i * 2.399) % (Math.PI * 2),
        r: radius * (1.012 + ((i * 37) % 11) / 900),
        speed: 0.5 + ((i * 53) % 40) / 60,
        len: 0.06 + ((i * 29) % 15) / 260,
      })),
    [count, radius],
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const phase = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current) return;
    if (!reducedMotion) phase.current += delta;

    seeds.forEach((s, i) => {
      const lon = s.lon + phase.current * s.speed * 0.42;
      const cosLat = Math.cos(s.lat);
      dummy.position.set(
        s.r * cosLat * Math.cos(lon),
        s.r * Math.sin(s.lat),
        s.r * cosLat * Math.sin(lon),
      );
      // Lay each streak down along the direction of travel.
      dummy.lookAt(0, 0, 0);
      dummy.rotateY(Math.PI / 2);
      dummy.scale.set(s.len, 0.004, 0.004);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial
        color="#bcd8ff"
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

/**
 * HD 189733 b. Framed to one side so the dossier panel has room — the
 * planet is the visual focus, but the text is the point, and neither
 * should be fighting the other for the same pixels.
 */
export function AboutRegion() {
  const tier = useJourney((s) => s.tier);
  const budget = QUALITY[tier];
  const rainCount = tier === 'low' ? 0 : tier === 'medium' ? 90 : 170;

  return (
    <group position={[-2.4, -0.3, 0]}>
      <Planet world={WORLD} lightDir={[0.85, 0.4, 0.55]}>
        <HazeShell radius={WORLD.radius} segments={budget.planetSegments} />
        <GlassRain radius={WORLD.radius} count={rainCount} />
      </Planet>
    </group>
  );
}
