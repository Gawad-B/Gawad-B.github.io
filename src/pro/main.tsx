import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { ProApp } from './ProApp';

const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <ProApp />
  </StrictMode>
);

// The production build ships prerendered markup; the dev server serves an empty root.
// Comment nodes (the `<!--pv-ssr-->` marker) are not children here.
if (root.childElementCount > 0) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
