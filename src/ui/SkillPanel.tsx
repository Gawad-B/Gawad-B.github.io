import { Panel } from './Panel';
import { useJourney } from '@/store/journey';
import { SKILL_GROUPS, groupOf } from '@/data/skills';
import { WORLDS } from '@/data/worlds';
import { blip } from '@/audio/ambience';
import './skillpanel.css';

const SATURN = WORLDS.saturn;

/**
 * Skill detail. Saturn stays framed behind it, and the sibling skills in
 * the same group are real buttons — so once you're in a band you can walk
 * it without going back out to the moons.
 */
export function SkillPanel({ skillId }: { skillId: string }) {
  const clearFocus = useJourney((s) => s.clearFocus);
  const focusOn = useJourney((s) => s.focusOn);
  const isolateBand = useJourney((s) => s.isolateBand);

  const group = groupOf(skillId);
  const skill = group?.skills.find((s) => s.id === skillId);
  if (!group || !skill) return null;

  const index = group.skills.indexOf(skill) + 1;
  const bandIndex = SKILL_GROUPS.indexOf(group) + 1;

  return (
    <Panel
      mode="dark"
      accent={group.accent}
      eyebrow={`${group.label} · Band ${String(bandIndex).padStart(2, '0')}`}
      title={skill.name}
      designation={`MOON ${String(index).padStart(2, '0')}/${group.skills.length} · ORBIT ${group.bandRadius.toFixed(1)} Rₛ`}
      onClose={() => {
        blip('close');
        clearFocus();
      }}
      facts={SATURN.facts.slice(0, 2)}
      factsLabel="Host body"
    >
      <p className="skp-lede">
        Orbiting Saturn in band {String(bandIndex).padStart(2, '0')} at{' '}
        {group.bandRadius.toFixed(1)} Saturn radii, alongside{' '}
        {group.skills.length - 1} other {group.label.toLowerCase()} moon
        {group.skills.length - 1 === 1 ? '' : 's'}.
      </p>

      <div className="skp-band">
        <p className="eyebrow skp-band-label">Band {String(bandIndex).padStart(2, '0')} · {group.label}</p>
        <ul>
          {group.skills.map((sibling) => {
            const active = sibling.id === skill.id;
            return (
              <li key={sibling.id}>
                <button
                  type="button"
                  className={`skp-chip${active ? ' is-active' : ''}`}
                  style={{ ['--accent' as string]: group.accent }}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => {
                    if (active) return;
                    blip('select');
                    focusOn('skill', sibling.id);
                  }}
                >
                  {sibling.name}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        type="button"
        className="skp-isolate"
        style={{ ['--accent' as string]: group.accent }}
        onClick={() => {
          blip('select');
          isolateBand(group.id);
          clearFocus();
        }}
      >
        Isolate this band ↗
      </button>
    </Panel>
  );
}
