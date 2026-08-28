import { Suspense, lazy, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Sky } from './Sky';
import { CameraRig } from './CameraRig';
import { SolarSystem } from './SolarSystem';
import { QUALITY, useAutoTier } from './quality';
import { BootProbe } from './BootProbe';
import { markBoot } from '@/store/boot';
import { useJourney } from '@/store/journey';

/* The one place that still lazy-loads: the ship's interior is a genuinely
   separate space, and nobody pays for it until they find the ship. */
const MilanoInterior = lazy(() =>
  import('@/regions/MilanoInterior').then((m) => ({ default: m.MilanoInterior })),
);

function Effects() {
  const tier = useJourney((s) => s.tier);
  const region = useJourney((s) => s.region);
  const docking = useJourney((s) => s.docking);

  /* Fetch the interior's chunk the moment boarding starts, so the code is
     local by the time the veil covers the swap. Mounting must still wait
     for the region flip: the monitor is projected DOM, not depth-tested,
     and would float over the exterior scene. */
  useEffect(() => {
    if (docking) void import('@/regions/MilanoInterior');
  }, [docking]);
  const budget = QUALITY[tier];

  if (!budget.post) return null;
  // Escape hatch while diagnosing device-specific issues: ?post=0
  if (new URLSearchParams(location.search).get('post') === '0') return null;

  /* Bloom threshold is per-stop on purpose: the hypergiant should blaze
     up close, the overview should glow gently, and TrES-2b must stay
     genuinely dark. */
  const threshold =
    region === 'hero'
      ? 0.22
      : region === 'system'
        ? 0.3
        : region === 'milano-interior'
          ? 0.52
          : 0.34;

  return (
    /* multisampling MUST stay 0. The composer's default (8) routes through
       a multisample renderbuffer blit that silently renders BLACK on a
       range of real drivers (notably Intel/Mesa) while everything else —
       DOM, picking, the render loop — keeps working. We already run
       antialias:false; bloom needs no MSAA. */
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <Bloom
        intensity={region === 'hero' ? 1.15 : 0.78}
        luminanceThreshold={threshold}
        luminanceSmoothing={0.85}
        mipmapBlur
        height={Math.round(720 / budget.bloomDivisor)}
      />
      <Vignette offset={0.24} darkness={0.72} eskil={false} />
    </EffectComposer>
  );
}

function Governor({ mobile }: { mobile: boolean }) {
  useAutoTier(!mobile);
  return null;
}

interface Props {
  mobile: boolean;
}

export function Universe({ mobile }: Props) {
  const tier = useJourney((s) => s.tier);
  const region = useJourney((s) => s.region);
  const budget = QUALITY[tier];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <Canvas
      dpr={budget.dpr}
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
        depth: true,
      }}
      camera={{ fov: 42, near: 0.1, far: 4000, position: [-3.4, 1.1, 17] }}
      onCreated={({ gl, scene, camera }) => {
        markBoot('context');
        /* DOM-side annotations (system callouts) project world positions
           themselves; hand them the live camera. */
        (window as Window & { __camera?: unknown }).__camera = camera;
        /* The canvas is presentation — ContentSpine carries the meaning.
           Set on the DOM element directly: an aria-hidden prop on <Canvas>
           lands on R3F's wrapper div, not the canvas. */
        gl.domElement.setAttribute('aria-hidden', 'true');
        gl.domElement.setAttribute('role', 'presentation');
        gl.domElement.tabIndex = -1;
        /* Manual reset so renderer.info holds exactly one frame's totals
           when the perf probe reads it. */
        gl.info.autoReset = false;
        gl.setClearColor(new THREE.Color('#04060b'), 1);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        scene.fog = null;
      }}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
    >
      <BootProbe />
      <Governor mobile={mobile} />
      <CameraRig mobile={mobile} />
      <Sky />
      <SolarSystem />
      {region === 'milano-interior' && (
        <Suspense fallback={null}>
          <MilanoInterior />
        </Suspense>
      )}
      <Effects />
    </Canvas>
  );
}
