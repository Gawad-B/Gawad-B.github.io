import { Suspense, lazy, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Sky } from './Sky';
import { CameraRig } from './CameraRig';
import { QUALITY, useAutoTier } from './quality';
import { BootProbe } from './BootProbe';
import { markBoot } from '@/store/boot';
import { useJourney } from '@/store/journey';

const HeroRegion = lazy(() => import('@/regions/HeroRegion').then((m) => ({ default: m.HeroRegion })));
const AboutRegion = lazy(() => import('@/regions/AboutRegion').then((m) => ({ default: m.AboutRegion })));
const SkillsRegion = lazy(() => import('@/regions/SkillsRegion').then((m) => ({ default: m.SkillsRegion })));
const ProjectsRegion = lazy(() => import('@/regions/ProjectsRegion').then((m) => ({ default: m.ProjectsRegion })));
const MilanoInterior = lazy(() => import('@/regions/MilanoInterior').then((m) => ({ default: m.MilanoInterior })));

/** Marks the boot step once a region module has genuinely resolved. */
function RegionReady() {
  useEffect(() => {
    markBoot('region');
  }, []);
  return null;
}

/** Which region owns the current view. */
function ActiveRegion() {
  const region = useJourney((s) => s.region);
  return (
    <Suspense fallback={null}>
      <RegionReady />
      {region === 'hero' && <HeroRegion />}
      {region === 'about' && <AboutRegion />}
      {region === 'skills' && <SkillsRegion />}
      {region === 'projects' && <ProjectsRegion />}
      {region === 'milano-interior' && <MilanoInterior />}
    </Suspense>
  );
}

function Effects() {
  const tier = useJourney((s) => s.tier);
  const region = useJourney((s) => s.region);
  const budget = QUALITY[tier];

  if (!budget.post) return null;

  /* Bloom threshold is per-region on purpose. The hypergiant and the
     4,300 K gas giant should blaze; TrES-2b reflects under 1% of light and
     must stay genuinely dark, so a single global threshold would either
     kill the stars or make the dark planet glow. */
  const threshold =
    region === 'hero' ? 0.22 : region === 'milano-interior' ? 0.52 : 0.34;

  return (
    <EffectComposer enableNormalPass={false}>
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

/** Sync the store's copies of device state, then watch real frame times. */
function Governor({ mobile }: { mobile: boolean }) {
  useAutoTier(!mobile);
  return null;
}

interface Props {
  mobile: boolean;
}

export function Universe({ mobile }: Props) {
  const tier = useJourney((s) => s.tier);
  const budget = QUALITY[tier];

  // Nothing in the scene scrolls; make sure the page doesn't either.
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <Canvas
      dpr={budget.dpr}
      // antialias off because post-processing is active — double-AA is a
      // pure cost with no visual gain.
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
        depth: true,
      }}
      camera={{ fov: 42, near: 0.1, far: 4000, position: [0, 8, 165] }}
      onCreated={({ gl, scene }) => {
        markBoot('context');
        /* The canvas is presentation — ContentSpine carries the meaning.
           This has to be set on the DOM element directly: an aria-hidden
           prop on <Canvas> lands on R3F's wrapper div, not the canvas, so
           the canvas stayed exposed to the accessibility tree. */
        gl.domElement.setAttribute('aria-hidden', 'true');
        gl.domElement.setAttribute('role', 'presentation');
        gl.domElement.tabIndex = -1;
        /* Manual reset so renderer.info holds exactly one frame's totals
           when the probe reads it. With autoReset on, info is cleared at
           the start of every render, so anything sampled from useFrame —
           which runs before the render — reads a partially-cleared object. */
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
      <ActiveRegion />
      <Effects />
    </Canvas>
  );
}
