import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STAR_VERTEX, STAR_FRAGMENT, starUniforms } from '@/scene/shaders/star.glsl';
import { ATMO_VERTEX, ATMO_FRAGMENT, atmoUniforms } from '@/scene/shaders/atmosphere.glsl';
import { QUALITY } from '@/scene/quality';
import { useJourney } from '@/store/journey';
import { WORLDS } from '@/data/worlds';

const STAR = WORLDS['stephenson-2-18'];

/** Deterministic PRNG so the dust lanes are the same every visit. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/**
 * Foreground dust on two planes at different depths. This is the whole
 * scale trick: a 2,150 R☉ star has no visual scale reference on its own,
 * so the sense of size comes from things passing in front of it at
 * different rates.
 */
function DustLanes({ count }: { count: number }) {
  const near = useRef<THREE.Points>(null);
  const far = useRef<THREE.Points>(null);

  const [nearGeo, farGeo] = useMemo(() => {
    const make = (n: number, spread: number, depth: number, seed: number) => {
      const rand = rng(seed);
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = (rand() - 0.5) * spread;
        // Flattened vertically — these read as lanes, not a cloud.
        pos[i * 3 + 1] = (rand() - 0.5) * spread * 0.26;
        pos[i * 3 + 2] = depth + (rand() - 0.5) * 24;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      return g;
    };
    return [make(count, 260, 118, 9137), make(Math.round(count * 0.7), 340, 74, 5521)];
  }, [count]);

  useFrame((_, delta) => {
    // Near plane drifts faster — that differential IS the parallax.
    if (near.current) near.current.position.x -= delta * 0.85;
    if (far.current) far.current.position.x -= delta * 0.3;
    if (near.current && near.current.position.x < -130) near.current.position.x = 130;
    if (far.current && far.current.position.x < -170) far.current.position.x = 170;
  });

  if (count === 0) return null;

  return (
    <>
      <points ref={far} geometry={farGeo} frustumCulled={false}>
        <pointsMaterial size={0.5} color="#2a1410" transparent opacity={0.5} sizeAttenuation depthWrite={false} />
      </points>
      <points ref={near} geometry={nearGeo} frustumCulled={false}>
        <pointsMaterial size={0.9} color="#140a08" transparent opacity={0.72} sizeAttenuation depthWrite={false} />
      </points>
    </>
  );
}

/** Stephenson 2 is an open cluster — the star has neighbours. */
function ClusterStars() {
  const geometry = useMemo(() => {
    const rand = rng(2718);
    const n = 90;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      // Clustered, not uniform — pushed behind the star.
      const r = 120 + Math.pow(rand(), 0.6) * 300;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(rand() * 2 - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
      pos[i * 3 + 2] = -180 - rand() * 320;
      // Red supergiant cluster: mostly cool stars.
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

/**
 * Stephenson 2-18. A 3,200 K hypergiant is genuinely dim per unit area —
 * so the impact has to come from scale and convection structure, not from
 * brightness. It sits mostly off the bottom of frame so the limb runs off
 * screen, which reads bigger than a sphere you can see all of.
 */
export function HeroRegion() {
  const tier = useJourney((s) => s.tier);
  const reducedMotion = useJourney((s) => s.reducedMotion);
  const budget = QUALITY[tier];

  const body = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => starUniforms(budget.octaves), [budget.octaves]);
  const chromo = useMemo(() => atmoUniforms('#ff5722', 1.35, 2.1), []);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    if (!reducedMotion && body.current) body.current.rotation.y += STAR.spin * delta * 0.35;
  });

  const segments = Math.max(64, budget.planetSegments);

  return (
    <group>
      <ClusterStars />

      {/* Pushed down-right and forward so the limb leaves frame on two
          edges. You should never see the whole disc: a sphere you can see
          all of reads as a ball, and this thing is 2,150 solar radii. */}
      <group position={[34, -46, 12]}>
        <mesh ref={body}>
          <sphereGeometry args={[STAR.radius, segments, segments / 2]} />
          <shaderMaterial
            vertexShader={STAR_VERTEX}
            fragmentShader={STAR_FRAGMENT}
            uniforms={uniforms}
          />
        </mesh>

        {/* Extended chromosphere — a hypergiant's atmosphere is enormous
            and diffuse, so this shell is generously scaled. */}
        <mesh scale={1.09}>
          <sphereGeometry args={[STAR.radius, 48, 24]} />
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

      <DustLanes count={budget.dust > 0 ? Math.round(budget.dust * 0.5) : 0} />
    </group>
  );
}
