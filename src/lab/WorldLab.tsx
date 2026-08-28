import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Planet } from '@/scene/Planet';
import { Sky } from '@/scene/Sky';
import { PROJECT_WORLDS, WORLDS } from '@/data/worlds';
import type { World } from '@/data/worlds';

/**
 * Development harness. Renders every body at uniform size and lighting so
 * their shader fingerprints can be compared directly — the check that
 * stops seven planets from being seven re-tinted spheres.
 *
 * Grid order, left-to-right then top-to-bottom:
 *   WASP-76 b · 55 Cancri e · TrES-2b · KELT-9b
 *   Kepler-16b · K2-18b · HD 110067 · HD 189733 b
 *   Saturn · WASP-193 b · PSR B1257+12 b
 *
 * Reached at /?lab=worlds. Not linked from anywhere.
 */

const ROW: World[] = [
  ...PROJECT_WORLDS,
  WORLDS['hd-189733-b'],
  WORLDS.saturn,
  WORLDS['hd-110067'],
  WORLDS['wasp-193-b'],
  WORLDS['psr-b1257-12-b'],
];

const COLS = 4;
const SPACING = 6.6;

export function WorldLab() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#04060b' }}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ fov: 52, position: [0, 0, 33], near: 0.1, far: 4000 }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#04060b'), 1);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <Sky />
        {ROW.map((world, i) => (
          <Planet
            key={world.id}
            world={world}
            radius={2.4}
            position={[
              (i % COLS) * SPACING - ((COLS - 1) * SPACING) / 2,
              -Math.floor(i / COLS) * SPACING + SPACING,
              0,
            ]}
            lightDir={[1, 0.35, 0.6]}
          />
        ))}
        <EffectComposer enableNormalPass={false} multisampling={0}>
          <Bloom
            intensity={0.8}
            luminanceThreshold={0.34}
            luminanceSmoothing={0.85}
            mipmapBlur
            height={360}
          />
          <Vignette offset={0.24} darkness={0.6} eskil={false} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
