# Handoff: Rosé Pine Portfolio — Abdelrahman Gawad

## Overview
A personal portfolio redesign that feels like an ambient, explorable game world: a Rosé Pine "night sky" with drifting glowing particles, a cursor sparkle trail, a typewriter hero, floating skill orbs, a horizontal scroll-snap project carousel, and a glowing contact form.

## About the Design Files
The file in this bundle (`Portfolio.dc.html`) is a **design reference created in HTML** — a prototype showing intended look and behavior, NOT production code to copy directly. Your task is to **recreate this design in the existing portfolio codebase** (React + TypeScript + Vite, hand-crafted CSS or Tailwind, Framer Motion for reveals, canvas API for particles — no UI component libraries).

## Fidelity
**High-fidelity.** Recreate pixel-perfectly: exact colors, fonts, spacing, animations, and copy below.

## Design Tokens (Rosé Pine — exact, no deviation)
Define as CSS custom properties at :root:
- --base: #191724 (page background)
- --surface: #1f1d2e (cards/panels)
- --overlay: #26233a (inputs, hover, tags, frosted nav tint)
- --muted: #6e6a86 (subtle text, quotes)
- --subtle: #908caa (secondary text, body copy)
- --text: #e0def4 (primary text)
- --love: #eb6f92 (accent: cursor trail, submit button, active nav, project titles)
- --gold: #f6c177 (warm accent: language orbs, alt project titles)
- --rose: #ebbcba (section headings, database orbs)
- --pine: #31748f (Linux/DevOps orbs, blob gradient start)
- --foam: #9ccfd8 (web-dev orbs, taglines, GitHub-link hover glow)
- --iris: #c4a7e7 (ML orbs, name glow, focus glow, blob gradient end)
- --highlightHigh: #524f67 (borders, footer text)

## Typography (Google Fonts)
- Headings + name: 'Cormorant Garamond', serif — weight 500 (h2 42px, name clamp(44px, 8vw, 96px), card titles 600/30px)
- Body: 'DM Sans', sans-serif — 15–17px, line-height 1.7–1.8
- Mono (labels, taglines, pills, nav, footer): 'JetBrains Mono' — 11–14px, letter-spacing .12–.25em on labels, uppercase eyebrows

## Global
- Smooth scroll (scroll-behavior: smooth), overflow-x hidden
- Selection: background #524f67, color #e0def4
- Links default #9ccfd8, hover #ebbcba
- Fixed full-screen canvas (z-index 0, pointer-events none) behind everything
- Entry animation: full-screen #191724 overlay fades out over 1.8s (delay .2s) on load ("eye opening" bloom)

## Screens / Sections

### Navigation
Floating pill, fixed top 20px, centered. Background rgba(38,35,58,.55) + backdrop-filter blur(14px), 1px border rgba(82,79,103,.5), border-radius 999px, inner padding 6px, 4px gap. Items: JetBrains Mono 13px, padding 8px 16px, radius 999px, color #908caa, hover #e0def4. Active section item: color #eb6f92, background rgba(235,111,146,.1), pulsing box-shadow ring animation (rgba(235,111,146,.45) → transparent, 2.4s loop). Active state driven by IntersectionObserver scroll-spy (rootMargin -40% 0px -55%).
Items: Home, About, Skills, Projects, Contact.

### 1. Hero (full viewport, centered column)
- Eyebrow: "Alexandria, Egypt · CS @ E-JUST" — mono 13px, .25em tracking, uppercase, #908caa
- Name "Abdelrahman Gawad": Cormorant Garamond 500, clamp(44px,8vw,96px), typewriter reveal (~75ms/char) with 2px iris caret that blinks then hides when done; "breathing" glow: text-shadow pulsing between 0 0 24px rgba(196,167,231,.35) and 0 0 40px rgba(196,167,231,.6) over 5s
- Rotating tagline: mono, foam #9ccfd8, prefixed "// ", cycles every 3.2s through: Healthcare AI Engineer / Full-Stack Developer / Linux Enthusiast / Competitive Programmer. Swap animation: vertical clip reveal (clip-path inset from bottom) + translateY(14px) + fade, .6s cubic-bezier(.22,1,.36,1)
- Scroll chevron "⌄" bottom-center, iris, bobbing 8px + opacity .5→1, 2s loop

