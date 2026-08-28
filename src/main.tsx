import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

const root = createRoot(document.getElementById('root')!);

// Development-only shader harness. Not linked from anywhere.
if (import.meta.env.DEV && new URLSearchParams(location.search).get('lab') === 'worlds') {
  void import('./lab/WorldLab').then(({ WorldLab }) => root.render(<WorldLab />));
} else {
  root.render(<App />);
}
