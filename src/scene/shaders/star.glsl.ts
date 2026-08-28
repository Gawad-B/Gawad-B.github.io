import * as THREE from 'three';
import { NOISE_CHUNK } from './noise.glsl';

/**
 * Stephenson 2-18. A 3,200 K hypergiant is genuinely dim per unit area —
 * the drama has to come from convection granulation and limb darkening,
 * not from cranking brightness. Real supergiants have enormous, slow
 * convection cells, so the noise is low-frequency and heavily warped.
 */

export const STAR_VERTEX = /* glsl */ `
varying vec3 vPosL;
varying vec3 vNormalW;
varying vec3 vViewDir;

void main() {
  vPosL = position;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const STAR_FRAGMENT = /* glsl */ `
precision highp float;

uniform float uTime;
uniform int   uOctaves;
uniform vec3  uCore;      // hot cell centres
uniform vec3  uMid;
uniform vec3  uEdge;      // cool intergranular lanes
uniform vec3  uChromo;    // chromosphere rim
uniform float uChurn;

varying vec3 vPosL;
varying vec3 vNormalW;
varying vec3 vViewDir;

${NOISE_CHUNK}

void main() {
  vec3 N = normalize(vNormalW);
  vec3 dir = normalize(vPosL);

  // Two scales of convection: giant cells, and finer structure inside them.
  vec3 slow = domainWarp(dir * 1.6 + vec3(0.0, uTime * uChurn * 0.35, 0.0), 0.9, uOctaves);
  float cells = ridged(slow, uOctaves);
  float fine  = fbm(dir * 5.5 + vec3(uTime * uChurn, 0.0, 0.0), uOctaves);

  // fbm is signed and centred on 0; ridged is centred near 0.75. Both
  // have to be brought into 0..1 before they can be mixed meaningfully.
  float granulation = cells * 0.72 + (fine * 0.5 + 0.5) * 0.28;
  granulation = smoothstep(0.42, 0.86, granulation);

  vec3 photosphere = mix(uEdge, uMid, granulation);
  photosphere = mix(photosphere, uCore, smoothstep(0.62, 1.0, granulation));

  /* Limb darkening — the edge of a star is dimmer because you're looking
     through more atmosphere at a shallower angle. Without this a star
     reads as a flat disc. */
  float mu = clamp(dot(N, normalize(vViewDir)), 0.0, 1.0);
  float limb = pow(mu, 0.62);
  photosphere *= 0.30 + 0.70 * limb;

  // Chromosphere: a thin, hotter rim that survives the limb darkening.
  float rim = pow(1.0 - mu, 3.4);
  photosphere += uChromo * rim * 1.5;

  gl_FragColor = vec4(photosphere, 1.0);
}
`;

export function starUniforms(octaves: number) {
  return {
    uTime: { value: 0 },
    uOctaves: { value: Math.min(octaves, 5) },
    uCore: { value: new THREE.Color('#ff9455') },
    uMid: { value: new THREE.Color('#c4360f') },
    uEdge: { value: new THREE.Color('#5c1305') },
    uChromo: { value: new THREE.Color('#ff6a2c') },
    uChurn: { value: 0.05 },
  };
}
