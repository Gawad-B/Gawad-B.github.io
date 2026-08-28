import { useState } from 'react';
import { useCapabilities } from './content/useCapabilities';
import { FallbackSite } from './content/FallbackSite';
import { WorldLab } from './lab/WorldLab';

export function App() {
  const caps = useCapabilities();
  const [override3D, setOverride3D] = useState(false);

  if (new URLSearchParams(location.search).get('lab') === 'worlds') return <WorldLab />;

  if (!caps.webgl) return <FallbackSite reason="no-webgl" />;

  if (caps.reducedMotion && !override3D) {
    return <FallbackSite reason="reduced-motion" onEnter3D={() => setOverride3D(true)} />;
  }

  return (
    <div className="grid min-h-dvh place-items-center text-instr-45">
      <p className="eyebrow">Universe initializing</p>
    </div>
  );
}
