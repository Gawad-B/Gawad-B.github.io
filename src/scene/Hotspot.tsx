import { useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  /** Scene radius of the thing being made clickable. */
  radius: number;
  onSelect: () => void;
  onHoverChange?: (hovered: boolean) => void;
  /** Accessible name — mirrored by a real <button> elsewhere in the HUD. */
  label: string;
  /** Minimum projected diameter in CSS pixels. WCAG target size is 44. */
  minPixels?: number;
}

const RAYCAST_INTERVAL = 1 / 30; // throttle to 30Hz per the interaction guidance

/**
 * An invisible pick sphere that grows as the camera pulls away, so a
 * distant planet is still a comfortable tap target. This is the mobile
 * touch-target mechanism as well as the desktop hit area — one solution,
 * because "make it bigger on phones" and "make it clickable at range" are
 * the same problem.
 */
export function Hotspot({ radius, onSelect, onHoverChange, label, minPixels = 48 }: Props) {
  const mesh = useRef<THREE.Mesh>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const accum = useRef(0);
  const worldPos = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    accum.current += delta;
    if (accum.current < RAYCAST_INTERVAL || !mesh.current) return;
    accum.current = 0;

    mesh.current.getWorldPosition(worldPos.current);
    const distance = camera.position.distanceTo(worldPos.current);

    // Scene units per CSS pixel at this distance, given the current FOV.
    const worldPerPixel =
      (2 * Math.tan((camera.fov * Math.PI) / 360) * distance) / size.height;
    const minRadius = (minPixels / 2) * worldPerPixel;

    const target = Math.max(radius * 1.15, minRadius);
    // Absolute scale, not multiplicative — avoids drift over many frames.
    mesh.current.scale.setScalar(target / radius);
  });

  const stop = (e: ThreeEvent<PointerEvent>) => e.stopPropagation();

  return (
    <mesh
      ref={mesh}
      onPointerDown={stop}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        onHoverChange?.(true);
      }}
      onPointerOut={() => {
        document.body.style.cursor = '';
        onHoverChange?.(false);
      }}
      userData={{ label }}
    >
      <sphereGeometry args={[radius, 12, 8]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}
