import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { markBoot } from '@/store/boot';
import { useJourney } from '@/store/journey';

/**
 * Lives inside the Canvas and reports the two milestones only the render
 * loop can know: that a frame was actually drawn, and that frame times
 * have settled (which is when shader compilation is genuinely done).
 */
export function BootProbe() {
  const frames = useRef(0);
  const settled = useRef(0);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const region = useJourney((s) => s.region);
  const phase = useJourney((s) => s.phase);

  useEffect(() => {
    markBoot('sky');
  }, []);

  useFrame((_, delta) => {
    frames.current += 1;
    if (frames.current === 2) markBoot('firstFrame');

    // Three consecutive frames under 50ms means the programs are compiled
    // and we're not about to stall on first-draw of a new material.
    if (delta < 0.05) {
      settled.current += 1;
      if (settled.current === 3) markBoot('warm');
    } else {
      settled.current = 0;
    }

    /* Scene complexity, exposed for the perf audit. Draw calls, triangle
       count and program count are hardware-independent and are what
       actually predicts whether a scene will hold frame rate — unlike a
       frame time sampled on a software rasteriser. */
    const w = window as Window & { __perfProbe?: boolean; __perf?: unknown };
    const info = gl.info;
    if (!w.__perfProbe) {
      info.reset();
      return;
    }
    let meshes = 0;
    let points = 0;
    let instanced = 0;
    scene.traverse((o) => {
      // THREE.InstancedMesh extends Mesh and does not override .type, so it
      // reports 'Mesh'. The isInstancedMesh flag is the only reliable test.
      if ((o as { isInstancedMesh?: boolean }).isInstancedMesh) instanced += 1;
      else if (o.type === 'Mesh') meshes += 1;
      else if (o.type === 'Points') points += 1;
    });
    w.__perf = {
      /* Stamped so a sampler can verify it is reading the region it thinks
         it is. At software-render frame rates a fixed sleep after a click
         routinely samples the previous region. */
      region,
      settled: phase === 'idle',
      calls: info.render.calls,
      triangles: info.render.triangles,
      points: info.render.points,
      programs: info.programs?.length ?? 0,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      meshes,
      instancedMeshes: instanced,
      pointClouds: points,
      pixelRatio: gl.getPixelRatio(),
    };
    // Read, then clear, so the next frame accumulates cleanly.
    info.reset();
  });

  return null;
}
