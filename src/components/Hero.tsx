import { useEffect, useRef, useState } from 'react';

const FULL_NAME = 'Abdelrahman Gawad';
const TAGLINES = [
  'Healthcare AI Engineer',
  'Full-Stack Developer',
  'Linux Enthusiast',
  'Competitive Programmer',
];

export function Hero() {
  const [typed, setTyped] = useState('');
  const [typeDone, setTypeDone] = useState(false);
  const [tagIdx, setTagIdx] = useState(0);
  const reduceMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (reduceMotion.current) {
      setTyped(FULL_NAME);
      setTypeDone(true);
      return;
    }
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setTyped(FULL_NAME.slice(0, i));
      if (i >= FULL_NAME.length) {
        setTypeDone(true);
        clearInterval(timer);
      }
    }, 75);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTagIdx(i => (i + 1) % TAGLINES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="hero" className="rp-hero">
      <div className="rp-eyebrow">Alexandria, Egypt · CS @ E-JUST</div>
      <h1 className="rp-name">
        {typed}
        <span className="rp-caret" style={{ opacity: typeDone ? 0 : 1 }} />
      </h1>
      <div className="rp-tagline-wrap">
        <div key={tagIdx} className="rp-tagline">
          {'// ' + TAGLINES[tagIdx]}
        </div>
      </div>
      <div className="rp-chevron">⌄</div>
    </section>
  );
}
