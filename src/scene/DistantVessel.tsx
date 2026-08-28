import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useJourney } from '@/store/journey';

/**
 * A ship crossing somewhere far off, every minute or so.
 *
 * The point is that you mostly miss it. It lives in the persistent sky, so
 * it can happen in any region, and it costs two small meshes — the whole
 * effect is that the universe doesn't only move when you're looking at it.
 */

const PERIOD = 46; // seconds between crossings
const CROSSING = 9; // seconds to traverse

export function DistantVessel() {
  const group = useRef<THREE.Group>(null);
  const reducedMotion = useJourney((s) => s.reducedMotion);

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 6, 4), []);
  const hull = useMemo(
    () => new THREE.MeshBasicMaterial({ color: new THREE.Color('#aeb8c9'), toneMapped: false }),
    [],
  );
  const engine = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#7fd4e8'),
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        depthWrite: false,
      }),
    [],
  );

  useFrame((state) => {
    if (!group.current) return;
    if (reducedMotion) {
      group.current.visible = false;
      return;
    }

    const t = state.clock.elapsedTime % PERIOD;
    if (t > CROSSING) {
      group.current.visible = false;
      return;
    }
    group.current.visible = true;

    const p = t / CROSSING;
    // Vary the lane each pass so it doesn't read as a looping animation.
    const pass = Math.floor(state.clock.elapsedTime / PERIOD);
    const lane = Math.sin(pass * 2.399) * 90;
    const depth = -320 - ((pass * 37) % 140);

    group.current.position.set(-260 + p * 520, lane + Math.sin(p * Math.PI) * 14, depth);
    group.current.rotation.z = 0.14;
    // Fade in and out at the edges rather than popping.
    const fade = Math.sin(p * Math.PI);
    hull.opacity = fade * 0.9;
    hull.transparent = true;
    engine.opacity = fade * 0.85;
  });

  return (
    <group ref={group} visible={false}>
      <mesh geometry={geometry} material={hull} scale={[3.2, 0.8, 0.8]} />
      <mesh geometry={geometry} material={engine} scale={[7, 0.34, 0.34]} position={[-6, 0, 0]} />
    </group>
  );
}
