import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Planet } from './Planet';
import { Hotspot } from './Hotspot';
import { QUALITY } from './quality';
import { useJourney } from '@/store/journey';
import { setHoverTarget } from '@/store/hover';
import { WORLDS } from '@/data/worlds';
import { blip } from '@/audio/ambience';

const WORLD = WORLDS['hd-189733-b'];

/**
 * The silicate haze layer. HD 189733 b is blue because of particles
 * suspended above the cloud deck — so the haze lives on its own slowly
 * counter-rotating shell rather than baked into the surface.
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
    if (!reducedMotion && ref.current) ref.current.rotation.y -= delta * 0.018;
  });

  return (
    <mesh ref={ref} scale={1.028} material={material}>
      <sphereGeometry args={[radius, segments / 2, segments / 4]} />
    </mesh>
  );
}

/**
 * Glass rain as streaks, not droplets: at ≈8,700 km/h the wind outruns
 * terminal velocity, so condensing silicate travels almost horizontally.
 */
function GlassRain({ radius, count }: { radius: number; count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const reducedMotion = useJourney((s) => s.reducedMotion);

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        lat: Math.sin(i * 2.399) * 0.72 * (Math.PI / 2),
        lon: (i * 2.399) % (Math.PI * 2),
        r: radius * (1.012 + ((i * 37) % 11) / 900),
        speed: 0.5 + ((i * 53) % 40) / 60,
        len: 0.05 + ((i * 29) % 15) / 320,
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
      dummy.lookAt(0, 0, 0);
      dummy.rotateY(Math.PI / 2);
      dummy.scale.set(s.len, 0.003, 0.003);
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

/** HD 189733 b, ready to be hung on an orbit. */
export function AboutPlanet() {
  const tier = useJourney((s) => s.tier);
  const travelTo = useJourney((s) => s.travelTo);
  const budget = QUALITY[tier];
  const rainCount = tier === 'low' ? 0 : tier === 'medium' ? 90 : 170;

  const camera = useThree((s) => s.camera);
  const viewport = useThree((s) => s.size);
  const projected = useMemo(() => new THREE.Vector3(), []);
  const anchor = useRef<THREE.Group>(null);
  const hovered = useRef(false);

  useFrame(() => {
    if (!hovered.current || !anchor.current) return;
    anchor.current.getWorldPosition(projected);
    projected.project(camera);
    setHoverTarget({
      id: 'about',
      label: 'About the pilot',
      sub: WORLD.displayName,
      accent: WORLD.accent,
      x: ((projected.x + 1) / 2) * viewport.width,
      y: ((1 - projected.y) / 2) * viewport.height,
    });
  });

  return (
    <group ref={anchor}>
      <Planet world={WORLD} sunlit>
        <HazeShell radius={WORLD.radius} segments={budget.planetSegments} />
        <GlassRain radius={WORLD.radius} count={rainCount} />
      </Planet>

      {/* Clickable like every other body — a place, not a prop. */}
      <Hotspot
        radius={WORLD.radius * 1.3}
        minPixels={56}
        label={`${WORLD.displayName} — about the pilot`}
        onHoverChange={(h) => {
          hovered.current = h;
          if (h) blip('select');
          else setHoverTarget(null);
        }}
        onSelect={() => {
          blip('approach');
          setHoverTarget(null);
          travelTo('about');
        }}
      />
    </group>
  );
}
