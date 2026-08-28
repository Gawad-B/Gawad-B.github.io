import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

const root = createRoot(document.getElementById('root')!);

// Test harness handle: lets the QA suites drive navigation directly so an
// exhaustive sweep (all 48 moons, all 6 worlds) doesn't take an hour on a
// software rasteriser. Only attached when explicitly requested.
if (new URLSearchParams(location.search).has('qa')) {
  void import('./store/journey').then(({ useJourney }) => {
    (window as Window & { __journey?: unknown }).__journey = useJourney;
  });
  // Screen-space position of any registered body, so pointer tests can
  // aim at the real thing instead of guessing from map callouts.
  void Promise.all([import('./scene/bodies'), import('three')]).then(([bodies, THREE]) => {
    const v = new THREE.Vector3();
    (window as Window & { __bodyScreen?: unknown }).__bodyScreen = (id: string) => {
      const body = bodies.getBody(id);
      const cam = (window as Window & { __camera?: import('three').Camera }).__camera;
      if (!body || !cam) return null;
      body.getWorldPosition(v).project(cam);
      return {
        x: ((v.x + 1) / 2) * window.innerWidth,
        y: ((1 - v.y) / 2) * window.innerHeight,
        z: v.z,
      };
    };
  });
}

// Development-only shader harness. Not linked from anywhere.
if (import.meta.env.DEV && new URLSearchParams(location.search).get('lab') === 'worlds') {
  void import('./lab/WorldLab').then(({ WorldLab }) => root.render(<WorldLab />));
} else {
  root.render(<App />);
}
