import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { QUALITY } from './quality';
import { OrbitPath } from './OrbitPath';
import { useJourney } from '@/store/journey';
import { SKILL_GROUPS, ALL_SKILLS, type Skill } from '@/data/skills';
import { blip } from '@/audio/ambience';
import { setHoverTarget } from '@/store/hover';

interface MoonSpec {
  skill: Skill;
  groupId: string;
  accent: THREE.Color;
  radius: number;
  omega: number;
  phase: number;
  inclination: number;
  size: number;
}

/**
 * Kepler's third law: ω ∝ r^-1.5, so the inner bands visibly outrun the
 * outer ones. The scale constant is set by usability — these are click
 * targets, and the earlier value moved moons ~60px/s on screen, fast
 * enough to slip out from under a cursor mid-click.
 */
function angularVelocity(radius: number, scale = 3.2): number {
  return scale / Math.pow(radius, 1.5);
}

function buildMoons(planetRadius: number): MoonSpec[] {
  const specs: MoonSpec[] = [];
  for (const group of SKILL_GROUPS) {
    const radius = group.bandRadius * planetRadius;
    const omega = angularVelocity(radius);
    group.skills.forEach((skill, i) => {
      const phase = (i / group.skills.length) * Math.PI * 2 + group.bandRadius * 1.7;
      specs.push({
        skill,
        groupId: group.id,
        accent: new THREE.Color(group.accent),
        radius,
        omega,
        phase,
        inclination: THREE.MathUtils.degToRad(group.inclination),
        /* Rev 2: the moons are the skill display now, not dots — sized to
           be individually visible from the skills camera. */
        size: 0.30 + ((i * 37) % 7) / 45,
      });
    });
  }
  return specs;
}

/* ------------------------------------------------------------------
   Label atlas.

   All 48 skill names drawn once into a single canvas, rendered as one
   InstancedMesh of billboarded quads — one draw call and one texture for
   the entire labelling system. The names must be readable IN the scene,
   not recovered from the manifest.
   ------------------------------------------------------------------ */

const ATLAS_W = 1024;
const CELL_W = 512;
const CELL_H = 44;
const LABEL_FONT = '500 22px "JetBrains Mono", ui-monospace, monospace';
/** World units per atlas pixel at the reference distance. */
const PX_TO_WORLD = 0.019;
/** Camera distance at which a label renders at its natural size. */
const LABEL_REF_DIST = 34;

interface AtlasCell {
  rect: [number, number, number, number]; // uv: ox, oy, sx, sy
  width: number; // world units
}

function useLabelAtlas(): { texture: THREE.CanvasTexture; cells: AtlasCell[] } | null {
  const [atlas, setAtlas] = useState<{ texture: THREE.CanvasTexture; cells: AtlasCell[] } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    const build = () => {
      if (cancelled) return;
      const rows = Math.ceil(ALL_SKILLS.length / 2);
      const height = rows * CELL_H;
      const canvas = document.createElement('canvas');
      canvas.width = ATLAS_W;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.font = LABEL_FONT;
      ctx.textBaseline = 'middle';

      const cells: AtlasCell[] = ALL_SKILLS.map((skill, i) => {
        const group = SKILL_GROUPS.find((g) => g.id === skill.groupId)!;
        const x = (i % 2) * CELL_W;
        const y = Math.floor(i / 2) * CELL_H;
        const textW = Math.ceil(ctx.measureText(skill.name).width);
        const used = Math.min(CELL_W, textW + 34);

        // Dark pill backing so the name survives passing in front of the
        // rings; hairline in the band's accent carries the grouping.
        ctx.fillStyle = 'rgba(4, 6, 11, 0.78)';
        ctx.strokeStyle = group.accent + '59'; // ~35% alpha
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x + 3, y + 6, used - 6, CELL_H - 12, 7);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = group.accent;
        ctx.fillText(skill.name, x + 17, y + CELL_H / 2 + 1, CELL_W - 34);

        return {
          // CanvasTexture flips Y: uv origin is the canvas bottom.
          rect: [x / ATLAS_W, 1 - (y + CELL_H) / height, used / ATLAS_W, CELL_H / height],
          width: used * PX_TO_WORLD,
        };
      });

      const texture = new THREE.CanvasTexture(canvas);
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.colorSpace = THREE.SRGBColorSpace;
      setAtlas({ texture, cells });
    };

    // Draw only once the real font is available — a fallback-font atlas
    // would be baked wrong for the whole session.
    document.fonts.load(LABEL_FONT).then(build, build);
    return () => {
      cancelled = true;
    };
  }, []);

  return atlas;
}

const LABEL_VERTEX = /* glsl */ `
attribute vec4 aUvRect;
attribute float aWidth;
attribute float aOpacity;
uniform float uHeight;
uniform float uRefDist;
varying vec2 vUv;
varying float vOpacity;

void main() {
  vUv = vec2(aUvRect.x + uv.x * aUvRect.z, aUvRect.y + uv.y * aUvRect.w);
  vOpacity = aOpacity;
  // Billboard: take only the instance's translation, build the quad in
  // view space so it always faces the camera.
  vec4 mv = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  /* Near-constant screen size: scale the quad with distance so a label is
     a readout, not an object. A moon three times closer must not carry a
     label three times taller — the gentle clamp stops the extremes. */
  float k = clamp(-mv.z / uRefDist, 0.6, 1.7);
  mv.xy += (uv - 0.5) * vec2(aWidth, uHeight) * k;
  gl_Position = projectionMatrix * mv;
}
`;

