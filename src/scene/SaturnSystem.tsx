import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Planet } from './Planet';
import { SaturnRings } from './SaturnRings';
import { SkillMoons } from './SkillMoons';
import { Hotspot } from './Hotspot';
import { useJourney } from '@/store/journey';
import { setHoverTarget } from '@/store/hover';
import { WORLDS } from '@/data/worlds';
import { blip } from '@/audio/ambience';

const SATURN = WORLDS.saturn;

/** Saturn's real axial tilt — why the rings open and close. */
const AXIAL_TILT = THREE.MathUtils.degToRad(26.73);

/**
 * Saturn and everything it carries: rings, the 48 skill moons on their
 * seven bands, and one badly parked ship in the Cassini Division.
 * Ready to be hung on an orbit around the star.
 */
export function SaturnSystem() {
  const region = useJourney((s) => s.region);
  const travelTo = useJourney((s) => s.travelTo);
  const camera = useThree((s) => s.camera);
  const viewport = useThree((s) => s.size);
  const projected = useMemo(() => new THREE.Vector3(), []);
  const anchor = useRef<THREE.Group>(null);
  const hovered = useRef(false);

  useFrame(() => {
    /* The hotspot unmounts inside skills — if that happens mid-hover,
       no pointer-out will ever arrive, so release here. */
    if (region === 'skills' && hovered.current) {
      hovered.current = false;
      setHoverTarget(null);
      return;
    }
    if (!hovered.current || !anchor.current) return;
    anchor.current.getWorldPosition(projected);
    projected.project(camera);
    setHoverTarget({
      id: 'saturn',
      label: 'Skills · 48 moons',
      sub: `SOL VI · ${SATURN.displayName}`,
      accent: SATURN.accent,
      x: ((projected.x + 1) / 2) * viewport.width,
      y: ((1 - projected.y) / 2) * viewport.height,
    });
  });

  return (
    <group ref={anchor} rotation={[0, 0, AXIAL_TILT]}>
      {/* Visibly oblate — Saturn spins in 10.5 hours and bulges for it. */}
      <group scale={[1, 0.9, 1]}>
        <Planet world={SATURN} sunlit />
      </group>

      <SaturnRings planetRadius={SATURN.radius} />
      <SkillMoons planetRadius={SATURN.radius} />

      {/* Clickable from afar like every other body. Inside the skills
          region the hotspot stands down: there the moons own the pointer,
          and a planet-sized pick sphere would shadow them. */}
      {region !== 'skills' && (
        <Hotspot
          radius={SATURN.radius * 1.35}
          minPixels={56}
          label={`${SATURN.displayName} — skill constellation`}
          onHoverChange={(h) => {
            hovered.current = h;
            if (h) blip('select');
            else setHoverTarget(null);
          }}
          onSelect={() => {
            blip('approach');
            hovered.current = false;
            setHoverTarget(null);
            travelTo('skills');
          }}
        />
      )}
    </group>
  );
}
