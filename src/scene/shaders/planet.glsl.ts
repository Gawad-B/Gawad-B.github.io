import * as THREE from 'three';
import { NOISE_CHUNK } from './noise.glsl';
import type { PlanetShaderParams } from '@/data/worlds';

/**
 * One planet program, parameterised — the seven project worlds, HD 189733 b
 * and Saturn all render from this. Every branch is driven by a uniform that
 * is 0 for worlds that don't have that feature, so the shader stays a single
 * compiled program while the worlds stay visually unrelated.
 *
 * Branch-free by construction: mix/step/smoothstep instead of if/else, per
 * the GLSL guidance.
 */

export const PLANET_VERTEX = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vPosL;
varying vec3 vViewDir;

void main() {
  vPosL = position;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const PLANET_FRAGMENT = /* glsl */ `
precision highp float;

uniform float uTime;
uniform int   uOctaves;

uniform vec3  uBaseColor;
uniform vec3  uHotColor;
uniform vec3  uCoolColor;
uniform vec3  uAtmoColor;

// Packed to keep the uniform count down, per the shader guidance.
// x: bandStrength  y: warpStrength  z: noiseScale  w: cloudSpeed
uniform vec4  uSurface;
// x: terminatorSharpness  y: emission  z: rainStreaks  w: lavaCracks
uniform vec4  uFeatures;
// x: atmoDensity  y: glowStrength  z: twoSuns  w: (reserved)
uniform vec4  uAtmo;

uniform vec3  uLightDir;    // primary star
uniform vec3  uLightDir2;   // secondary star — Kepler-16b only
uniform vec3  uWindDir;     // condensate streak direction

varying vec3 vNormalW;
varying vec3 vPosL;
varying vec3 vViewDir;

${NOISE_CHUNK}

void main() {
  vec3 N = normalize(vNormalW);
  float bandStrength = uSurface.x;
  float warpStrength = uSurface.y;
  float noiseScale   = uSurface.z;
  float cloudSpeed   = uSurface.w;

  float termSharp = uFeatures.x;
  float emission  = uFeatures.y;
  float rain      = uFeatures.z;
  float cracks    = uFeatures.w;

  /* ---- Surface ------------------------------------------------------
     Zonal banding is latitude-driven; turbulence comes from warping the
     sample domain. Gas giants run high band + low warp; molten rocky
     worlds run zero band + high warp. That single contrast is what
     separates a Jupiter from a lava world. */
  vec3 p = vPosL * noiseScale;
  vec3 warped = domainWarp(p + vec3(0.0, 0.0, uTime * cloudSpeed), warpStrength, uOctaves);

  float latitude = vPosL.y / max(length(vPosL), 0.0001);

  // Zonal bands must be driven by latitude ALONE, or the domain warp
  // decorrelates them and a gas giant reads as generic mottling. The
  // warp is allowed to perturb the band edges, not to define them.
  float zonal    = fbm(vec3(latitude * 16.0, 0.0, 0.0), uOctaves);
  float zonalTurb = fbm(vec3(warped.x * 0.55, latitude * 16.0, warped.z * 0.55), uOctaves);
  float bands = mix(zonal, zonalTurb, 0.38);

  float turb  = fbm(warped, uOctaves);
  float surface = mix(turb, bands, bandStrength);
  surface = surface * 0.5 + 0.5;

  /* ---- Day / night --------------------------------------------------
     termSharp near 1.0 gives the razor terminator of a tidally-locked
     world; near 0 gives a soft twilight band. */
  float lambert = dot(N, normalize(uLightDir));
  float day = smoothstep(-0.25 * (1.0 - termSharp) - 0.02, 0.35 * (1.0 - termSharp) + 0.03, lambert);

  // Second sun: a real extra light, so the terminator genuinely doubles.
  float lambert2 = dot(N, normalize(uLightDir2));
  float day2 = smoothstep(-0.2, 0.3, lambert2) * uAtmo.z;
  day = clamp(day + day2 * 0.55, 0.0, 1.0);

  vec3 albedo = mix(uCoolColor, uBaseColor, surface);

  /* A magma-ocean world's surface is dark basalt — the light comes from
     melt exposed in the cracks, not from a broad glow. So the more crack
     coverage a world has, the less the day side washes toward hotColor. */
  float hotMix = surface * 0.55 * (1.0 - cracks * 0.8);
  vec3 lit = mix(uCoolColor * 0.35, mix(albedo, uHotColor, hotMix), day);

  /* ---- Condensate rain ---------------------------------------------
     Iron on WASP-76 b, silicate glass on HD 189733 b. Both fall
     sideways because the wind outruns gravity, so the streaks follow
     uWindDir rather than the vertical. */
  vec3 windAxis = normalize(uWindDir);
  float along = dot(normalize(vPosL), windAxis);
  float streak = fbm(vec3(along * 28.0, latitude * 3.0, uTime * 0.35), uOctaves);
  streak = smoothstep(0.42, 0.72, streak);
  // Rain condenses on the night side — that's the whole phenomenon.
  float rainMask = streak * rain * (1.0 - day) * 0.9;
  lit += uAtmoColor * rainMask * 1.15;

  /* ---- Magma cracks -------------------------------------------------
     Ridged noise inverted into a thin network, emitting through a dark
     crust. Bright where the crust is thinnest. */
  float crackField = ridged(vPosL * noiseScale * 1.7 + vec3(0.0, 0.0, uTime * 0.02), uOctaves);
  // ridged() is centred near 0.75, so the ridge PEAKS live above ~0.85.
  // A cooler shoulder either side keeps the melt from having a hard edge.
  float shoulder = smoothstep(0.79, 0.88, crackField) * cracks;
  float crack    = smoothstep(0.88, 0.97, crackField) * cracks;
  lit = mix(lit, uHotColor * 0.55, shoulder * 0.6);
  lit = mix(lit, uHotColor * 2.6, crack);

  /* ---- Fresnel limb -------------------------------------------------
     Thick atmospheres scatter light around the limb; airless rock
     doesn't. uAtmo.x carries that difference. */
  float fresnel = pow(1.0 - clamp(dot(N, normalize(vViewDir)), 0.0, 1.0), 3.0);
  float limbLight = fresnel * uAtmo.x;
  // Scattering is brightest where the limb is still catching light.
  lit += uAtmoColor * limbLight * (0.25 + 0.75 * day) * uAtmo.y;

  /* ---- Self-emission ------------------------------------------------ */
  lit += uHotColor * emission * (0.22 + 0.78 * surface) * (0.4 + 0.6 * day);

  // Tiny amount of ambient so the night side is never pure void — real
  // planets catch starlight.
  lit += uCoolColor * 0.06;

  gl_FragColor = vec4(lit, 1.0);
}
`;

export function planetUniforms(params: PlanetShaderParams, octaves: number) {
  return {
    uTime: { value: 0 },
    uOctaves: { value: Math.min(octaves, params.octaves) },
    uBaseColor: { value: new THREE.Color(params.baseColor) },
    uHotColor: { value: new THREE.Color(params.hotColor) },
    uCoolColor: { value: new THREE.Color(params.coolColor) },
    uAtmoColor: { value: new THREE.Color(params.atmosphereColor) },
    uSurface: {
      value: new THREE.Vector4(
        params.bandStrength,
        params.warpStrength,
        params.noiseScale,
        params.cloudSpeed,
      ),
    },
    uFeatures: {
      value: new THREE.Vector4(
        params.terminatorSharpness,
        params.emission,
        params.rainStreaks,
        params.lavaCracks,
      ),
    },
    uAtmo: {
      value: new THREE.Vector4(
        params.atmosphereDensity,
        params.glowStrength,
        params.twoSuns ? 1 : 0,
        0,
      ),
    },
    uLightDir: { value: new THREE.Vector3(1, 0.35, 0.6).normalize() },
    uLightDir2: { value: new THREE.Vector3(-0.8, -0.2, 0.5).normalize() },
    uWindDir: { value: new THREE.Vector3(1, 0.12, 0).normalize() },
  };
}

export type PlanetUniforms = ReturnType<typeof planetUniforms>;
