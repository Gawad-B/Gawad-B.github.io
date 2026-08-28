import * as THREE from 'three';
import { Planet } from './Planet';
import { SaturnRings } from './SaturnRings';
import { SkillMoons } from './SkillMoons';
import { WORLDS } from '@/data/worlds';

const SATURN = WORLDS.saturn;

/** Saturn's real axial tilt — why the rings open and close. */
const AXIAL_TILT = THREE.MathUtils.degToRad(26.73);

/**
 * Saturn and everything it carries: rings, the 48 skill moons on their
 * seven bands, and one badly parked ship in the Cassini Division.
 * Ready to be hung on an orbit around the star.
 */
export function SaturnSystem() {
  return (
    <group rotation={[0, 0, AXIAL_TILT]}>
      {/* Visibly oblate — Saturn spins in 10.5 hours and bulges for it. */}
      <group scale={[1, 0.9, 1]}>
        <Planet world={SATURN} sunlit />
      </group>

      <SaturnRings planetRadius={SATURN.radius} />
      <SkillMoons planetRadius={SATURN.radius} />
    </group>
  );
}
