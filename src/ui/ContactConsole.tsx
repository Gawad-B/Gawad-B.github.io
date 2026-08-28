import { useEffect, useRef, useState } from 'react';
import { PERSONAL } from '@/data/personal';
import { MILANO } from '@/data/milano';
import { useJourney } from '@/store/journey';
import { blip } from '@/audio/ambience';
import './console.css';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const C = PERSONAL.contact;

const CHANNELS: Array<{ key: string; label: string; value: string; href: string; ext?: boolean }> = [
  { key: 'email', label: 'Email', value: C.email, href: `mailto:${C.email}` },
  { key: 'phone', label: 'Phone', value: C.phoneDisplay, href: `tel:${C.phone}` },
  { key: 'github', label: 'GitHub', value: C.githubHandle, href: C.github, ext: true },
  { key: 'linkedin', label: 'LinkedIn', value: C.linkedinHandle, href: C.linkedin, ext: true },
];

/** Rotating boot log. Original writing; nothing quoted from anywhere. */
function BootLog() {
  const [index, setIndex] = useState(0);
  const reducedMotion = useJourney((s) => s.reducedMotion);

  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % MILANO.quips.length);
    }, 5200);
    return () => clearInterval(id);
  }, [reducedMotion]);

  return (
    <div className="con-log" aria-hidden="true">
      <span className="con-log-prompt">&gt;</span>
      <span key={index} className="con-log-line">
        {MILANO.quips[index]}
      </span>
      <span className="con-log-caret" />
    </div>
  );
}

/**
 * The contact console. The reason the Milano exists.
 *
 * All five channels are real links, and the transmitter posts to the same
 * Web3Forms endpoint the previous portfolio used — so the ship is a place,
 * not a decoration wrapped around a form.
 */
export function ContactConsole() {
  const exitMilano = useJourney((s) => s.exitMilano);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const statusRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(statusRef.current), []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: C.formKey,
          name: form.name,
          email: form.email,
          message: form.message,
          subject: `Portfolio transmission from ${form.name}`,
        }),
      });
      const json = (await res.json()) as { success?: boolean; message?: string };
      if (json.success) {
        setStatus('sent');
        setForm({ name: '', email: '', message: '' });
        blip('open');
      } else {
        setStatus('error');
        setError(json.message ?? 'Transmission refused.');
      }
    } catch {
      setStatus('error');
      setError('No carrier. Check your connection and try again.');
    }
    statusRef.current = window.setTimeout(() => setStatus('idle'), 6000);
  };

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="con">
      {/* Registration plate — the joke, stated once and not laboured. */}
      <aside className="con-plate" aria-hidden="true">
        <p className="con-plate-title">{MILANO.citation.title}</p>
        <ul>
          {MILANO.citation.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </aside>

      <div className="con-card bezel">
        <div className="con-screen bezel-screen brackets scanlines">
          <header className="con-head">
            <div>
              <p className="eyebrow con-eyebrow">{MILANO.designation}</p>
              <p className="con-title">{MILANO.name}</p>
              <p className="con-loc">{MILANO.location}</p>
            </div>
            <button
              type="button"
              className="con-exit hit"
              onClick={() => {
                blip('close');
                exitMilano();
              }}
            >
              Exit vessel
            </button>
          </header>

          <BootLog />

          <section className="con-channels" aria-label="Contact channels">
            <p className="eyebrow con-label">Open channels</p>
            <ul>
              {CHANNELS.map((ch) => (
                <li key={ch.key}>
                  <a
                    className="con-channel hit"
                    href={ch.href}
                    {...(ch.ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    <span className="con-channel-key">{ch.label}</span>
                    <span className="con-channel-val">{ch.value}</span>
                    <span className="con-channel-go" aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="con-transmit" aria-label="Send a message">
            <p className="eyebrow con-label">{MILANO.transmitPrompt}</p>
            <p className="con-hint">{MILANO.transmitHint}</p>

            <form onSubmit={submit} noValidate={false}>
              <div className="con-row">
                <div className="con-field">
                  <label htmlFor="con-name">Name</label>
                  <input
                    id="con-name"
                    name="name"
                    value={form.name}
                    onChange={change}
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="con-field">
                  <label htmlFor="con-email">Email</label>
                  <input
                    id="con-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={change}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="con-field">
                <label htmlFor="con-message">Message</label>
                <textarea
                  id="con-message"
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={change}
                  required
                  aria-describedby={status === 'error' ? 'con-status' : undefined}
                />
              </div>

              <div className="con-actions">
                <button type="submit" className="con-send hit" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Transmitting…' : status === 'sent' ? 'Transmitted ✓' : 'Transmit'}
                </button>
                <p
                  id="con-status"
                  className={`con-status${status === 'error' ? ' is-error' : ''}${status === 'sent' ? ' is-ok' : ''}`}
                  role="status"
                  aria-live="polite"
                >
                  {status === 'sent' && 'Message received. Reply inbound.'}
                  {status === 'error' && error}
                </p>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
