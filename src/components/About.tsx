import { motion } from 'motion/react';

export function About() {
  return (
    <motion.section
      id="about"
      className="rp-about"
      initial={{ opacity: 0, scale: 0.97, y: 10 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="rp-section-heading">About</h2>
      <div className="rp-about-grid">
        <div className="rp-blob">
          <svg viewBox="0 0 200 200">
            <defs>
              <linearGradient id="blobGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#31748f" />
                <stop offset="100%" stopColor="#c4a7e7" />
              </linearGradient>
            </defs>
            <path
              d="M100 12 C145 8 185 45 188 95 C191 140 160 185 108 190 C60 194 16 162 12 110 C8 62 50 17 100 12 Z"
              fill="none"
              stroke="url(#blobGrad)"
              strokeWidth={2.5}
            />
            <path
              d="M100 26 C138 22 172 52 175 96 C178 134 152 172 106 176 C64 180 27 152 24 108 C21 68 57 30 100 26 Z"
              fill="#1f1d2e"
            />
          </svg>
          <div className="rp-blob-photo">
            <img src="/assets/profile.jpg" alt="Abdelrahman Gawad" className="rp-blob-photo-img" />
          </div>
        </div>
        <div className="rp-bio">
          <p>
            I'm Abdelrahman — from Alexandria, the city where the Mediterranean does most of my thinking for me. I
            study CS at Egypt-Japan University, deep in AI and bioinformatics.
          </p>
          <p>
            By day I train ensemble models to predict cardiovascular disease before it happens — the kind of ML
            that might actually buy someone more time. By night I rice my Linux setup for the hundredth time,
            because the terminal should be beautiful too.
          </p>
          <p>
            When I'm not shipping React apps or tuning XGBoost, I'm probably lost in a story-driven game, taking
            notes on how it made me <em>feel</em> — then trying to smuggle that feeling into everything I build.
          </p>
          <p className="rp-bio-quote">"Craft is just care, made visible."</p>
        </div>
      </div>
    </motion.section>
  );
}
