import { useState } from 'react';
import { useCapabilities } from './content/useCapabilities';
import { FallbackSite } from './content/FallbackSite';

export function App() {
  const caps = useCapabilities();
  const [override3D, setOverride3D] = useState(false);

  // No WebGL at all — the document is the only option.
  if (!caps.webgl) return <FallbackSite reason="no-webgl" />;

  // WebGL exists but the user asked for calm. Offer, don't impose.
  if (caps.reducedMotion && !override3D) {
    return <FallbackSite reason="reduced-motion" onEnter3D={() => setOverride3D(true)} />;
  }

  return <div className="grid min-h-dvh place-items-center text-instr-45">
    <p className="eyebrow">Universe initializing</p>
  </div>;
}
