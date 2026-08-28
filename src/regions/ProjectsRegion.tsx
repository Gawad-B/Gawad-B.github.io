import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Planet } from '@/scene/Planet';
import { Hotspot } from '@/scene/Hotspot';
import { OrbitPath } from '@/scene/OrbitPath';
import { registerWaypoint } from '@/scene/CameraRig';
import { QUALITY } from '@/scene/quality';
import { useJourney } from '@/store/journey';
import { setHoverTarget } from '@/store/hover';
import { PROJECT_WORLDS, type World } from '@/data/worlds';
import { PROJECTS } from '@/data/projects';
import { blip } from '@/audio/ambience';

/**
 * The survey belt.
 *
 * Seven worlds on a wide, inclined arc — deliberately not a row and not a
 * grid. Each sits at a different distance and height so the belt reads as
 * depth you travel through rather than a lineup you scan.
 */
/* The belt is offset to the right of centre because the left ~270px of
   the viewport belongs to the instrument rail. Centring it on the origin
   put the first world underneath the manifest. */
const BELT_OFFSET_X = 20;

const BELT: Array<{ world: World; position: [number, number, number]; scale: number }> = (() => {
  return PROJECT_WORLDS.map((world, i) => {
    const t = i / (PROJECT_WORLDS.length - 1); // 0..1
    // A shallow arc sweeping left-to-right and receding.
    // Asymmetric on purpose: the left end has to clear the rail, the right
    // end only has to clear the viewport edge.
    const angle = -0.85 + t * 1.9;
    const radius = 30 + Math.sin(t * Math.PI) * 10;
    return {
      world,
      position: [
        Math.sin(angle) * radius + BELT_OFFSET_X,
        Math.cos(t * Math.PI * 1.7) * 6.5 - 1,
        -Math.cos(angle) * radius * 0.45 + 12,
      ] as [number, number, number],
      // Near worlds slightly smaller so distance still reads as distance.
      scale: 0.92 + Math.sin(t * Math.PI) * 0.2,
    };
  });
})();

/** Register a close-approach waypoint per world, once. */
BELT.forEach(({ world, position, scale }) => {
  const project = PROJECTS.find((p) => p.id === world.project);
  if (!project) return;
  const r = world.radius * scale;
  // Stand off by a few radii and to the side the panel isn't on, so the
  // planet fills frame without sitting behind the dossier.
  registerWaypoint(`project:${project.id}`, {
    position: [position[0] - r * 1.5, position[1] + r * 0.55, position[2] + r * 3.4],
    target: position,
    fov: 44,
    weight: 0.95,
  });
});

/**
 * KELT-9b's photoevaporation tail. Its atmosphere is genuinely being
 * stripped and trails behind it, so this is geometry rather than decoration.
 */
