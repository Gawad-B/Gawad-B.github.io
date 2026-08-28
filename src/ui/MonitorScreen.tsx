import { useEffect, useRef, useState } from 'react';
import { PERSONAL } from '@/data/personal';
import { MILANO } from '@/data/milano';
import { useJourney } from '@/store/journey';
import { blip } from '@/audio/ambience';
import './monitor.css';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const C = PERSONAL.contact;

const CHANNELS: Array<{ key: string; label: string; value: string; href: string; ext?: boolean }> = [
  { key: 'email', label: 'EMAIL', value: C.email, href: `mailto:${C.email}` },
  { key: 'phone', label: 'PHONE', value: C.phoneDisplay, href: `tel:${C.phone}` },
  { key: 'github', label: 'GITHUB', value: `github.com/${C.githubHandle}`, href: C.github, ext: true },
  { key: 'linkedin', label: 'LINKEDIN', value: `linkedin.com/in/${C.linkedinHandle}`, href: C.linkedin, ext: true },
];

/**
 * Marquee: when a value doesn't fit its slot, it travels from the start
 * to the end, then jumps back and goes again. Measured, not assumed — a
 * value that fits never moves.
 */
function Marquee({ children }: { children: React.ReactNode }) {
  const outer = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    const measure = () => {
      const o = outer.current;
      const i = inner.current;
      if (!o || !i) return;
      const overflow = i.scrollWidth - o.clientWidth;
      setShift(overflow > 4 ? overflow : 0);
    };
    measure();
    // Fonts settle late inside a CSS-3D transform; measure again after.
    const t = window.setTimeout(measure, 600);
    return () => window.clearTimeout(t);
  }, [children]);

  return (
    <span
      ref={outer}
      className={`mon-marquee${shift ? ' is-over' : ''}`}
      style={
        shift
          ? ({
              '--mon-shift': `-${shift}px`,
              '--mon-dur': `${Math.max(5, shift / 16)}s`,
            } as React.CSSProperties)
          : undefined
      }
    >
      <span ref={inner}>{children}</span>
    </span>
  );
}

function BootLog() {
  const [index, setIndex] = useState(0);
  const reducedMotion = useJourney((s) => s.reducedMotion);

  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % MILANO.quips.length), 5200);
    return () => clearInterval(id);
  }, [reducedMotion]);

  return (
    <div className="mon-log" aria-hidden="true">
      <span className="mon-log-prompt">&gt;</span>
      <span key={index} className="mon-log-line">
        {MILANO.quips[index]}
      </span>
      <span className="mon-log-caret" />
    </div>
  );
}

/**
 * The ship's computer. This IS the contact section — not a window over
 * the scene but the screen of the machine bolted into the cockpit. All
 * five channels are real links and the transmitter posts to the same
 * Web3Forms endpoint the old site used.
 */
export function MonitorScreen() {
  const exitMilano = useJourney((s) => s.exitMilano);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const statusTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(statusTimer.current), []);

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
    statusTimer.current = window.setTimeout(() => setStatus('idle'), 6000);
  };

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="mon-screen scanlines" role="region" aria-label="Milano contact console">
      {/* OS chrome strip */}
      <header className="mon-bar">
        <span className="mon-bar-id">MILANO OS · v1.204</span>
        <span className="mon-bar-loc">
          <Marquee>{MILANO.location.toUpperCase()} · CHANNEL OPEN · FINE ACCRUING</Marquee>
        </span>
        <button
          type="button"
          className="mon-exit"
          onClick={() => {
            blip('close');
            exitMilano();
          }}
        >
          EXIT VESSEL
        </button>
      </header>

      <BootLog />

      <section className="mon-channels" aria-label="Contact channels">
        <p className="mon-label">OPEN CHANNELS</p>
        <ul>
          {CHANNELS.map((ch) => (
            <li key={ch.key}>
              <a
                className="mon-channel"
                href={ch.href}
                {...(ch.ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                <span className="mon-channel-key">{ch.label}</span>
                <Marquee>{ch.value}</Marquee>
                <span className="mon-channel-go" aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mon-transmit" aria-label="Send a message">
        <p className="mon-label">{MILANO.transmitPrompt}</p>
        <p className="mon-hint">{MILANO.transmitHint}</p>

        <form onSubmit={submit}>
          <div className="mon-row">
            <div className="mon-field">
              <label htmlFor="con-name">NAME</label>
              <input id="con-name" name="name" value={form.name} onChange={change} required autoComplete="name" />
            </div>
            <div className="mon-field">
              <label htmlFor="con-email">EMAIL</label>
              <input id="con-email" name="email" type="email" value={form.email} onChange={change} required autoComplete="email" />
            </div>
          </div>
          <div className="mon-field">
            <label htmlFor="con-message">MESSAGE</label>
            <textarea id="con-message" name="message" rows={3} value={form.message} onChange={change} required
              aria-describedby={status === 'error' ? 'mon-status' : undefined} />
          </div>
          <div className="mon-actions">
            <button type="submit" className="mon-send" disabled={status === 'sending'}>
              {status === 'sending' ? 'TRANSMITTING…' : status === 'sent' ? 'TRANSMITTED ✓' : 'TRANSMIT'}
            </button>
            <p id="mon-status" className={`mon-status${status === 'error' ? ' is-error' : ''}${status === 'sent' ? ' is-ok' : ''}`}
              role="status" aria-live="polite">
              {status === 'sent' && 'Message received. Reply inbound.'}
              {status === 'error' && error}
            </p>
          </div>
        </form>
      </section>
    </div>
  );
}
