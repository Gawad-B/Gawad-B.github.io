import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STAR_VERTEX, STAR_FRAGMENT, starUniforms } from './shaders/star.glsl';
import { ATMO_VERTEX, ATMO_FRAGMENT, atmoUniforms } from './shaders/atmosphere.glsl';
import { OrbitPath } from './OrbitPath';
import { AboutPlanet } from './AboutPlanet';
import { SaturnSystem } from './SaturnSystem';
import { ProjectWorld } from './ProjectWorld';
import { Waystation } from './Waystation';
import { QUALITY } from './quality';
import { registerBody, unregisterBody } from './bodies';
import { markBoot } from '@/store/boot';
import { useJourney } from '@/store/journey';
import { WORLDS, PROJECT_WORLDS } from '@/data/worlds';

const SUN = WORLDS['stephenson-2-18'];

/* ------------------------------------------------------------------
   Orbital layout.

   One shared plan so the camera resolvers, the orbit lines and the
   bodies themselves can never disagree. Angular speed follows Kepler
   (ω ∝ r^-1.5) but glacially — the system should read as alive, not as
   a clockwork toy — and the six project worlds start clustered in one
   arc so the belt shot can frame them together.
   ------------------------------------------------------------------ */
interface OrbitSpec {
  id: string;
  radius: number;
  phase: number;
  inclination: number;
}

const KEPLER_K = 1.15;

const ORBITS: OrbitSpec[] = [
  { id: 'hd-189733-b', radius: 19, phase: 0.62, inclination: 3 },
  { id: 'saturn', radius: 30, phase: 3.45, inclination: -2 },
  /* Aphelion Station: past the belt (which ends at 78), inside r≈86 so
     the whole structure stays inside the system-overview frustum at
     every orbital phase; the start phase sits ~180° from the belt arc
     so neither photobombs the other for the length of any real visit. */
  { id: 'waystation', radius: 84, phase: 1.05, inclination: 5 },
  ...PROJECT_WORLDS.map((w, i) => ({
    id: w.id,
    /* Starts OUTSIDE Saturn's moon field: Saturn orbits at 30 and its
       outer skill shell reaches ~14 further, so anything nearer than ~47
       gets photobombed by moons at point-blank range. */
    radius: 48 + i * 6,
    // Clustered across ~100° so the belt reads as a belt.
    phase: 3.9 + i * 0.34,
    inclination: (i % 2 === 0 ? 1 : -1) * (1.5 + i * 0.5),
  })),
];

function Orbiting({
  spec,
  children,
}: {
  spec: OrbitSpec;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const reducedMotion = useJourney((s) => s.reducedMotion);
  const angle = useRef(spec.phase);
  const omega = KEPLER_K / Math.pow(spec.radius, 1.5);
  const inc = THREE.MathUtils.degToRad(spec.inclination);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    registerBody(spec.id, node);
    return () => unregisterBody(spec.id);
  }, [spec.id]);

  // Place the body before the first paint so camera resolvers that run on
  // frame zero aim at the real position, not the group's default origin.
  useEffect(() => {
    place(angle.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const place = (a: number) => {
    const node = ref.current;
    if (!node) return;
    // Circle in the ecliptic, tilted about Z — matching OrbitPath exactly.
    const x = Math.cos(a) * spec.radius;
    const z = Math.sin(a) * spec.radius;
    node.position.set(x * Math.cos(inc), x * Math.sin(inc), z);
  };

  useFrame((_, delta) => {
    if (!reducedMotion) angle.current += omega * delta;
    place(angle.current);
  });

  return <group ref={ref}>{children}</group>;
}

/** Stephenson 2 is an open cluster — the star has neighbours, far behind. */
function ClusterStars() {
  const geometry = useMemo(() => {
    let seed = 2718;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const n = 90;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const r = 160 + Math.pow(rand(), 0.6) * 340;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(rand() * 2 - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
      pos[i * 3 + 2] = -220 - rand() * 380;
      c.set(rand() > 0.78 ? '#ffd9a8' : '#ff9a6a');
      const mag = 0.3 + rand() * 0.7;
      col[i * 3] = c.r * mag;
      col[i * 3 + 1] = c.g * mag;
      col[i * 3 + 2] = c.b * mag;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, []);

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={2.4}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** The star itself. Dim per unit area — the drama is convection and scale. */
function Sun() {
  const tier = useJourney((s) => s.tier);
  const reducedMotion = useJourney((s) => s.reducedMotion);
  const budget = QUALITY[tier];
  const body = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => starUniforms(budget.octaves), [budget.octaves]);
  const chromo = useMemo(() => atmoUniforms('#ff5722', 1.35, 2.1), []);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    if (!reducedMotion && body.current) body.current.rotation.y += SUN.spin * delta * 0.35;
  });

  const segments = Math.max(64, budget.planetSegments);

  return (
    <group>
      <mesh ref={body}>
        <sphereGeometry args={[SUN.radius, segments, segments / 2]} />
        <shaderMaterial vertexShader={STAR_VERTEX} fragmentShader={STAR_FRAGMENT} uniforms={uniforms} />
      </mesh>
      {/* Chromosphere — generous, a hypergiant's atmosphere is enormous. */}
      <mesh scale={1.09}>
        <sphereGeometry args={[SUN.radius, 48, 24]} />
        <shaderMaterial
          vertexShader={ATMO_VERTEX}
          fragmentShader={ATMO_FRAGMENT}
          uniforms={chromo}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/**
 * The heliocentric scene: Stephenson 2-18 at the origin and everything
 * else orbiting it. Always mounted — the interior of the ship hides it
 * with `visible`, not by unmounting, so every shader compiles exactly
 * once, during the loading screen. That is also the fix for the "black
 * screen entering projects" report: there is no longer a lazy region
 * whose dozen materials compile mid-flight.
 */
export function SolarSystem() {
  const region = useJourney((s) => s.region);

  useEffect(() => {
    markBoot('region');
  }, []);

  return (
    <group visible={region !== 'milano-interior'}>
      <Sun />
      <ClusterStars />

      {/* One light, at the star, like the real thing. decay 0 keeps the
          outer belt lit without a second rig. */}
      <pointLight position={[0, 0, 0]} intensity={2.4} decay={0} color="#ffe0c2" />
      <ambientLight intensity={0.16} color="#3d4a68" />

      {/* Orbit lines — the system diagram drawn into space. */}
      {ORBITS.map((o) => (
        <OrbitPath
          key={`path-${o.id}`}
          radius={o.radius}
          inclination={o.inclination}
          color="#8a94a8"
          opacity={0.1}
          segments={192}
        />
      ))}

      {ORBITS.map((o) => (
        <Orbiting key={o.id} spec={o}>
          {o.id === 'hd-189733-b' && <AboutPlanet />}
          {o.id === 'saturn' && <SaturnSystem />}
          {o.id === 'waystation' && <Waystation />}
          {PROJECT_WORLDS.some((w) => w.id === o.id) && (
            <ProjectWorld world={PROJECT_WORLDS.find((w) => w.id === o.id)!} />
          )}
        </Orbiting>
      ))}
    </group>
  );
}
