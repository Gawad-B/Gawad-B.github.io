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
import { HoverLabel } from './ui/HoverLabel';
import { useKeyboardNav } from './ui/useKeyboardNav';
import { useJourney } from './store/journey';

/** The 3D experience. Split out so the fallback path never mounts any of it. */
function UniverseApp({ mobile }: { mobile: boolean }) {
  const phase = useJourney((s) => s.phase);
  const region = useJourney((s) => s.region);
  const focus = useJourney((s) => s.focus);
  const finishLoading = useJourney((s) => s.finishLoading);
  useKeyboardNav();

  const loading = phase === 'loading';

  return (
    <>
      <Universe mobile={mobile} />

      {/* Overlays sit above the canvas. Content spine stays clipped but
          present, so the page is complete to a crawler and a reader. */}
      {!loading && (
        <>
          {region === 'hero' && <HeroOverlay />}
          {region === 'about' && <AboutDossier />}
          {focus.kind === 'skill' && focus.id && <SkillPanel skillId={focus.id} />}
          <HoverLabel />
          {/* One column: the manifest stacks above the region selector, so
              layout guarantees they can't overlap regardless of how many
              rows either one grows to. */}
          <div className="rail">
            <NavManifest />
            <NavCluster />
          </div>
          <HUD />
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

  if (!caps.webgl) return <FallbackSite reason="no-webgl" />;

  // Reduced motion is a request for calm, not a request for less content.
  // Offer the universe; don't impose it.
  if (caps.reducedMotion && !override3D) {
    return <FallbackSite reason="reduced-motion" onEnter3D={() => setOverride3D(true)} />;
  }

  return <UniverseApp mobile={caps.touch || window.innerWidth < 768} />;
}
