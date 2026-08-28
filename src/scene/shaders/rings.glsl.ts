import * as THREE from 'three';
import { NOISE_CHUNK } from './noise.glsl';

/**
 * Saturn's rings, on a single flat annulus.
 *
 * Radii are the real ones, expressed in Saturn radii:
 *   C ring   1.24 – 1.53   (thin, translucent)
 *   B ring   1.53 – 1.95   (densest and brightest)
 *   Cassini  1.95 – 2.03   (the 4,700 km gap — and the parking space)
 *   A ring   2.03 – 2.27   (with the narrow Encke gap near 2.21)
 *
 * The planet's shadow is computed analytically here rather than with a
 * shadow map: the ring plane is flat and the occluder is a sphere, so the
 * intersection is closed-form and costs a few instructions instead of an
 * extra render pass.
 */

export const RING_VERTEX = /* glsl */ `
varying vec3 vPosL;
varying vec3 vPosW;

void main() {
  vPosL = position;
  vPosW = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * viewMatrix * vec4(vPosW, 1.0);
}
`;

export const RING_FRAGMENT = /* glsl */ `
precision highp float;

uniform float uTime;
uniform int   uOctaves;
uniform float uInner;
uniform float uOuter;
uniform vec3  uIce;        // bright water-ice particles
uniform vec3  uDust;       // dirtier, redder material
uniform vec3  uLightDir;
uniform float uPlanetRadius;
uniform vec3  uPlanetCenter;
uniform float uOpacity;

varying vec3 vPosL;
varying vec3 vPosW;

${NOISE_CHUNK}

// Real ring structure as a function of normalised radius.
float opticalDepth(float r) {
  // Inside the C ring or outside the A ring: nothing.
  float inner = smoothstep(1.22, 1.28, r);
  float outer = 1.0 - smoothstep(2.24, 2.29, r);

  float c = smoothstep(1.24, 1.40, r) * (1.0 - smoothstep(1.44, 1.53, r)) * 0.30;
  float b = smoothstep(1.53, 1.62, r) * (1.0 - smoothstep(1.86, 1.95, r)) * 1.00;
  float a = smoothstep(2.03, 2.09, r) * (1.0 - smoothstep(2.18, 2.27, r)) * 0.62;

  // The Cassini Division: a genuine gap, not a darker band.
  float cassini = 1.0 - (smoothstep(1.95, 1.965, r) * (1.0 - smoothstep(2.015, 2.03, r)));
  // Encke gap — narrow, inside the A ring.
  float encke = 1.0 - (smoothstep(2.204, 2.208, r) * (1.0 - smoothstep(2.214, 2.218, r))) * 0.9;

  return max(max(c, b), a) * cassini * encke * inner * outer;
}

void main() {
  float r = length(vPosL.xz);
  float tau = opticalDepth(r);

  // Ringlet banding: fine concentric structure from density waves.
  float ringlets = fbm(vec3(r * 190.0, 0.0, 0.0), uOctaves) * 0.5 + 0.5;
  tau *= 0.62 + 0.38 * ringlets;

  // Azimuthal clumping — self-gravity wakes, faint but it kills the
  // "printed CD" look.
  float theta = atan(vPosL.z, vPosL.x);
  float clump = fbm(vec3(cos(theta) * 7.0, sin(theta) * 7.0, r * 22.0), uOctaves) * 0.5 + 0.5;
  tau *= 0.80 + 0.20 * clump;

  /* ---- Analytic planet shadow -------------------------------------
     Project this fragment onto the light ray and test whether it passes
     within the planet's radius. Closed form, no shadow map. */
  vec3 L = normalize(uLightDir);
  vec3 toFrag = vPosW - uPlanetCenter;
  float alongRay = dot(toFrag, L);
  // Only points on the far side of the planet from the star can be shadowed.
  float perpDist = length(toFrag - L * alongRay);
  float occluded = (1.0 - smoothstep(uPlanetRadius * 0.97, uPlanetRadius * 1.06, perpDist))
                   * step(alongRay, 0.0);
  float shade = mix(1.0, 0.14, occluded);

  // Ice is bright and slightly blue; dust is warmer. Denser regions read
  // icier because they're less contaminated.
  vec3 color = mix(uDust, uIce, smoothstep(0.20, 0.85, tau));

  // Particle glint — a few percent of particles catch the light directly.
  float glint = smoothstep(0.985, 1.0, fbm(vec3(r * 620.0, theta * 90.0, uTime * 0.25), uOctaves) * 0.5 + 0.5);
  color += uIce * glint * 1.6;

  float alpha = clamp(tau, 0.0, 1.0) * uOpacity;
  gl_FragColor = vec4(color * shade, alpha);
}
`;

export function ringUniforms(octaves: number, planetRadius: number) {
  return {
    uTime: { value: 0 },
    uOctaves: { value: Math.min(octaves, 4) },
    uInner: { value: 1.24 },
    uOuter: { value: 2.27 },
    uIce: { value: new THREE.Color('#e8ddc4') },
    uDust: { value: new THREE.Color('#8a7150') },
    uLightDir: { value: new THREE.Vector3(1, 0.35, 0.6).normalize() },
    uPlanetRadius: { value: planetRadius },
    uPlanetCenter: { value: new THREE.Vector3(0, 0, 0) },
    uOpacity: { value: 0.94 },
  };
}
