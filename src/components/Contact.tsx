import { useState } from 'react';
import { motion } from 'motion/react';

export function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('idle');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: 'cde0ff64-770a-4d3a-b56b-27319258b496',
          name: formData.name,
          email: formData.email,
          message: formData.message,
          subject: `New Portfolio Contact from ${formData.name}`,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setStatus('error');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <motion.section
      id="contact"
      className="rp-contact"
      initial={{ opacity: 0, scale: 0.97, y: 10 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="rp-section-heading" style={{ marginBottom: 14 }}>
        Say hello
      </h2>
      <p className="rp-contact-intro">
        Open for work and fun alike — internships, freelance projects, collaborations, or just talking healthcare
        AI, Linux, and good games.
      </p>
      <form className="rp-form" onSubmit={handleSubmit}>
        <input
          className="rp-input"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          className="rp-input"
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <textarea
          className="rp-input"
          name="message"
          placeholder="Message"
          rows={5}
          value={formData.message}
          onChange={handleChange}
          required
        />
        <button type="submit" className="rp-submit" disabled={isSubmitting}>
          {status === 'success' ? 'Sent ✦ Thank You' : isSubmitting ? 'Sending…' : 'Send Message'}
        </button>
        {status === 'error' && <p className="rp-form-status rp-form-status--error">Failed to send. Please try again.</p>}
      </form>
      <div className="rp-socials">
        <a
          href="https://github.com/Gawad-B"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="rp-social"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
          </svg>
        </a>
        <a
          href="https://linkedin.com/in/abdelrahman-gawad-3536302bb"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="rp-social"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <rect x="2" y="9" width="4" height="12" rx="1" />
            <circle cx="4" cy="4" r="2" />
            <path d="M10 21v-7a4 4 0 0 1 8 0v7M10 9v1" />
          </svg>
        </a>
      </div>
      <div className="rp-footer">© 2026 Abdelrahman Gawad · Built Under A Rosé Pine Sky</div>
    </motion.section>
  );
}
