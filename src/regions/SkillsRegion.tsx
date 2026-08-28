import * as THREE from 'three';
import { Planet } from '@/scene/Planet';
import { SaturnRings } from '@/scene/SaturnRings';
import { SkillMoons } from '@/scene/SkillMoons';
import { Milano } from '@/scene/Milano';
import { WORLDS } from '@/data/worlds';

const SATURN = WORLDS.saturn;

/** Saturn's real axial tilt. It's why the rings open and close from Earth. */
const AXIAL_TILT = THREE.MathUtils.degToRad(26.73);

/**
 * Saturn and its skill system.
 *
 * The seven skill groups become seven orbital bands outside the ring
 * system; the 48 skills become moons on them, orbiting at Keplerian rates.
 * The Milano is parked in the Cassini Division, which is a genuine 4,700 km
 * gap in the rings and therefore a genuinely terrible place to leave a ship.
 */
export function SkillsRegion() {
  return (
    <group rotation={[0, 0, AXIAL_TILT]}>
      {/* Saturn is visibly oblate — it spins in 10.5 hours and has the
          lowest density of any planet, so it bulges. */}
      <group scale={[1, 0.9, 1]}>
        <Planet world={SATURN} lightDir={[1, 0.42, 0.5]} />
      </group>

      <SaturnRings planetRadius={SATURN.radius} />
      <SkillMoons planetRadius={SATURN.radius} />
      <Milano planetRadius={SATURN.radius} />

      {/* One dim light so the moons read as lit bodies rather than flat
          emissive dots. Ambient stays low: this is deep space. */}
      <directionalLight position={[12, 6, 8]} intensity={2.1} color="#fff4e2" />
      <ambientLight intensity={0.14} color="#4a5a78" />
    </group>
  );
}
