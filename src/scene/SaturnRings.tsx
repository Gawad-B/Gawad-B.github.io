import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RING_VERTEX, RING_FRAGMENT, ringUniforms } from './shaders/rings.glsl';
import { QUALITY } from './quality';
import { useJourney } from '@/store/journey';

/** Real ring boundaries, in Saturn radii. */
export const RING_INNER = 1.24;
export const RING_OUTER = 2.27;
/** The Cassini Division — 4,700 km of near-empty gap. */
export const CASSINI_INNER = 1.95;
export const CASSINI_OUTER = 2.03;
export const CASSINI_MID = (CASSINI_INNER + CASSINI_OUTER) / 2;

/**
 * Ring particles. The shader handles optical depth and shadowing across
 * the whole plane; these instanced points sit on top to give the rings
 * physical grain — a smooth annulus reads as a printed disc no matter how
 * good the gradient is.
 */
function RingParticles({ radius, count }: { radius: number; count: number }) {
  const ref = useRef<THREE.Points>(null);
  const reducedMotion = useJourney((s) => s.reducedMotion);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const c = new THREE.Color();
    let seed = 8391;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    let written = 0;
    let guard = 0;
    while (written < count && guard < count * 40) {
      guard++;
      const r = RING_INNER + rand() * (RING_OUTER - RING_INNER);

      // Reject-sample against real ring density so the B ring is genuinely
      // the busiest and the divisions are genuinely empty.
      let density: number;
      if (r > CASSINI_INNER && r < CASSINI_OUTER) density = 0.02;
      else if (r > 2.204 && r < 2.218) density = 0.05; // Encke gap
      else if (r < 1.53) density = 0.3; // C ring
      else if (r < 1.95) density = 1.0; // B ring
      else density = 0.62; // A ring
      if (rand() > density) continue;

      const theta = rand() * Math.PI * 2;
      const rr = r * radius;
      positions[written * 3] = Math.cos(theta) * rr;
      // Rings are only tens of metres thick relative to 60,000 km — this
      // needs to be almost exactly a plane.
      positions[written * 3 + 1] = (rand() - 0.5) * radius * 0.004;
      positions[written * 3 + 2] = Math.sin(theta) * rr;

      // Mostly water ice, slightly dirtier further out.
      c.set(rand() > 0.86 ? '#8a7150' : '#e8ddc4');
      const mag = 0.45 + rand() * 0.55;
      colors[written * 3] = c.r * mag;
      colors[written * 3 + 1] = c.g * mag;
      colors[written * 3 + 2] = c.b * mag;
      sizes[written] = 0.55 + rand() * 1.15;
      written++;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions.slice(0, written * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors.slice(0, written * 3), 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes.slice(0, written), 1));
    return g;
  }, [count, radius]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: /* glsl */ `
          attribute float aSize;
          varying vec3 vColor;
          void main() {
            vColor = color;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (95.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec3 vColor;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = 1.0 - smoothstep(0.1, 0.5, d);
            gl_FragColor = vec4(vColor, a * 0.30);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
      }),
    [],
  );

  useFrame((_, delta) => {
    // Keplerian shear would be more correct but reads as noise at this
    // scale; a slow uniform drift is what the eye actually wants here.
    if (!reducedMotion && ref.current) ref.current.rotation.y += delta * 0.012;
  });

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />;
}

/**
 * Saturn's ring system: a shaded annulus carrying the real optical-depth
 * profile, plus instanced particles for grain. The planet's shadow on the
 * plane is analytic — no shadow map, because a flat plane occluded by a
 * sphere has a closed-form solution.
 */
export function SaturnRings({ planetRadius }: { planetRadius: number }) {
  const tier = useJourney((s) => s.tier);
  const budget = QUALITY[tier];
  const group = useRef<THREE.Group>(null);
  const worldPos = useMemo(() => new THREE.Vector3(), []);
  const uniforms = useMemo(
    () => ringUniforms(budget.octaves, planetRadius),
    [budget.octaves, planetRadius],
  );

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    /* The analytic shadow works in world space, and Saturn orbits the sun
       now — so both the occluder centre and the light direction have to be
       refreshed from the live transform, or the shadow stays parked where
       Saturn used to be. Light dir is just -position: the sun is at 0. */
    if (group.current) {
      group.current.getWorldPosition(worldPos);
      uniforms.uPlanetCenter.value.copy(worldPos);
      if (worldPos.lengthSq() > 1e-4) {
        uniforms.uLightDir.value.copy(worldPos).multiplyScalar(-1).normalize();
      }
    }
  });

  return (
    <group ref={group}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        {/* Radial segments matter more than angular here — the structure
            being resolved is concentric. */}
        <ringGeometry args={[RING_INNER * planetRadius, RING_OUTER * planetRadius, 192, 24]} />
        <shaderMaterial
          vertexShader={RING_VERTEX}
          fragmentShader={RING_FRAGMENT}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <RingParticles radius={planetRadius} count={budget.ringParticles} />
    </group>
  );
}
