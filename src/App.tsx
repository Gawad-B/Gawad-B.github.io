import { ParticleField } from './components/ParticleField';
import { CursorTrail } from './components/CursorTrail';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Skills } from './components/Skills';
import { Projects } from './components/Projects';
import { Contact } from './components/Contact';

export default function App() {
  return (
    <div className="rp-app">
      <ParticleField />
      <CursorTrail />
      <div className="rp-bloom" />
      <Nav />
      <main>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Contact />
      </main>
    </div>
  );
}
