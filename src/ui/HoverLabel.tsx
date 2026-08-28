import { useHover } from '@/store/hover';
import './hover.css';

/**
 * The floating target label. A DOM element positioned from a projected
 * world coordinate, rather than drei's <Html> — which transforms a DOM node
 * every frame and, besides costing layout, makes the page permanently
 * "unstable" for anything watching for settled rendering.
 */
export function HoverLabel() {
  const target = useHover((s) => s.target);
  if (!target) return null;

  return (
    <div
      className="hvr"
      style={{
        transform: `translate3d(${Math.round(target.x)}px, ${Math.round(target.y)}px, 0)`,
        ['--accent' as string]: target.accent,
      }}
      aria-hidden="true"
    >
      <span className="hvr-leader" />
      <span className="hvr-box">
        <span className="hvr-label">{target.label}</span>
        <span className="hvr-sub">{target.sub}</span>
      </span>
    </div>
  );
}
