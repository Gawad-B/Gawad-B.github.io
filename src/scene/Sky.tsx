import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NEBULA_VERTEX, NEBULA_FRAGMENT, nebulaUniforms, NEBULA_PALETTES } from './shaders/nebula.glsl';
import { QUALITY } from './quality';
import { useJourney } from '@/store/journey';
import { DistantVessel } from './DistantVessel';

/** Deterministic PRNG — the sky must be identical across reloads. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Real stellar colour distribution. Most stars you can see are cool and
 * reddish; the blue-white ones are rare and that rarity is what makes a
 * starfield look photographed rather than generated.
 */
const STELLAR_CLASSES: Array<{ color: string; weight: number; size: number }> = [
  { color: '#9db4ff', weight: 0.03, size: 1.5 }, // O/B — rare, blue
  { color: '#cad7ff', weight: 0.06, size: 1.3 }, // A
  { color: '#f8f7ff', weight: 0.09, size: 1.1 }, // F
  { color: '#fff4e8', weight: 0.16, size: 1.0 }, // G — sun-like
  { color: '#ffd9a8', weight: 0.28, size: 0.9 }, // K
  { color: '#ffb07a', weight: 0.38, size: 0.8 }, // M — most common
];

function pickClass(r: number) {
  let acc = 0;
  for (const c of STELLAR_CLASSES) {
    acc += c.weight;
    if (r <= acc) return c;
  }
  return STELLAR_CLASSES[STELLAR_CLASSES.length - 1]!;
}

function Starfield({ count }: { count: number }) {
  const { geometry, material } = useMemo(() => {
    const rand = mulberry32(20260828);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const c = new THREE.Color();

    for (let i = 0; i < count; i++) {
      // Uniform on a sphere shell, pushed far out so parallax is subtle.
      const u = rand() * 2 - 1;
      const theta = rand() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const radius = 900 + rand() * 700;
      positions[i * 3] = s * Math.cos(theta) * radius;
      positions[i * 3 + 1] = s * Math.sin(theta) * radius;
      positions[i * 3 + 2] = u * radius;

      const cls = pickClass(rand());
      c.set(cls.color);
      // Vary apparent magnitude — a uniform-brightness field looks fake.
      const mag = 0.25 + Math.pow(rand(), 2.4) * 0.75;
      colors[i * 3] = c.r * mag;
      colors[i * 3 + 1] = c.g * mag;
      colors[i * 3 + 2] = c.b * mag;
      sizes[i] = cls.size * (1.4 + rand() * 2.0);
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const m = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        attribute float aSize;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (300.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        void main() {
          // Soft round point with a tight core — a square star is a tell.
          float d = length(gl_PointCoord - 0.5);
          float core = 1.0 - smoothstep(0.0, 0.5, d);
          gl_FragColor = vec4(vColor, core * core);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    return { geometry: g, material: m };
  }, [count]);

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

function Nebulae({ count, octaves }: { count: number; octaves: number }) {
  const group = useRef<THREE.Group>(null);
  const clouds = useMemo(() => {
    const rand = mulberry32(77712);
    return Array.from({ length: count }, (_, i) => {
      const u = rand() * 2 - 1;
      const theta = rand() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const radius = 620 + rand() * 240;
      const palette = NEBULA_PALETTES[i % NEBULA_PALETTES.length]!;
      return {
        key: i,
        position: [s * Math.cos(theta) * radius, s * Math.sin(theta) * radius * 0.6, u * radius] as [
          number,
          number,
          number,
        ],
        scale: 420 + rand() * 460,
        uniforms: nebulaUniforms(palette, 0.06 + rand() * 0.04, rand() * 100, octaves),
      };
    });
  }, [count, octaves]);

  useFrame((_, delta) => {
    for (const c of clouds) c.uniforms.uTime.value += delta;
    // Barely-there rotation: enough that the sky isn't a static backdrop.
    if (group.current) group.current.rotation.y += delta * 0.0012;
  });

  return (
    <group ref={group}>
      {clouds.map((c) => (
        <mesh key={c.key} position={c.position} scale={c.scale}>
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            vertexShader={NEBULA_VERTEX}
            fragmentShader={NEBULA_FRAGMENT}
            uniforms={c.uniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

function Dust({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const rand = mulberry32(4242);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand() - 0.5) * 200;
      positions[i * 3 + 1] = (rand() - 0.5) * 120;
      positions[i * 3 + 2] = (rand() - 0.5) * 200;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.008;
  });

  if (count === 0) return null;
  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={0.32}
        color="#8fa0b8"
        transparent
        opacity={0.32}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/**
 * The persistent sky. Mounted once for the life of the session and never
 * unmounted, so travelling between regions never rebuilds the starfield —
 * which is most of what makes the transitions feel continuous.
 */
export function Sky() {
  const tier = useJourney((s) => s.tier);
  const budget = QUALITY[tier];

  return (
    <group>
      <Starfield count={budget.stars} />
      <Nebulae count={budget.nebulaBillboards} octaves={budget.octaves} />
      <Dust count={budget.dust} />
      {tier !== 'low' && <DistantVessel />}
    </group>
  );
}
