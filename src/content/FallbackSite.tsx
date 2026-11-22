import { ContentSpine } from './ContentSpine';
import { PERSONAL } from '@/data/personal';
import './fallback.css';

interface Props {
  /** Why we're here — changes the banner copy. */
  reason: 'no-webgl' | 'reduced-motion' | 'user';
  /** Present only when 3D is actually available. */
  onEnter3D?: () => void;
}

const BANNER: Record<Props['reason'], { title: string; body: string }> = {
  'no-webgl': {
    title: 'WEBGL UNAVAILABLE',
    body: 'This browser can’t open a 3D context, so you’re getting the flight manual instead of the flight. Everything is here.',
  },
  'reduced-motion': {
    title: 'REDUCED MOTION RESPECTED',
    body: 'Your system asks for reduced motion, so the camera stays parked. The full text is below — or take the universe anyway.',
  },
  user: {
    title: 'TEXT MODE',
    body: 'The whole portfolio, without the orbital mechanics.',
  },
};

/**
 * The no-WebGL path. Not a stub — it renders the identical ContentSpine
 * markup, revealed and styled as a deep-space document. Nothing that
 * matters lives only inside a shader.
 */
export function FallbackSite({ reason, onEnter3D }: Props) {
  const banner = BANNER[reason];

  return (
    <div className="fb">
      {/* CSS-only starfield: three fixed layers of box-shadow dots. */}
      <div className="fb-stars" aria-hidden="true">
        <span className="fb-stars-a" />
        <span className="fb-stars-b" />
        <span className="fb-stars-c" />
      </div>
      <div className="fb-horizon" aria-hidden="true" />

      <div className="fb-shell">
        <a className="fb-pro hit" href="/">
          <span aria-hidden="true">←</span> Professional view
        </a>

        <aside className="fb-banner bezel" role="note">
          <div className="bezel-screen brackets fb-banner-inner">
            <p className="eyebrow" style={{ color: 'var(--signal)' }}>
              {banner.title}
            </p>
            <p>{banner.body}</p>
            {onEnter3D && (
              <button type="button" className="fb-cta hit" onClick={onEnter3D}>
                Enter the universe anyway
                <span className="fb-cta-icon" aria-hidden="true">↗</span>
              </button>
            )}
          </div>
        </aside>

        <ContentSpine visible />

        <p className="fb-sign">
          {PERSONAL.name} · {PERSONAL.location}
        </p>
      </div>
    </div>
  );
}
