import * as THREE from 'three';
import { NOISE_CHUNK } from './noise.glsl';

/**
 * Nebula billboards. Real emission-line colours (H-α crimson, O-III teal,
 * warm dust) held at 6–10% opacity so they read as depth rather than
 * decoration — the environment has to recede behind the UI, not compete
 * with it.
 */

export const NEBULA_VERTEX = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const NEBULA_FRAGMENT = /* glsl */ `
precision highp float;

uniform float uTime;
uniform int   uOctaves;
uniform vec3  uColorA;
uniform vec3  uColorB;
uniform float uOpacity;
uniform float uSeed;

varying vec2 vUv;

${NOISE_CHUNK}

void main() {
  vec2 uv = vUv - 0.5;

  // Radial falloff so the billboard has no visible rectangular edge.
  float falloff = 1.0 - smoothstep(0.08, 0.5, length(uv));

  vec3 p = vec3(uv * 2.6, uSeed);
  vec3 warped = domainWarp(p + vec3(0.0, 0.0, uTime * 0.006), 0.7, uOctaves);
  float density = fbm(warped * 1.8, uOctaves) * 0.5 + 0.5;
  density = pow(density, 1.9);

  // Filaments — where emission nebulae actually look like something.
  float filament = ridged(warped * 3.4, uOctaves);
  density = mix(density, density * filament * 1.5, 0.45);

  vec3 color = mix(uColorA, uColorB, smoothstep(0.25, 0.8, density));
  float alpha = density * falloff * uOpacity;

  gl_FragColor = vec4(color * alpha, alpha);
}
`;

/** Real emission-line pairings, so no billboard is a flat wash. */
export const NEBULA_PALETTES: Array<[string, string]> = [
  ['#7a1f3d', '#2a0a18'], // H-alpha crimson into dust
  ['#0f4a52', '#071e24'], // O-III teal
  ['#4a3a2a', '#1a1410'], // warm dust lane
  ['#2a2a52', '#0d0d1e'], // reflection nebula blue
];

export function nebulaUniforms(
  palette: [string, string],
  opacity: number,
  seed: number,
  octaves: number,
) {
  return {
    uTime: { value: 0 },
    uOctaves: { value: Math.min(octaves, 4) },
    uColorA: { value: new THREE.Color(palette[0]) },
    uColorB: { value: new THREE.Color(palette[1]) },
    uOpacity: { value: opacity },
    uSeed: { value: seed },
  };
}
