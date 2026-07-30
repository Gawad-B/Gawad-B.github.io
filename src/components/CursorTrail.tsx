import { useEffect, useRef } from 'react';

export function CursorTrail() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || reduce) return;

    let last = 0;
    const handleMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - last < 40) return;
      last = now;

      const size = 3 + Math.random() * 4;
      const dot = document.createElement('div');
      dot.style.cssText = `position:absolute;left:${e.clientX + (Math.random() - 0.5) * 10}px;top:${
        e.clientY + (Math.random() - 0.5) * 10
      }px;width:${size}px;height:${size}px;border-radius:50%;background:#eb6f92;box-shadow:0 0 8px rgba(235,111,146,.8);animation:rp-trail-fade .8s ease forwards;pointer-events:none`;
      layer.appendChild(dot);
      setTimeout(() => dot.remove(), 850);
    };

    document.addEventListener('mousemove', handleMove);
    return () => document.removeEventListener('mousemove', handleMove);
  }, []);

  return <div ref={layerRef} className="rp-trail-layer" aria-hidden="true" />;
}