### 2. About (max-width 1000px, two-column grid 340px / 1fr, gap 56px; stacks on ≤760px)
- Left: organic SVG blob frame — outer stroked blob path (2.5px stroke, linear gradient #31748f → #c4a7e7), inner filled blob #1f1d2e, and a blob-radius photo placeholder (repeating 45° stripes #26233a/#1f1d2e 8px) with mono caption "Drop A Photo Of Abdelrahman Here". Replace placeholder with a real photo, keep the blob mask.
- Right: bio in #908caa, 17px/1.8. Exact copy (3 paragraphs + quote) is in Portfolio.dc.html. Ends with italic muted quote: "Craft is just care, made visible."
- Section heading style (all sections): Cormorant Garamond 500, 42px, #ebbcba

### 3. Skills — floating orbs (no lists, no progress bars)
Seven groups, each with a mono uppercase label (12px, .22em tracking, #6e6a86) and a flex-wrap cluster (gap 20px):
- Machine Learning / AI (iris 196,167,231): Machine Learning, Neural Networks, Ensemble Models, XGBoost, PyTorch, Scikit-learn, Feature Engineering, HF Diffusers, Claude Code, Bioinformatics
- Frontend (foam 156,207,216): React, TypeScript, HTML, CSS, Tailwind CSS, Vite
- Backend / APIs (foam): Node.js, Flask, FastAPI, REST APIs, JWT Auth
- Databases (rose 235,188,186): PostgreSQL, SQLite, MariaDB, Firebase, Neon, MySQL
- Linux / DevOps (pine 49,116,143): Linux, System Administration, Bash, Docker, Git, GitHub, Cloud Hosting
- Languages (gold 246,193,119): Python, JavaScript, TypeScript, SQL, Bash, C++, R
- Computer Science (muted 110,106,134): Data Structures, Algorithms, OOP, Design Patterns, DB Normalization, Virtual Memory, Cache Memory

Orb style: mono 13px, padding 14px 20px, radius 999px, background #1f1d2e, 1px border rgba(C,.4), text rgb(C), glow box-shadow 0 0 18px rgba(C,.12). Each orb floats up/down 10px on a staggered keyframe loop (duration 3.5–5.5s, delay i*0.35s). Hover: glow intensifies to 0 0 34px rgba(C,.45).

### 4. Projects — horizontal scroll-snap carousel (not a grid)
Track: flex, gap 28px, overflow-x auto, scroll-snap-type x mandatory, side padding max(28px, calc(50vw - 500px)), thin scrollbar (#524f67).
Card: flex 0 0 min(380px, 82vw), snap-align center, background #1f1d2e + a unique subtle texture per card (repeating diagonal/horizontal hairlines or radial washes at .03–.08 alpha in the card's accent), border 1px #26233a, radius 20px, padding 30px, column flex.
Card contents: mono uppercase kind label (11px, #6e6a86) → title (Cormorant Garamond 600 30px, love or gold) → description (15px #908caa, flex 1) → tech pill tags (mono 12px, 4px 12px, #26233a bg, #524f67 border, #908caa text, radius 999px) → "↗ GitHub" link (mono 13px, #908caa; hover: foam #9ccfd8 with text-shadow glow).
Hover: card lifts translateY(-4px) + bloom box-shadow 0 12px 48px in the card's glow color (.4s cubic-bezier(.22,1,.36,1)); a sheen sweep (skewed translucent gradient pseudo-element) sweeps across, .9s.
Cards (copy in Portfolio.dc.html):
1. CVD Prediction — Healthcare AI — title #eb6f92, glow iris — tags Python, XGBoost, scikit-learn
2. This Portfolio — Ambient Web — title #f6c177, glow foam — tags React, TypeScript, Canvas
3. Clinic Companion — Full-Stack — title #eb6f92, glow gold — tags React, Node.js, PostgreSQL
4. Dotfiles — Linux Ritual — title #f6c177, glow pine — tags Bash, Lua, Neovim
GitHub links are placeholders (https://github.com/) — wire to the real repos.

### 5. Contact (max-width 560px, centered)
- Heading "Say hello" + intro: "Open for work and fun alike — internships, freelance projects, collaborations, or just talking healthcare AI, Linux, and good games."
- Form (column, gap 16px): inputs Name / Email / Message(textarea rows 5) — background #26233a, border 1px #524f67, radius 12px, padding 14px 18px, text #e0def4, placeholder #6e6a86. Focus: border #c4a7e7 + glow 0 0 24px rgba(196,167,231,.25), .3s transition.
- Submit button: pill, transparent love — background rgba(235,111,146,.12), border 1px #eb6f92, text #eb6f92, mono 14px .12em tracking, continuous pulse ring animation (2.6s). Hover background rgba(235,111,146,.25). On submit label becomes "Sent ✦ Thank You" (prototype only — wire to a real form backend, e.g. Formspree, or mailto).
- Social: GitHub + LinkedIn as 24px 1.5-stroke line icons, #6e6a86; hover foam + drop-shadow glow. Links are placeholders.
- Footer: mono 12px #524f67 — "© 2026 Abdelrahman Gawad · Built Under A Rosé Pine Sky"

## Interactions & Behavior
- **Particle field**: full-screen canvas, ~60 particles desktop / ~24 mobile (lazy/reduced on mobile). Mix of micro dots (r 0.4–1.2) and ~15% larger glow orbs (r 2–5, radial-gradient halo at 6×r). Colors: iris, foam, pine (rgba, alpha .15–.6, sine twinkle). Slow upward drift (vy −0.03…−0.13), slight horizontal wander, wrap at edges. requestAnimationFrame; respect a reduce-motion flag.
- **Cursor trail**: on mousemove (throttled ~40ms), spawn a 3–7px #eb6f92 dot with glow at cursor ±5px jitter; animates opacity .9→0 + scale 1→.2 + drift up over .8s, then removed. Skip on touch devices.
- **Scroll reveals** (About/Skills/Projects/Contact): initial opacity 0, scale(.97) translateY(10px); on ~12% intersection → opacity 1, scale(1), .9s ease / cubic-bezier(.22,1,.36,1). Use Framer Motion (whileInView) in the real build. NOT the generic fade-from-bottom — the scale component matters.
- Nav scroll-spy as described; anchor links smooth-scroll to sections.

## State Management
- typed name progress + caret visibility (typewriter)
- tagline index (interval 3.2s)
- active nav section (IntersectionObserver)
- form sent flag
- Optional settings: particle density, cursor-trail on/off, reduce-motion

## Assets
No raster assets. Google Fonts: Cormorant Garamond, DM Sans, JetBrains Mono. Icons: inline SVG line icons (GitHub, LinkedIn). Needed from owner: real photo for About blob, real GitHub/LinkedIn URLs, real repo links.

## Hard Rules (from the brief)
No UI libraries, no Bootstrap, no light backgrounds, no blue-dominant scheme, no timeline layout, no chatbot widget, no default scroll behavior.

## Files
- `Portfolio.dc.html` — the full design reference (template markup + logic). All exact copy, styles, and keyframes live here.
