/** Journey state machine. Run: npx tsx qa/store.test.ts */
import { useJourney, REGION_ORDER } from '../src/store/journey';
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
});

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

console.log('\nmilano');
reset();
s().travelTo('projects');
s().enterMilano();
check('enterMilano from anywhere', s().region === 'milano-interior');
check('enterMilano records the discovery', s().milanoFound === true);
s().exitMilano();
check('exitMilano returns to where the ship is parked', s().region === 'skills');
check('milanoFound persists after exit', s().milanoFound === true);

console.log('\nband isolation');
reset();
s().travelTo('skills');
s().isolateBand('ml-ai');
check('band isolates', s().isolatedBand === 'ml-ai');
s().travelTo('projects');
check('leaving skills drops isolation', s().isolatedBand === null);

console.log('\nkeyboard traversal');
reset();
s().step(1);
check('step forward from hero → about', s().region === 'about');
s().step(-1);
check('step back → hero', s().region === 'hero');
s().step(-1);
check('step back at the start is a no-op', s().region === 'hero');
useJourney.setState({ region: REGION_ORDER[REGION_ORDER.length - 1]! });
s().step(1);
check('step forward at the end is a no-op', s().region === 'projects');
useJourney.setState({ region: 'milano-interior' });
s().step(1);
check('stepping out of the ship returns to Saturn', s().region === 'skills');

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
