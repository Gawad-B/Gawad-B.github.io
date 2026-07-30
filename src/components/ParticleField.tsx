import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  c: string;
  a: number;
  ph: number;
}

const COLORS = ['196,167,231', '156,207,216', '49,116,143'];

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const density = 60;
    const mobile = window.innerWidth < 760;
    const count = mobile ? Math.round(density * 0.4) : density;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() < 0.15 ? 2 + Math.random() * 3 : 0.4 + Math.random() * 1.2,
      vx: (Math.random() - 0.5) * 0.12,
      vy: -0.03 - Math.random() * 0.1,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
      a: 0.15 + Math.random() * 0.45,
      ph: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.008;
      for (const p of particles) {
        if (!reduce) {
          p.x += p.vx;
          p.y += p.vy;
        }
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        const tw = p.a * (0.7 + 0.3 * Math.sin(t * 2 + p.ph));

        if (p.r > 2) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
          g.addColorStop(0, `rgba(${p.c},${tw * 0.5})`);
          g.addColorStop(1, `rgba(${p.c},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = `rgba(${p.c},${tw})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="rp-canvas" aria-hidden="true" />;
}
