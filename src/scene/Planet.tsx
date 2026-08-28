import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PLANET_VERTEX, PLANET_FRAGMENT, planetUniforms } from './shaders/planet.glsl';
import { ATMO_VERTEX, ATMO_FRAGMENT, atmoUniforms } from './shaders/atmosphere.glsl';
import { QUALITY } from './quality';
import { useJourney } from '@/store/journey';
import type { World } from '@/data/worlds';

interface Props {
  world: World;
  /** Scene-space radius override; defaults to the world's own. */
  radius?: number;
  position?: [number, number, number];
  /** Primary star direction, in world space. */
  lightDir?: [number, number, number];
  children?: React.ReactNode;
}

/**
 * One shader-driven planet. Every visual difference between worlds comes
 * from `world.shader`, not from a different component — which is why
 * adding project 08 means adding a data entry, not a new file.
 */
export function Planet({ world, radius, position = [0, 0, 0], lightDir, children }: Props) {
  const tier = useJourney((s) => s.tier);
  const reducedMotion = useJourney((s) => s.reducedMotion);
  const budget = QUALITY[tier];
  const r = radius ?? world.radius;

  const bodyRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => planetUniforms(world.shader, budget.octaves),
    [world.shader, budget.octaves],
  );
  const atmo = useMemo(
    () => atmoUniforms(world.shader.atmosphereColor, world.shader.atmosphereDensity),
    [world.shader],
  );

  // Push the light direction in once rather than every frame.
  useMemo(() => {
    if (!lightDir) return;
    const v = new THREE.Vector3(...lightDir).normalize();
    uniforms.uLightDir.value.copy(v);
    atmo.uLightDir.value.copy(v);
  }, [lightDir, uniforms, atmo]);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    if (!reducedMotion && bodyRef.current) bodyRef.current.rotation.y += world.spin * delta;
  });

  const segments = budget.planetSegments;
  const hasAtmosphere = world.shader.atmosphereDensity > 0.2;

  return (
    <group position={position}>
      <mesh ref={bodyRef}>
        <sphereGeometry args={[r, segments, segments / 2]} />
        <shaderMaterial
          vertexShader={PLANET_VERTEX}
          fragmentShader={PLANET_FRAGMENT}
          uniforms={uniforms}
        />
      </mesh>

      {/* Atmospheric shell: back faces, additive, no depth write — so it
          reads as scattered light instead of a coloured bubble. */}
      {hasAtmosphere && (
        <mesh scale={1.055}>
          <sphereGeometry args={[r, Math.max(32, segments / 2), Math.max(16, segments / 4)]} />
          <shaderMaterial
            vertexShader={ATMO_VERTEX}
            fragmentShader={ATMO_FRAGMENT}
            uniforms={atmo}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            transparent
            depthWrite={false}
          />
        </mesh>
      )}

      {children}
    </group>
  );
}
