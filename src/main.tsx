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
}

// Development-only shader harness. Not linked from anywhere.
if (import.meta.env.DEV && new URLSearchParams(location.search).get('lab') === 'worlds') {
  void import('./lab/WorldLab').then(({ WorldLab }) => root.render(<WorldLab />));
} else {
  root.render(<App />);
}