const LABEL_FRAGMENT = /* glsl */ `
uniform sampler2D uAtlas;
uniform float uGlobal;
varying vec2 vUv;
varying float vOpacity;

void main() {
  vec4 texel = texture2D(uAtlas, vUv);
  float alpha = texel.a * vOpacity * uGlobal;
  if (alpha < 0.012) discard;
  gl_FragColor = vec4(texel.rgb, alpha);
}
`;

const RAYCAST_HZ = 1 / 30;

/**
 * All 48 skill moons in one InstancedMesh, their labels in another —
 * two draw calls for the whole system. Picking stays screen-space
 * (project the positions, compare in CSS pixels) because that's the unit
 * the 44px target-size requirement is written in.
 */
export function SkillMoons({ planetRadius }: { planetRadius: number }) {
  const tier = useJourney((s) => s.tier);
  const reducedMotion = useJourney((s) => s.reducedMotion);
  const isolatedBand = useJourney((s) => s.isolatedBand);
  const focus = useJourney((s) => s.focus);
  const focusOn = useJourney((s) => s.focusOn);
  const region = useJourney((s) => s.region);
  const budget = QUALITY[tier];

  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const pointer = useThree((s) => s.pointer);
  const domElement = useThree((s) => s.gl.domElement);

  const moons = useMemo(() => buildMoons(planetRadius), [planetRadius]);
  const atlas = useLabelAtlas();

  const mesh = useRef<THREE.InstancedMesh>(null);
  const labelMesh = useRef<THREE.InstancedMesh>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const positions = useRef<THREE.Vector3[]>(moons.map(() => new THREE.Vector3()));
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const projected = useMemo(() => new THREE.Vector3(), []);
  const time = useRef(0);
  const raycastAccum = useRef(0);
  const labelGlobal = useRef(0);

  const labelUniforms = useMemo(
    () => ({
      uAtlas: { value: null as THREE.Texture | null },
      uHeight: { value: CELL_H * PX_TO_WORLD },
      uRefDist: { value: LABEL_REF_DIST },
      uGlobal: { value: 0 },
    }),
    [],
  );

  // Per-instance label attributes, filled once the atlas exists.
  const labelAttrs = useMemo(() => {
    if (!atlas) return null;
    const uvRect = new Float32Array(moons.length * 4);
    const width = new Float32Array(moons.length);
    const opacity = new Float32Array(moons.length);
    ALL_SKILLS.forEach((_, i) => {
      const cell = atlas.cells[i]!;
      uvRect.set(cell.rect, i * 4);
      width[i] = cell.width;
      opacity[i] = 1;
    });
    return { uvRect, width, opacity };
  }, [atlas, moons.length]);

  useEffect(() => {
    if (atlas) labelUniforms.uAtlas.value = atlas.texture;
  }, [atlas, labelUniforms]);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    if (!reducedMotion) time.current += delta;

    const selectedId = focus.kind === 'skill' ? focus.id : undefined;
    const labels = labelMesh.current;
    const opacityAttr = labels?.geometry.getAttribute('aOpacity') as
      | THREE.InstancedBufferAttribute
      | undefined;

    moons.forEach((m, i) => {
      const angle = m.phase + time.current * m.omega;
      const x = Math.cos(angle) * m.radius;
      const z = Math.sin(angle) * m.radius;
      const y = Math.sin(angle) * m.radius * Math.sin(m.inclination);
      const pos = positions.current[i]!;
      pos.set(x, y, z * Math.cos(m.inclination));

      const dimmed = isolatedBand !== null && isolatedBand !== m.groupId;
      const isHovered = hovered === i;
      const isSelected = selectedId === m.skill.id;

      dummy.position.copy(pos);
      const scale = m.size * (isSelected ? 1.7 : isHovered ? 1.4 : 1) * (dimmed ? 0.55 : 1);
      dummy.scale.setScalar(scale);
      dummy.rotation.y = angle * 2;
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);

      color.copy(m.accent);
      if (isSelected) color.multiplyScalar(2.6);
      else if (isHovered) color.multiplyScalar(2.0);
      else if (dimmed) color.multiplyScalar(0.22);
      mesh.current!.setColorAt(i, color);

      // The label floats just above its moon, sharing its position update.
      if (labels) {
        dummy.rotation.y = 0;
        dummy.scale.setScalar(1);
        dummy.position.y += scale * 1.5 + 0.55;
        dummy.updateMatrix();
        labels.setMatrixAt(i, dummy.matrix);
        if (opacityAttr) {
          opacityAttr.setX(i, dimmed ? 0.1 : isHovered || isSelected ? 1 : 0.92);
        }
      }
    });

    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    if (labels) {
      labels.instanceMatrix.needsUpdate = true;
      if (opacityAttr) opacityAttr.needsUpdate = true;

      /* Labels belong to the skills view. Elsewhere they'd be 48 pieces of
         text stuck to a distant planet — so they fade with the region. */
      const target = region === 'skills' ? 1 : 0;
      labelGlobal.current += (target - labelGlobal.current) * Math.min(1, delta * 4);
      labelUniforms.uGlobal.value = labelGlobal.current;
      labels.visible = labelGlobal.current > 0.02 && !!atlas;
    }

    /* Screen-space picking, throttled to 30Hz. */
    raycastAccum.current += delta;
    if (raycastAccum.current < RAYCAST_HZ) return;
    raycastAccum.current = 0;

    const px = ((pointer.x + 1) / 2) * size.width;
    const py = ((1 - pointer.y) / 2) * size.height;
    let best: number | null = null;
    /* Acquire at 30px, hold to 48px — hysteresis so a moon drifting under
       a still cursor doesn't flicker in and out of hover. */
    let bestDist = 30;

    const debug = (window as Window & { __moonDebug?: boolean }).__moonDebug;
    const screen: Array<{ id: string; name: string; x: number; y: number }> = [];

    moons.forEach((m, i) => {
      if (isolatedBand !== null && isolatedBand !== m.groupId) return;
      projected.copy(positions.current[i]!);
      mesh.current!.localToWorld(projected);
      projected.project(camera);
      if (projected.z > 1) return;
      const sx = ((projected.x + 1) / 2) * size.width;
      const sy = ((1 - projected.y) / 2) * size.height;
      if (debug) screen.push({ id: m.skill.id, name: m.skill.name, x: sx, y: sy });
      const d = Math.hypot(sx - px, sy - py);
      const limit = i === hovered ? 48 : bestDist;
      if (d < limit) {
        bestDist = Math.min(d, bestDist);
        best = i;
      }
    });

    if (debug) {
      const w = window as Window & { __moonScreen?: unknown; __moonState?: unknown };
      w.__moonScreen = screen;
      w.__moonState = { isolatedBand, hovered, count: screen.length };
    }

    if (best !== hovered) {
      setHovered(best);
      document.body.style.cursor = best === null ? '' : 'pointer';
      if (best !== null) blip('select');
    }

    if (best === null) {
      if (hovered !== null) setHoverTarget(null);
    } else {
      const m = moons[best]!;
      const group = SKILL_GROUPS.find((g) => g.id === m.groupId);
      projected.copy(positions.current[best]!);
      mesh.current!.localToWorld(projected);
      projected.project(camera);
      setHoverTarget({
        id: m.skill.id,
        label: m.skill.name,
        sub: group?.label ?? '',
        accent: group?.accent ?? '#ffffff',
        x: ((projected.x + 1) / 2) * size.width,
        y: ((1 - projected.y) / 2) * size.height,
      });
    }
  });

  const hoveredMoon = hovered === null ? null : moons[hovered];

  /* Selection binds to the same screen-space pick that drives hover: if
     the label says a moon is under the cursor, clicking selects it. */
  useEffect(() => {
    if (!hoveredMoon) return;
    const onClick = () => {
      blip('open');
      focusOn('skill', hoveredMoon.skill.id);
    };
    domElement.addEventListener('click', onClick);
    return () => domElement.removeEventListener('click', onClick);
  }, [hoveredMoon, domElement, focusOn]);

  return (
    <group>
      {SKILL_GROUPS.map((group) => (
        <OrbitPath
          key={group.id}
          radius={group.bandRadius * planetRadius}
          inclination={group.inclination}
          color={group.accent}
          opacity={
            region !== 'skills'
              ? 0.03
              : isolatedBand === group.id
                ? 0.4
                : isolatedBand === null
                  ? 0.11
                  : 0.03
          }
        />
      ))}

      <instancedMesh ref={mesh} args={[undefined, undefined, moons.length]} frustumCulled={false}>
        <icosahedronGeometry args={[1, budget.moonSegments >= 12 ? 2 : 1]} />
        <meshStandardMaterial
          roughness={0.85}
          metalness={0.1}
          emissiveIntensity={0.6}
          toneMapped={false}
        />
      </instancedMesh>

      {labelAttrs && (
        <instancedMesh
          ref={labelMesh}
          args={[undefined, undefined, moons.length]}
          frustumCulled={false}
          renderOrder={20}
        >
          <planeGeometry args={[1, 1]}>
            <instancedBufferAttribute attach="attributes-aUvRect" args={[labelAttrs.uvRect, 4]} />
            <instancedBufferAttribute attach="attributes-aWidth" args={[labelAttrs.width, 1]} />
            <instancedBufferAttribute
              attach="attributes-aOpacity"
              args={[labelAttrs.opacity, 1]}
            />
          </planeGeometry>
          <shaderMaterial
            vertexShader={LABEL_VERTEX}
            fragmentShader={LABEL_FRAGMENT}
            uniforms={labelUniforms}
            transparent
            depthWrite={false}
          />
        </instancedMesh>
      )}
    </group>
  );
}

export { ALL_SKILLS };
