import { useEffect, useState } from 'react';
import { useCapabilities } from './content/useCapabilities';
import { FallbackSite } from './content/FallbackSite';
import { ContentSpine } from './content/ContentSpine';
import { Universe } from './scene/Universe';
import { LoadingScreen } from './ui/LoadingScreen';
import { HUD } from './ui/HUD';
import { NavManifest } from './ui/NavManifest';
import { NavCluster } from './ui/NavCluster';
import { HeroOverlay } from './ui/HeroOverlay';
import { AboutDossier } from './ui/AboutDossier';
import { SkillPanel } from './ui/SkillPanel';
import { ProjectPanel } from './ui/ProjectPanel';
import { MilanoPlate } from './ui/MilanoPlate';
import { HoverLabel } from './ui/HoverLabel';
import { SystemCallouts } from './ui/SystemCallouts';
import { useKeyboardNav } from './ui/useKeyboardNav';
import { useScrollNav } from './ui/useScrollNav';
import { useJourney } from './store/journey';

/** The 3D experience. Split out so the fallback path never mounts any of it. */
function UniverseApp({ mobile }: { mobile: boolean }) {
  const phase = useJourney((s) => s.phase);
  const region = useJourney((s) => s.region);
  const focus = useJourney((s) => s.focus);
  const veil = useJourney((s) => s.veil);
  const finishLoading = useJourney((s) => s.finishLoading);
  useKeyboardNav();
  // Wheel and swipe step between sections once the universe is live.
  useScrollNav(phase !== 'loading');

  const loading = phase === 'loading';

  return (
    <>
      <Universe mobile={mobile} />

      {/* Overlays sit above the canvas. Content spine stays clipped but
          present, so the page is complete to a crawler and a reader. */}
      {/* Below every UI layer, above the canvas — see .scene-scrim. */}
      {!loading && <div className="scene-scrim" aria-hidden="true" />}

      {!loading && (
        <>
          {region === 'hero' && <HeroOverlay />}
          {region === 'about' && <AboutDossier />}
          {region === 'milano-interior' && <MilanoPlate />}
          {focus.kind === 'skill' && focus.id && <SkillPanel skillId={focus.id} />}
          {focus.kind === 'project' && focus.id && <ProjectPanel projectId={focus.id} />}
          {/* In the system overview the map callouts name everything;
              a floating hover label there duplicates (and overlaps) them. */}
          {region !== 'system' && <HoverLabel />}
          <SystemCallouts />
          {/* One column: the manifest stacks above the region selector, so
              layout guarantees they can't overlap regardless of how many
              rows either one grows to. */}
          <div className="rail">
            <NavManifest />
            <NavCluster />
          </div>
          <HUD />
          {/* Airlock cross-fade: covers the exterior↔interior camera swap
              when boarding or leaving the ship. Never interactive. */}
          <div className={veil ? 'dock-veil on' : 'dock-veil'} aria-hidden="true">
            <span>AIRLOCK · CYCLING</span>
          </div>
        </>
      )}

      <ContentSpine />
      <div className="grain" aria-hidden="true" />

      {loading && <LoadingScreen onDone={finishLoading} />}
    </>
  );
}

export function App() {
  const caps = useCapabilities();
  const [override3D, setOverride3D] = useState(false);
  const setTier = useJourney((s) => s.setTier);
  const setReducedMotion = useJourney((s) => s.setReducedMotion);

  // Mirror device state into the store so the scene can read it without
  // threading props through every layer.
  useEffect(() => {
    setTier(caps.tier);
    setReducedMotion(caps.reducedMotion && !override3D);
  }, [caps.tier, caps.reducedMotion, override3D, setTier, setReducedMotion]);

  // One diagnostic breadcrumb for remote reports: which GPU the browser
  // exposed and which budget tier was chosen. (?tier=low / ?post=0 override.)
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.info(
      `[universe] gpu="${caps.renderer || 'unknown'}" tier=${caps.tier} webgl=${caps.webgl}`,
    );
  }, [caps.renderer, caps.tier, caps.webgl]);

  if (!caps.webgl) return <FallbackSite reason="no-webgl" />;

  // Reduced motion is a request for calm, not a request for less content.
  // Offer the universe; don't impose it.
  if (caps.reducedMotion && !override3D) {
    return <FallbackSite reason="reduced-motion" onEnter3D={() => setOverride3D(true)} />;
  }

  return <UniverseApp mobile={caps.touch || window.innerWidth < 768} />;
}
