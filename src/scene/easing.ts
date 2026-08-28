/**
 * Cubic-bezier evaluation, so camera flights use the same curves as the
 * DOM transitions in tokens.css. Matching them matters: a panel that eases
 * on one curve while the camera eases on another reads as two systems.
 */

/** Newton-Raphson solve for t given x, then evaluate y. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  return (x: number): number => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 5; i++) {
      const dx = sampleX(t) - x;
      if (Math.abs(dx) < 1e-5) break;
      const d = slopeX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= dx / d;
    }
    return sampleY(t);
  };
}

/** --ease-flight: camera arrivals and panel entrances. */
export const easeFlight = cubicBezier(0.32, 0.72, 0, 1);

/** --ease-instrument: HUD and readouts. Slightly softer landing. */
export const easeInstrument = cubicBezier(0.22, 1, 0.36, 1);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
