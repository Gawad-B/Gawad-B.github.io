/**
 * Shared noise. Every planet, star, ring and nebula shader includes this
 * exact chunk — there is one implementation of fBm in the build.
 *
 * Octave count is a uniform (`uOctaves`) rather than a compile-time
 * constant so the device tier can dial detail down without recompiling
 * a second shader program. The loop is bounded by a literal so the GLSL
 * compiler can still unroll it.
 */
export const NOISE_CHUNK = /* glsl */ `
#define MAX_OCTAVES 6

// Cheap 3D hash. No texture lookup, no dependency on precision quirks.
vec3 hash33(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
           dot(p, vec3(269.5, 183.3, 246.1)),
           dot(p, vec3(113.5, 271.9, 124.6)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// Gradient noise — smoother than value noise, worth the extra dots.
float gnoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(mix(dot(hash33(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)),
            dot(hash33(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)), u.x),
        mix(dot(hash33(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)),
            dot(hash33(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)), u.x), u.y),
    mix(mix(dot(hash33(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)),
            dot(hash33(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)), u.x),
        mix(dot(hash33(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)),
            dot(hash33(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)), u.x), u.y),
    u.z);
}

float fbm(vec3 p, int octaves) {
  float sum = 0.0;
  float amp = 0.5;
  float norm = 0.0;
  for (int i = 0; i < MAX_OCTAVES; i++) {
    if (i >= octaves) break;
    sum += amp * gnoise(p);
    norm += amp;
    p *= 2.02;   // slightly off 2.0 to break lattice alignment
    amp *= 0.5;
  }
  return sum / max(norm, 0.0001);
}

// Ridged variant — for magma cracks and convection cell edges.
float ridged(vec3 p, int octaves) {
  float sum = 0.0;
  float amp = 0.5;
  float norm = 0.0;
  for (int i = 0; i < MAX_OCTAVES; i++) {
    if (i >= octaves) break;
    sum += amp * (1.0 - abs(gnoise(p)));
    norm += amp;
    p *= 2.07;
    amp *= 0.5;
  }
  return sum / max(norm, 0.0001);
}

// Warping the domain before sampling is what turns bland noise into
// something that looks like fluid actually moved it.
vec3 domainWarp(vec3 p, float strength, int octaves) {
  vec3 q = vec3(fbm(p + 0.0, octaves), fbm(p + 5.2, octaves), fbm(p + 9.7, octaves));
  return p + q * strength;
}
`;
