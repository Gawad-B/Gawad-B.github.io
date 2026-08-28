import * as THREE from 'three';

/**
 * Atmospheric shell. Rendered on the BACK faces of a slightly larger
 * sphere with additive blending and depth-write off, so the glow reads as
 * light scattered around the limb rather than a coloured bubble.
 */

export const ATMO_VERTEX = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vViewDir;

void main() {
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const ATMO_FRAGMENT = /* glsl */ `
precision highp float;

uniform vec3  uColor;
uniform float uDensity;
uniform float uPower;
uniform vec3  uLightDir;

varying vec3 vNormalW;
varying vec3 vViewDir;

void main() {
  vec3 N = normalize(vNormalW);
  // Back faces: flip so the rim maths reads the same way as the front.
  float mu = clamp(dot(-N, normalize(vViewDir)), 0.0, 1.0);
  float rim = pow(1.0 - mu, uPower);

  // Forward scattering — the limb is brightest on the lit side, which is
  // what makes a real atmosphere look like it's catching the star.
  float lit = smoothstep(-0.45, 0.65, dot(-N, normalize(uLightDir)));

  float alpha = rim * uDensity * (0.18 + 0.82 * lit);
  gl_FragColor = vec4(uColor * alpha, alpha);
}
`;

export function atmoUniforms(color: string, density: number, power = 3.2) {
  return {
    uColor: { value: new THREE.Color(color) },
    uDensity: { value: density },
    uPower: { value: power },
    uLightDir: { value: new THREE.Vector3(1, 0.35, 0.6).normalize() },
  };
}
