import './contact.css';
import { useEffect, useRef, useState } from 'react';
import { PRO, RESUME_URL } from '../content';
import { PERSONAL } from '@/data/personal';
import { UNIVERSE_THUMB } from '../assets';
import {
  IconAsterisk,
  IconCheck,
  IconCopy,
  IconDownload,
  IconGitHub,
  IconLinkedIn,
  IconPhone,
  IconSpark,
} from './icons';
import { UniverseGate } from './UniverseGate';
import { Words, wordCount } from './Words';

type CopyState = 'idle' | 'copied' | 'fallback';

const NEW_TAB = <span className="pv-vh"> (opens in a new tab)</span>;

export function Contact() {
  const c = PRO.contact;
  const p = PERSONAL.contact;
  const [state, setState] = useState<CopyState>('idle');
  const addrRef = useRef<HTMLAnchorElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
    },
    [],
  );

  const settle = (next: CopyState) => {
    setState(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), next === 'copied' ? 2000 : 4000);
  };

  const selectAddress = () => {
    const el = addrRef.current;
    const sel = window.getSelection();
    if (!el || !sel) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  const copy = () => {
    const fallback = () => {
      selectAddress();
      settle('fallback');
    };
    if (typeof navigator === 'undefined' || !navigator.clipboard || !navigator.clipboard.writeText) {
      fallback();
      return;
    }
    navigator.clipboard.writeText(p.email).then(() => settle('copied'), fallback);
  };

  const copied = state === 'copied';
  const announcement = copied ? c.copied : state === 'fallback' ? c.copyFallback : '';
  const at = p.email.indexOf('@');
  const emailLocal = at < 0 ? p.email : p.email.slice(0, at);
  const emailDomain = at < 0 ? '' : p.email.slice(at + 1);
  const giant = PRO.hero.giant;
  const wordmark = giant.charAt(0) + giant.slice(1).toLowerCase();

  // Contact ends at </section>; the footer is rendered by ProApp after <main>.
  return (
    <section id="contact" className="pv-contact pv-section" aria-labelledby="contact-title">
      <div className="pv-container">
        <div className="pv-contact__card pv-rv pv-rv--img">
          <img
            className="pv-contact__bg"
            src={UNIVERSE_THUMB.src}
            width={UNIVERSE_THUMB.width}
            height={UNIVERSE_THUMB.height}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
          />
          <div className="pv-contact__inner">
            {/* Heading column first in the DOM so the h2 precedes the panel; CSS order puts the panel first visually. */}
            <div className="pv-contact__side pv-on-dark">
              <p className="pv-label pv-label--on-dark">
                <IconAsterisk size={12} /> {c.label}
              </p>
              <h2 id="contact-title" className="pv-h2 pv-h2--on-dark pv-rv pv-rv--words">
                <span>
                  <Words text={c.heading[0]} />
                </span>{' '}
                <span className="pv-h2__muted">
                  <Words text={c.heading[1]} startIndex={wordCount(c.heading[0])} />
                </span>
              </h2>
              <span className="pv-contact__spark" aria-hidden="true">
                <IconSpark size={22} />
              </span>
              <p className="pv-contact__line">{c.line}</p>
              <UniverseGate variant="line" />
            </div>

            <div className="pv-contact__panel">
              <div className="pv-contact__brand" aria-hidden="true">
                {wordmark}
              </div>
              <div className="pv-contact__panel-body">
                <p className="pv-contact__panel-title">{c.cardTitle}</p>
                <a ref={addrRef} className="pv-contact__addr" href={`mailto:${p.email}`}>
                  <span>
                    {emailLocal}
                    <wbr />@{emailDomain}
                  </span>
                </a>
                <button type="button" className="pv-btn pv-btn--primary pv-btn--block" onClick={copy}>
                  <span key={copied ? 'copied' : 'idle'} className="pv-contact__lbl">
                    {copied ? c.copied : c.copy}
                  </span>
                  <span className="pv-btn__icon">{copied ? <IconCheck size={16} /> : <IconCopy size={16} />}</span>
                </button>
                <span className="pv-vh" role="status">
                  {announcement}
                </span>
                <ul className="pv-contact__links">
                  <li>
                    <a className="pv-link" href={p.github} target="_blank" rel="noopener noreferrer">
                      <IconGitHub size={16} />
                      GitHub
                      <span className="pv-vh"> · {p.githubHandle}</span>
                      {NEW_TAB}
                    </a>
                  </li>
                  <li>
                    <a className="pv-link" href={p.linkedin} target="_blank" rel="noopener noreferrer">
                      <IconLinkedIn size={16} />
                      LinkedIn
                      <span className="pv-vh"> · {p.linkedinHandle}</span>
                      {NEW_TAB}
                    </a>
                  </li>
                  <li>
                    <a className="pv-link" href={RESUME_URL} download>
                      <IconDownload size={16} />
                      Résumé (PDF)
                    </a>
                  </li>
                  <li>
                    <a className="pv-link" href={`tel:${p.phone}`}>
                      <IconPhone size={16} />
                      {p.phoneDisplay}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
