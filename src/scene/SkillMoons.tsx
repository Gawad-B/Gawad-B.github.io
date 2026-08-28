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
  /** Scene-space orbital radius. */
  radius: number;
  /** Radians/second, from Kepler's third law. */
  omega: number;
  phase: number;
  inclination: number;
  size: number;
}

/**
 * Kepler's third law: T² ∝ a³, so ω ∝ a^-1.5. Using the real relation
 * rather than an arbitrary per-band speed means the inner bands visibly
 * outrun the outer ones, which is most of what makes the system read as
 * orbital mechanics instead of spinning rings.
 *
 * The scale constant is set by usability, not realism: these moons are
 * click targets. At the first value tried the inner band completed an orbit
 * in 25s, which moved a moon roughly 60px per second on screen — fast
 * enough to slip out from under the cursor between intending to click and
 * clicking. ~90s for the inner band keeps the motion clearly visible while
 * leaving the moons catchable. The Keplerian ratios are untouched.
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
      // Even angular spacing per band, offset so bands don't align into
      // visible spokes.
      const phase = (i / group.skills.length) * Math.PI * 2 + group.bandRadius * 1.7;
      specs.push({
        skill,
        groupId: group.id,
        accent: new THREE.Color(group.accent),
        radius,
        omega,
        phase,
        inclination: THREE.MathUtils.degToRad(group.inclination),
        // Slight size variation — identical moons look manufactured.
        size: 0.1 + ((i * 37) % 7) / 90,
      });
    });
  }
  return specs;
}

const RAYCAST_HZ = 1 / 30;

/**
 * All 48 skill moons in one InstancedMesh, with picking done by projecting
 * moon positions to screen space rather than by raycasting 48 hit spheres.
 * Cheaper, and it lets the pick radius be defined in CSS pixels — which is
 * how the WCAG target-size requirement is actually expressed.
 */
export function SkillMoons({ planetRadius }: { planetRadius: number }) {
  const tier = useJourney((s) => s.tier);
  const reducedMotion = useJourney((s) => s.reducedMotion);
  const isolatedBand = useJourney((s) => s.isolatedBand);
  const focus = useJourney((s) => s.focus);
  const focusOn = useJourney((s) => s.focusOn);
  const budget = QUALITY[tier];

  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const pointer = useThree((s) => s.pointer);
  const domElement = useThree((s) => s.gl.domElement);

  const moons = useMemo(() => buildMoons(planetRadius), [planetRadius]);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const positions = useRef<THREE.Vector3[]>(moons.map(() => new THREE.Vector3()));
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const projected = useMemo(() => new THREE.Vector3(), []);
  const time = useRef(0);
  const raycastAccum = useRef(0);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    if (!reducedMotion) time.current += delta;

    const selectedId = focus.kind === 'skill' ? focus.id : undefined;

    moons.forEach((m, i) => {
      const angle = m.phase + time.current * m.omega;
      const x = Math.cos(angle) * m.radius;
      const z = Math.sin(angle) * m.radius;
      // Inclination tilts each band's plane.
      const y = Math.sin(angle) * m.radius * Math.sin(m.inclination);
      const pos = positions.current[i]!;
      pos.set(x, y, z * Math.cos(m.inclination));

      const dimmed = isolatedBand !== null && isolatedBand !== m.groupId;
      const isHovered = hovered === i;
      const isSelected = selectedId === m.skill.id;

      dummy.position.copy(pos);
      const scale = m.size * (isSelected ? 1.9 : isHovered ? 1.5 : 1) * (dimmed ? 0.6 : 1);
      dummy.scale.setScalar(scale);
      dummy.rotation.y = angle * 2;
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);

      // Emphasis is carried by brightness, so an isolated band reads even
      // for someone who can't separate the accent hues.
      color.copy(m.accent);
      if (isSelected) color.multiplyScalar(2.6);
      else if (isHovered) color.multiplyScalar(2.0);
      else if (dimmed) color.multiplyScalar(0.22);
      mesh.current!.setColorAt(i, color);
    });

    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;

    /* Screen-space picking, throttled to 30Hz. Projecting 48 points is far
       cheaper than raycasting 48 spheres, and the threshold is expressed in
       CSS pixels — which is the unit the 44px target-size requirement is
       written in. */
    raycastAccum.current += delta;
    if (raycastAccum.current < RAYCAST_HZ) return;
    raycastAccum.current = 0;

    const px = ((pointer.x + 1) / 2) * size.width;
    const py = ((1 - pointer.y) / 2) * size.height;
    let best: number | null = null;
    /* Acquire at 26px, hold out to 44px. Without the wider release radius a
       moon that drifts a few pixels under a stationary cursor flickers in
       and out of hover. */
    let bestDist = 26;

    const debug = (window as Window & { __moonDebug?: boolean }).__moonDebug;
    const screen: Array<{ id: string; name: string; x: number; y: number }> = [];

    moons.forEach((m, i) => {
      if (isolatedBand !== null && isolatedBand !== m.groupId) return;
      projected.copy(positions.current[i]!).project(camera);
      if (projected.z > 1) return; // behind the camera
      const sx = ((projected.x + 1) / 2) * size.width;
      const sy = ((1 - projected.y) / 2) * size.height;
      if (debug) screen.push({ id: m.skill.id, name: m.skill.name, x: sx, y: sy });
      const d = Math.hypot(sx - px, sy - py);
      const limit = i === hovered ? 44 : bestDist;
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

    // Publish the label position so the DOM overlay can follow the moon.
    if (best === null) {
      if (hovered !== null) setHoverTarget(null);
    } else {
      const m = moons[best]!;
      const group = SKILL_GROUPS.find((g) => g.id === m.groupId);
      projected.copy(positions.current[best]!).project(camera);
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

  /* Selection is bound to the same screen-space pick that drives hover.
     Relying on R3F's raycaster here does not work: the moons are ~0.1 units
     across at ~50 units' distance, so a ray almost never intersects one, and
     an invisible catcher mesh can't follow an orbiting target without being
     repositioned every frame anyway. If the label says a moon is under the
     cursor, clicking must select that moon. */
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
      {/* One path per band, brightened when that band is isolated. */}
      {SKILL_GROUPS.map((group) => (
        <OrbitPath
          key={group.id}
          radius={group.bandRadius * planetRadius}
          inclination={group.inclination}
          color={group.accent}
          opacity={isolatedBand === group.id ? 0.4 : isolatedBand === null ? 0.11 : 0.03}
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

    </group>
  );
}

export { ALL_SKILLS };
