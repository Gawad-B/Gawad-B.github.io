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

/* The event system only re-raycasts when the POINTER moves — but in this
   scene the TARGETS move: everything orbits, so a body can drift out from
   under a resting cursor, and a pointer that slides onto an overlapping
   DOM overlay (a map callout, the nav rail) takes the canvas's events
   with it. Both leave `pointerout` unfired and the hover stuck. We track
   canvas pointer presence once, globally, and each hotspot re-verifies
   its own hover every tick. */
let pointerOnCanvas = false;
let presenceBound: HTMLElement | null = null;
function bindPresence(el: HTMLElement) {
  if (presenceBound === el) return;
  presenceBound = el;
  el.addEventListener('pointerenter', () => {
    pointerOnCanvas = true;
  });
  el.addEventListener('pointerleave', () => {
    pointerOnCanvas = false;
  });
}

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
  const gl = useThree((s) => s.gl);
  const accum = useRef(0);
  const worldPos = useRef(new THREE.Vector3());
  const ndc = useRef(new THREE.Vector3());
  const hovered = useRef(false);

  const release = () => {
    if (!hovered.current) return;
    hovered.current = false;
    document.body.style.cursor = '';
    onHoverChange?.(false);
  };

  useFrame((state, delta) => {
    accum.current += delta;
    if (accum.current < RAYCAST_INTERVAL || !mesh.current) return;
    accum.current = 0;
    bindPresence(gl.domElement);

    mesh.current.getWorldPosition(worldPos.current);
    const distance = camera.position.distanceTo(worldPos.current);

    // Scene units per CSS pixel at this distance, given the current FOV.
    const worldPerPixel =
      (2 * Math.tan((camera.fov * Math.PI) / 360) * distance) / size.height;
    const minRadius = (minPixels / 2) * worldPerPixel;

    const target = Math.max(radius * 1.15, minRadius);
    // Absolute scale, not multiplicative — avoids drift over many frames.
    mesh.current.scale.setScalar(target / radius);

    /* Hover re-verification: synthesize the pointer-out the event system
       will never send (see the note on pointer presence above). */
    if (hovered.current) {
      if (!pointerOnCanvas) return release();
      ndc.current.copy(worldPos.current).project(camera);
      if (ndc.current.z > 1) return release();
      const px = ((ndc.current.x + 1) / 2) * size.width;
      const py = ((1 - ndc.current.y) / 2) * size.height;
      const pointerX = ((state.pointer.x + 1) / 2) * size.width;
      const pointerY = ((1 - state.pointer.y) / 2) * size.height;
      const screenRadius = target / worldPerPixel;
      // Generous hysteresis so the label doesn't flicker at the rim.
      if (Math.hypot(px - pointerX, py - pointerY) > screenRadius * 1.3 + 10) release();
    }
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
        pointerOnCanvas = true;
        hovered.current = true;
        document.body.style.cursor = 'pointer';
        onHoverChange?.(true);
      }}
      onPointerOut={() => {
        release();
      }}
      userData={{ label }}
    >
      <sphereGeometry args={[radius, 12, 8]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}
