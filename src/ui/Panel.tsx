import { useEffect, useRef } from 'react';
import './panel.css';

interface Props {
  /** Light variant is mandatory for near-black worlds. */
  mode: 'light' | 'dark';
  accent: string;
  eyebrow: string;
  title: string;
  /** Mono designation shown under the title. */
  designation?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Telemetry column — real astronomical facts. */
  facts?: string[];
  factsLabel?: string;
}

/**
 * The instrument panel. Machined outer housing with an inner screen, tight
 * radii and corner registration marks — hardware, not a card.
 *
 * Side panel from 768px up, bottom sheet below. The light variant exists
 * for one reason: WASP-76 b and TrES-2b are genuinely near-black, and a
 * dark panel over them would have nothing to sit against.
 */
export function Panel({
  mode,
  accent,
  eyebrow,
  title,
  designation,
  onClose,
  children,
  facts,
  factsLabel = 'Observed',
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Move focus in when the panel opens so keyboard users land inside it.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Esc closes from anywhere inside.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    const node = ref.current;
    node?.addEventListener('keydown', onKey);
    return () => node?.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`pnl pnl--${mode} bezel`}
      style={{ ['--accent' as string]: accent }}
      role="dialog"
      aria-modal="false"
      aria-label={`${title} — mission dossier`}
    >
      <div className="pnl-screen bezel-screen brackets scanlines">
        <header className="pnl-head">
          <div className="pnl-head-text">
            <p className="eyebrow pnl-eyebrow">{eyebrow}</p>
            <h2 className="pnl-title">{title}</h2>
            {designation && <p className="pnl-desig">{designation}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            className="pnl-close hit"
            onClick={onClose}
            aria-label={`Close ${title} and return to the survey`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.2" fill="none" />
            </svg>
          </button>
        </header>

        <div className="pnl-rule" />

        <div className="pnl-body">{children}</div>

        {facts && facts.length > 0 && (
          <>
            <div className="pnl-rule" />
            <section className="pnl-facts" aria-label={`${factsLabel} — astronomical data`}>
              <p className="eyebrow pnl-facts-label">{factsLabel}</p>
              <ul>
                {facts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
