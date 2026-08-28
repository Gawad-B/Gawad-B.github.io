import { useEffect, useRef, useState } from 'react';
import { useJourney } from '@/store/journey';
import { getBody } from '@/scene/bodies';
import { PROJECTS } from '@/data/projects';
import { worldForProject, WORLDS } from '@/data/worlds';
import './callouts.css';

interface Callout {
  id: string;
  eyebrow: string;
  label: string;
  accent: string;
  target: () => { kind: 'region' | 'project'; value: string };
}

/** Everything worth naming on the system map, driven by the data. */
const CALLOUTS: Callout[] = [
  {
    id: 'hd-189733-b',
    eyebrow: WORLDS['hd-189733-b'].displayName,
    label: 'About',
    accent: WORLDS['hd-189733-b'].accent,
    target: () => ({ kind: 'region', value: 'about' }),
  },
  {
    id: 'saturn',
    eyebrow: 'Saturn · 48 moons',
    label: 'Skills',
    accent: WORLDS.saturn.accent,
    target: () => ({ kind: 'region', value: 'skills' }),
  },
  ...PROJECTS.map((project) => {
    const world = worldForProject(project.id)!;
    return {
      id: world.id,
      eyebrow: world.displayName,
      label: `${project.index} ${project.name}`,
      accent: world.accent,
      target: () => ({ kind: 'project' as const, value: project.id }),
    };
  }),
];

interface Placed extends Callout {
  x: number;
  y: number;
}

/**
 * Named markers over the system overview — the map legend, drawn on the
 * map. Without these the reveal is beautiful but anonymous: six planets
 * and no way to know which one is your project until you fly there.
 *
 * DOM, not in-scene: these are instrument annotations like the HUD, and
 * they must never scale with world distance. Positions are projected from
 * the live bodies a few times a second; each marker is a real <button>.
 */
export function SystemCallouts() {
  const region = useJourney((s) => s.region);
  const phase = useJourney((s) => s.phase);
  const travelTo = useJourney((s) => s.travelTo);
  const focusOn = useJourney((s) => s.focusOn);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const raf = useRef(0);

  const active = region === 'system' && phase === 'idle';

  useEffect(() => {
    if (!active) {
      setPlaced([]);
      return;
    }

    let last = 0;
    const tick = (now: number) => {
      raf.current = requestAnimationFrame(tick);
      if (now - last < 90) return; // ~11Hz is plenty for slow orbits
      last = now;

      const cam = (window as Window & { __camera?: unknown }).__camera as
        | import('three').PerspectiveCamera
        | undefined;
      if (!cam) return;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const next: Placed[] = [];
      for (const c of CALLOUTS) {
        const body = getBody(c.id);
        if (!body) continue;
        const v = body.getWorldPosition(SCRATCH);
        v.project(cam);
        if (v.z > 1) continue;
        /* Edge-pin like any map legend: a marker whose body drifts toward
           the frame edge stays on screen (and tappable) rather than being
           clipped. The bottom margin clears the mobile nav bar. */
        const x = Math.min(Math.max(((v.x + 1) / 2) * w, 84), w - 96);
        const y = Math.min(Math.max(((1 - v.y) / 2) * h, 72), h - 132);
        next.push({ ...c, x, y });
      }
      setPlaced(next);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [active]);

  if (!active || placed.length === 0) return null;

  return (
    <div className="sc" aria-label="System map">
      {placed.map((c, i) => (
        <button
          key={c.id}
          type="button"
          className="sc-callout"
          style={{
            /* Alternate hanging above/below the body: the belt worlds sit
               on neighbouring orbits and their labels collide when every
               callout extends the same way. */
            transform: `translate3d(${Math.round(c.x)}px, ${Math.round(c.y)}px, 0) translate(${
              i % 2 ? '-104%' : '10px'
            }, ${i % 2 ? '-130%' : '30%'})`,
            ['--accent' as string]: c.accent,
          }}
          onClick={() => {
            const t = c.target();
            if (t.kind === 'project') focusOn('project', t.value);
            else travelTo(t.value as never);
          }}
        >
          <span className="sc-dot" aria-hidden="true" />
          <span className="sc-text">
            <span className="sc-eyebrow">{c.eyebrow}</span>
            <span className="sc-label">{c.label}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

import { Vector3 } from 'three';
const SCRATCH = new Vector3();
