import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Planet } from './Planet';
import { Hotspot } from './Hotspot';
import { useJourney } from '@/store/journey';
import { setHoverTarget } from '@/store/hover';
import { PROJECTS } from '@/data/projects';
import type { World } from '@/data/worlds';
import { blip } from '@/audio/ambience';

/**
 * KELT-9b's photoevaporation tail. Its atmosphere is genuinely being
 * stripped and trails behind it, so this is geometry, not decoration.
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
    <mesh material={material} position={[0, 0, radius * 3.2]} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[radius * 2.0, radius * 6.4, 1, 20]} />
    </mesh>
  );
}

/**
 * Survey reticle: a faint billboarded ring at pick radius. Instrument
 * affordance — and the only way TrES-2b, which reflects under 1% of the
 * light that hits it, is findable at all.
 */
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

/**
 * One project world, ready to be hung on an orbit. Clickable from any
 * distance — the Hotspot keeps a ≥56px projected target.
 */
export function ProjectWorld({ world }: { world: World }) {
  const focusOn = useJourney((s) => s.focusOn);
  const camera = useThree((s) => s.camera);
  const viewport = useThree((s) => s.size);
  const projected = useMemo(() => new THREE.Vector3(), []);
  const anchor = useRef<THREE.Group>(null);
  const hovered = useRef(false);

  const project = PROJECTS.find((p) => p.id === world.project);
  const radius = world.radius;

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
    <group ref={anchor}>
      <Planet world={world} sunlit>
        {world.shader.tail && (
          <StrippedTail radius={radius} color={world.shader.atmosphereColor} />
        )}
      </Planet>

      <SurveyReticle
        radius={radius}
        color={world.accent}
        emphasis={world.shader.emission < 0.2 ? 1 : 0}
      />

      <Hotspot
        radius={radius * 1.3}
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
