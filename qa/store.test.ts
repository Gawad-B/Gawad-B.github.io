/** Journey state machine. Run: npx tsx qa/store.test.ts */
import { useJourney, SCROLL_ORDER } from '../src/store/journey';
import { QUALITY } from '../src/scene/quality';

let failures = 0;
function check(name: string, cond: boolean, detail = '') {
  console.log((cond ? '  ok   ' : '  FAIL ') + name + (!cond && detail ? ` — ${detail}` : ''));
  if (!cond) failures++;
}
const s = () => useJourney.getState();
const reset = () => useJourney.setState({
  region: 'hero', focus: { kind: 'none' }, phase: 'idle',
  entered: false, milanoFound: false, isolatedBand: null,
  docking: null, veil: false, cameraCue: null,
});
const settle = (ms = 800) => new Promise((r) => setTimeout(r, ms));

console.log('\ntravel');
reset();
s().travelTo('about');
check('travelTo sets region', s().region === 'about');
check('travelTo enters traveling phase', s().phase === 'traveling');
check('travelTo marks entered', s().entered === true);
s().endTravel();
check('endTravel returns to idle', s().phase === 'idle');
s().endTravel();
check('endTravel is idempotent', s().phase === 'idle');

console.log('\nfocus');
reset();
s().focusOn('project', 'labora');
check('focusing a project moves to the projects region', s().region === 'projects');
check('focus id retained', s().focus.id === 'labora');
s().travelTo('skills');
check('travelling clears stale focus', s().focus.kind === 'none');
s().focusOn('skill', 'ml-ai--pytorch');
check('focusing a skill moves to the skills region', s().region === 'skills');
s().clearFocus();
check('clearFocus preserves region', s().region === 'skills');
check('clearFocus clears focus', s().focus.kind === 'none');

console.log('\nmilano boarding sequence');
reset();
s().travelTo('projects');
s().enterMilano();
check('enterMilano starts the approach, not a teleport', s().docking === 'approach');
check('the region holds until the airlock cut', s().region === 'projects');
check('enterMilano records the discovery', s().milanoFound === true);
check('boarding cannot be scroll-interrupted', (s().advance(1), s().docking === 'approach'));
s().beginIngress();
check('ingress follows the approach', s().docking === 'ingress');
s().commitBoard();
check('committing the board lands inside', s().region === 'milano-interior');
check('the sequence ends with docking cleared', s().docking === null);
check('the veil is up over the cut', s().veil === true);
check('the rig is told to cut, not fly', s().cameraCue === 'snap');
s().enterMilano();
check('enterMilano inside the ship is a no-op', s().region === 'milano-interior');
s().exitMilano();
check('exit veils first, swaps later', s().region === 'milano-interior' && s().veil === true);
await settle();
check('exitMilano returns to where the ship is parked', s().region === 'skills');
check('departure restarts the camera at the hull', s().cameraCue === 'from-ship');
check('milanoFound persists after exit', s().milanoFound === true);
await settle();
check('the veil comes back down', s().veil === false);

console.log('\nboarding aborts');
reset();
s().travelTo('skills');
s().enterMilano();
s().travelTo('about');
check('direct navigation aborts the approach', s().docking === null && s().region === 'about');
check('an abort drops the veil with it', s().veil === false);

console.log('\nband isolation');
reset();
s().travelTo('skills');
s().isolateBand('ml-ai');
check('band isolates', s().isolatedBand === 'ml-ai');
s().travelTo('projects');
check('leaving skills drops isolation', s().isolatedBand === null);

console.log('\nscroll traversal');
reset();
check(
  'scroll order is hero → system → about → skills → projects → ship',
  SCROLL_ORDER.join() === 'hero,system,about,skills,projects,milano-interior',
);
s().advance(1);
check('advance from hero reveals the system overview', s().region === 'system');
s().advance(1);
check('advance again → about', s().region === 'about');
s().advance(-1);
check('advance back → system', s().region === 'system');
s().advance(-1);
s().advance(-1);
check('advancing past the start is a no-op', s().region === 'hero');
useJourney.setState({ region: 'projects', docking: null });
s().advance(1);
check('advancing past projects starts boarding the ship', s().docking === 'approach');
check('scroll-entering the ship counts as discovery', s().milanoFound === true);
s().beginIngress();
s().commitBoard();
check('the boarding sequence lands inside', s().region === 'milano-interior');
s().advance(-1);
await settle();
check('scrolling back out of the ship reverses the path (projects)', s().region === 'projects');
useJourney.setState({ region: 'milano-interior', docking: null, veil: false });
s().advance(1);
check('advancing past the ship is a no-op', s().region === 'milano-interior' && s().docking === null);

console.log('\nloading + audio + tier');
useJourney.setState({ phase: 'loading' });
s().finishLoading();
check('finishLoading → idle', s().phase === 'idle');
s().travelTo('about');
s().finishLoading();
check('finishLoading does not interrupt travel', s().phase === 'traveling');
check('audio defaults muted', useJourney.getInitialState().audioEnabled === false);
s().toggleAudio();
check('audio toggles on', s().audioEnabled === true);
s().setTier('low');
check('tier settable', s().tier === 'low');

console.log('\nquality budgets');
const tiers = ['high', 'medium', 'low'] as const;
check('dpr never exceeds 1.75', tiers.every((t) => QUALITY[t].dpr[1] <= 1.75));
check('low tier disables post-processing', QUALITY.low.post === false);
check('high tier enables post-processing', QUALITY.high.post === true);
check(
  'budgets decrease monotonically',
  QUALITY.high.stars > QUALITY.medium.stars &&
    QUALITY.medium.stars > QUALITY.low.stars &&
    QUALITY.high.ringParticles > QUALITY.medium.ringParticles &&
    QUALITY.medium.ringParticles > QUALITY.low.ringParticles &&
    QUALITY.high.octaves > QUALITY.medium.octaves &&
    QUALITY.medium.octaves > QUALITY.low.octaves,
);
check('low tier drops dust entirely', QUALITY.low.dust === 0);
check(
  'segment counts stay even (sphere geometry)',
  tiers.every((t) => QUALITY[t].planetSegments % 4 === 0 && QUALITY[t].moonSegments % 4 === 0),
);

console.log(failures === 0 ? '\n✓ all store checks passed\n' : `\n✗ ${failures} failure(s)\n`);
process.exit(failures === 0 ? 0 : 1);