function StrippedTail({ radius, color }: { radius: number; color: string }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uTime: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uTime;
          varying vec2 vUv;
          void main() {
            // Denser at the planet, thinning as it escapes.
            float along = 1.0 - vUv.y;
            float taper = pow(along, 2.2);
            float across = 1.0 - abs(vUv.x - 0.5) * 2.0;
            float turb = 0.72 + 0.28 * sin(vUv.y * 22.0 - uTime * 2.6);
            float a = taper * pow(across, 1.7) * turb * 0.5;
            gl_FragColor = vec4(uColor * a, a);
          }
        `,
      }),
    [color],
  );

  useFrame((_, delta) => {
    material.uniforms.uTime!.value += delta;
  });

  return (
    <mesh material={material} position={[0, 0, radius * 3.4]} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[radius * 2.1, radius * 7, 1, 20]} />
    </mesh>
  );
}

/**
 * HD 110067 is not one planet — it's six sub-Neptunes in a 3:2·3:2·3:2·4:3·4:3
 * resonant chain. Rendering it as a single sphere would throw away the only
 * interesting thing about it, so it's rendered as the chain.
 */
function ResonantChain({ world, scale }: { world: World; scale: number }) {
  const group = useRef<THREE.Group>(null);
  const reducedMotion = useJourney((s) => s.reducedMotion);

  /* Real period ratios. Successive pairs are locked 3:2, 3:2, 3:2, 4:3, 4:3,
     so angular velocity ratios follow from the periods directly. */
  const PERIODS = [9.11, 13.67, 20.52, 30.79, 41.06, 54.77];
  const bodies = useMemo(
    () =>
      PERIODS.map((period, i) => ({
        radius: (2.6 + i * 1.35) * scale,
        // Normalised so the innermost completes an orbit in ~24s.
        omega: (PERIODS[0]! / period) * 0.26,
        phase: i * 1.05,
        size: world.radius * scale * (1 - i * 0.055),
      })),
    [scale, world.radius],
  );

  const time = useRef(0);
  const refs = useRef<Array<THREE.Group | null>>([]);

  useFrame((_, delta) => {
    if (!reducedMotion) time.current += delta;
    bodies.forEach((b, i) => {
      const g = refs.current[i];
      if (!g) return;
      const a = b.phase + time.current * b.omega;
      g.position.set(Math.cos(a) * b.radius, Math.sin(a) * b.radius * 0.12, Math.sin(a) * b.radius);
    });
  });

  return (
    <group ref={group}>
      {bodies.map((b, i) => (
        <group key={i}>
          <OrbitPath radius={b.radius} inclination={i * 1.5} color={world.accent} opacity={0.16} />
          <group ref={(el) => { refs.current[i] = el; }}>
            <Planet world={world} radius={b.size} lightDir={[1, 0.3, 0.6]} />
          </group>
        </group>
      ))}
    </group>
  );
}

function SurveyReticle({
  radius,
  color,
  emphasis,
}: {
  radius: number;
  color: string;
  emphasis: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const camera = useThree((s) => s.camera);

  // Billboard it, so the reticle reads as an overlay on the survey rather
  // than a ring in space that could be mistaken for a real one.
  useFrame(() => {
    mesh.current?.lookAt(camera.position);
  });

  return (
    <mesh ref={mesh}>
      <ringGeometry args={[radius * 1.5, radius * 1.53, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.08 + emphasis * 0.24}
        side={THREE.DoubleSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function BeltWorld({
  world,
  position,
  scale,
}: {
  world: World;
  position: [number, number, number];
  scale: number;
}) {
  const focusOn = useJourney((s) => s.focusOn);
  const focus = useJourney((s) => s.focus);
  const camera = useThree((s) => s.camera);
  const viewport = useThree((s) => s.size);
  const projected = useMemo(() => new THREE.Vector3(), []);
  const anchor = useRef<THREE.Group>(null);
  const hovered = useRef(false);

  const project = PROJECTS.find((p) => p.id === world.project);
  const radius = world.radius * scale;
  const isFocused = focus.kind === 'project' && focus.id === project?.id;

  useFrame(() => {
    if (!hovered.current || !anchor.current || !project) return;
    anchor.current.getWorldPosition(projected);
    projected.project(camera);
    setHoverTarget({
      id: project.id,
      label: project.name,
      sub: world.displayName,
      accent: world.accent,
      x: ((projected.x + 1) / 2) * viewport.width,
      y: ((1 - projected.y) / 2) * viewport.height,
    });
  });

  if (!project) return null;

  return (
    <group ref={anchor} position={position}>
      {world.id === 'hd-110067' ? (
        <ResonantChain world={world} scale={scale} />
      ) : (
        <Planet world={world} radius={radius} lightDir={[1, 0.32, 0.62]}>
          {world.shader.tail && (
            <StrippedTail radius={radius} color={world.shader.atmosphereColor} />
          )}
        </Planet>
      )}

      {/* Dark worlds get a stronger reticle: TrES-2b reflects under 1% of
          the light that hits it and is otherwise a hole in the starfield.
          HD 110067 is skipped — its six resonant orbits already read as a
          marked target, and a reticle would sit confusingly inside them. */}
      {world.id !== 'hd-110067' && (
        <SurveyReticle
          radius={radius}
          color={world.accent}
          emphasis={world.shader.emission < 0.2 ? 1 : 0}
        />
      )}

      {/* Each world gets its own light pocket on its own layer, so a hot
          world's rim light can't leak onto a cold neighbour. */}
      <pointLight
        position={[radius * 2.4, radius * 1.4, radius * 2.6]}
        intensity={isFocused ? 9 : 5}
        distance={radius * 16}
        color={world.shader.atmosphereColor}
      />

      <Hotspot
        radius={world.id === 'hd-110067' ? radius * 4.2 : radius * 1.25}
        minPixels={56}
        label={`${world.displayName} — ${project.name}`}
        onHoverChange={(h) => {
          hovered.current = h;
          if (h) blip('select');
          else setHoverTarget(null);
        }}
        onSelect={() => {
          blip('approach');
          setHoverTarget(null);
          focusOn('project', project.id);
        }}
      />
    </group>
  );
}

export function ProjectsRegion() {
  const tier = useJourney((s) => s.tier);
  const budget = QUALITY[tier];

  return (
    <group>
      {BELT.map(({ world, position, scale }) => (
        <BeltWorld key={world.id} world={world} position={position} scale={scale} />
      ))}

      {/* A single faint fill so nothing is pure silhouette; each world
          carries its own key light. */}
      <ambientLight intensity={budget.post ? 0.1 : 0.2} color="#3d4a68" />
    </group>
  );
}
