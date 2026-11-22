import './styles/tokens.css';
import './styles/base.css';
import { useEffect } from 'react';
import { useReveal } from './hooks/useReveal';
import { startIntro } from './hooks/wipe';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Projects } from './components/Projects';
import { Experience } from './components/Experience';
import { Skills } from './components/Skills';
import { About } from './components/About';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

export function ProApp() {
  useReveal();
  // The entry cover (static .pv-wipe in index.html) opens once the app is alive.
  useEffect(() => startIntro(), []);

  return (
    <>
      <a className="pv-skip" href="#main">Skip to content</a>
      <Nav />
      <main id="main">
        <Hero />
        <Projects />
        <Experience />
        <Skills />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
