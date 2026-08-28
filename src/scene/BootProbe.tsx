import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { markBoot } from '@/store/boot';

/**
 * Lives inside the Canvas and reports the two milestones only the render
 * loop can know: that a frame was actually drawn, and that frame times
 * have settled (which is when shader compilation is genuinely done).
 */
export function BootProbe() {
  const frames = useRef(0);
  const settled = useRef(0);

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
  });

  return null;
}
