import './footer.css';
import { PRO, RESUME_URL } from '../content';
import { PERSONAL } from '@/data/personal';
import { IconArrowUpRight, IconDownload } from './icons';

const NEW_TAB = <span className="pv-vh"> (opens in a new tab)</span>;

/** Page footer, rendered by ProApp after <main> so it is the contentinfo landmark. */
export function Footer() {
  const c = PRO.contact;
  const p = PERSONAL.contact;
  const giant = PRO.hero.giant;
  const wordmark = giant.charAt(0) + giant.slice(1).toLowerCase();

  return (
    <footer className="pv-foot">
      <div className="pv-container pv-foot__row">
        <div className="pv-foot__cols">
          <nav aria-label="Footer">
            <p className="pv-foot__head">{c.navHeading}</p>
            <ul className="pv-foot__list">
              {PRO.nav.links.map((l) => (
                <li key={l.id}>
                  <a className="pv-foot__link" href={l.href}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="pv-foot__head">{c.elsewhereHeading}</p>
            <ul className="pv-foot__list">
              <li>
                <a className="pv-foot__link" href={p.github} target="_blank" rel="noopener noreferrer">
                  GitHub
                  <IconArrowUpRight size={14} />
                  {NEW_TAB}
                </a>
              </li>
              <li>
                <a className="pv-foot__link" href={p.linkedin} target="_blank" rel="noopener noreferrer">
                  LinkedIn
                  <IconArrowUpRight size={14} />
                  {NEW_TAB}
                </a>
              </li>
              <li>
                <a className="pv-foot__link" href={RESUME_URL} download>
                  Résumé
                  <IconDownload size={14} />
                </a>
              </li>
            </ul>
          </div>
        </div>
        <span className="pv-foot__mark pv-rv" aria-hidden="true">
          {wordmark}
        </span>
      </div>
      <div className="pv-foot__bar">
        <p>
          {c.footer} · {c.location}
        </p>
      </div>
    </footer>
  );
}
