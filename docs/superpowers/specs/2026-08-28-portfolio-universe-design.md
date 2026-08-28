# Portfolio Universe — Design Spec

**Date:** 2026-08-28
**Author:** Abdelrahman Gawad (design session with Claude)
**Status:** Approved for implementation

A complete from-scratch rebuild of `Gawad-B.github.io` as an immersive 3D deep-space
exploration portfolio. The 3D environment *is* the navigation system, not decoration.
Deployment moves from GitHub Pages to Vercel.

---

## 1. Objectives

1. **Exploration first, portfolio second** — the visitor explores a universe that happens
   to be a portfolio. But portfolio information stays trivially easy to reach.
2. **Zero fabrication** — all copy, projects, skills and links come from the existing
   repository. Nothing is invented.
3. **Never a blank screen** — no-WebGL, reduced-motion and low-tier devices all get a
   complete, beautiful, accessible experience.
4. **Production quality** — type-checked, performant on mid-range mobile, WCAG 2.2 AA.

## 2. Non-goals

- No 3D model files (`.glb`/`.gltf`), no texture images, no audio files. Everything is
  procedural: GLSL shaders and constructed geometry.
- No reproduction of copyrighted third-party 3D assets. The Milano is an **original**
  procedurally-modelled scavenger craft built in homage; the name is used as an
  in-fiction easter-egg reference only.
- No CMS, no backend. The existing Web3Forms endpoint remains the only network call.

---

## 3. Content inventory (source of truth)

Extracted from `src/components/*.tsx` at commit `b35eae0`.

### Identity
- **Name:** Abdelrahman Gawad
- **Location / affiliation:** Alexandria, Egypt · CS @ Egypt-Japan University (E-JUST)
- **Roles (rotating):** Healthcare AI Engineer · Full-Stack Developer · Linux Enthusiast ·
  Competitive Programmer
- **Bio:** four paragraphs, preserved verbatim in meaning (Alexandria/Mediterranean;
  CS at E-JUST, AI and bioinformatics; cardiovascular-disease ensemble models by day,
  Linux ricing by night; story-driven games and smuggling that feeling into what he builds).
- **Quote:** "Craft is just care, made visible."

### Contact (all five, per user decision)
| Channel | Value |
|---|---|
| Email | `abdelrahman.gawad.28@gmail.com` |
| Phone | `+20 102 732 1793` |
| GitHub | `https://github.com/Gawad-B` |
| LinkedIn | `https://linkedin.com/in/abdelrahman-gawad-3536302bb` |
| Form | Web3Forms, access key `cde0ff64-770a-4d3a-b56b-27319258b496` |

### Skills — 7 groups, 48 entries
| Group | Count | Entries |
|---|---|---|
| Machine Learning / AI | 10 | Machine Learning, Neural Networks, Ensemble Models, XGBoost, PyTorch, Scikit-learn, Feature Engineering, HF Diffusers, Claude Code, Bioinformatics |
| Frontend | 6 | React, TypeScript, HTML, CSS, Tailwind CSS, Vite |
| Backend / APIs | 5 | Node.js, Flask, FastAPI, REST APIs, JWT Auth |
| Databases | 6 | PostgreSQL, SQLite, MariaDB, Firebase, Neon, MySQL |
| Linux / DevOps | 7 | Linux, System Administration, Bash, Docker, Git, GitHub, Cloud Hosting |
| Languages | 7 | Python, JavaScript, TypeScript, SQL, Bash, C++, R |
| Computer Science | 7 | Data Structures, Algorithms, OOP, Design Patterns, DB Normalization, Virtual Memory, Cache Memory |

### Projects — 7 (descriptions preserved verbatim from `Projects.tsx`)
1. **Labora** — Healthcare · LIS. TypeScript, React, Express, PostgreSQL, Prisma, Docker.
   Link: `https://laboralanding.freeddns.org` (landing page; repo private).
2. **Quizzy** — Ed-Tech · Coming Soon. React, Vite, Express, PostgreSQL, Firebase Auth.
   No link (repo private during rebuild).
3. **ATTG** — Scheduling · CSP. Python, TypeScript, Tailwind CSS.
   Link: `https://github.com/Gawad-B/Automatic-Timetable-Generator`.
4. **RDMID** — Healthcare AI. Python, Diffusion Models, Bootstrap CSS.
   Link: `https://github.com/Gawad-B/latent-diffusion-model`.
5. **Prayer Times** — Linux Ritual. TypeScript, GNOME Shell, GStreamer.
   Link: `https://github.com/Gawad-B/Prayer_TImes`.
6. **CVD Prediction** — Healthcare AI. Python, XGBoost, scikit-learn.
   Link: `https://github.com/Gawad-B/CVD`.
7. **This Portfolio** — Ambient Web. React, TypeScript, Three.js / GLSL.
   Link: `https://github.com/Gawad-B/Gawad-B.github.io`.
   (Description is rewritten — it must now describe the universe, not the Rosé Pine site.)

### Assets retained
`public/assets/profile.jpg` (used in the About dossier), `public/favicon.svg`.
Project screenshots (`attg.png`, `cvd.png`, `library.png`, `portfolio.png`, `quizzy.png`,
`RDMID.png`) are retained on disk and shown in the non-WebGL fallback only — the 3D
project panels are text-and-telemetry, not screenshots.

---

## 4. Art direction

### 4.1 Palette — cold instrument monochrome + one warm signal

Deliberately *not* Rosé Pine. The reference points are JPL/ESA mission control and the
restraint of *Interstellar* / *The Expanse* / *First Man*: near-monochrome, colour used
only where it carries meaning.

```
/* Void — never pure black (dead), never neutral grey (flat). Cold blue-violet. */
--void-0   #04060B   page ground / infinite space
--void-1   #080B13   panel ground
--void-2   #0E131D   raised surface
--void-3   #161C28   hairlines, ring gaps
--hull     #1E2532   spacecraft plating, Milano interior

/* Instrument light — the readable layer */
--instr-100 #F2F5FA  primary text
--instr-70  #AEB8C9  secondary text
--instr-45  #6E7A8D  labels, telemetry keys
--instr-25  #3D4655  grid lines, disabled

/* Signal — exactly three, each with one job */
--signal   #FFB35C   mission amber: CTAs, active nav, focus rings, caution
--data     #7FD4E8   telemetry cyan: live readouts, links, hover
--alert    #FF5F57   signal red: errors, the parking citation, criticals
```

**Chrome stays monochrome; colour enters from the worlds.** Each world declares its own
`accent` and `panelMode`, derived from its real astronomy. This satisfies the
per-project-contrast requirement structurally rather than by hand.

Environment nebulae use real emission colours at 6–10% opacity (H-α crimson `#7A1F3D`,
O-III teal `#0F4A52`, dust ochre `#4A3A2A`) so they read as near-neutral haze and never
compete with the UI.

### 4.2 Typography — no new font loads

The three faces already in `index.html` are reused:
- **DM Sans** weight 300, tight tracking — display and body. Low weight + tight tracking
  reads cold and instrumental rather than friendly.
- **JetBrains Mono** — every readout, label, coordinate, HUD element, eyebrow tag.
- **Cormorant Garamond** — exactly one use: the "Craft is just care, made visible."
  line in the About dossier. The single human note inside all the machinery.

### 4.3 Panel language — machined instrument housing

Nested "double-bezel": an outer machined shell (`--hull`, hairline ring, 2px padding,
6px radius) containing an inner screen (`--void-1`, inset top highlight, 4px radius).
Tight radii, not squircles — this is hardware, not a SaaS card. Corner brackets and
1px scanline overlays instead of drop shadows. Eyebrow tags (`10px`, uppercase,
`0.2em` tracking, mono) precede every heading.

---

## 5. World mapping

Each planet's *real* astronomical signature motivates both its visual treatment and its
project pairing. All astronomy is factual.

| # | World | Real signature | Project | Accent | Panel |
|---|---|---|---|---|---|
| — | **Stephenson 2-18** | Red hypergiant, ~2150 R☉, ~3200 K, Scutum. Among the largest stars known | Hero | `#FF7043` | — |
| — | **HD 189733 b** | Hot Jupiter, cobalt blue from silicate haze, 7000 km/h winds, sideways glass rain | About | `#2E6FD9` | dark |
| — | **Saturn** | Real ring optical depths, Cassini Division, ring shadow, Roche-limit particles | Skills | `#D6C08A` | dark |
| 01 | **WASP-76 b** | Ultra-hot Jupiter 2400 K; iron vaporises dayside and **rains as liquid iron** on the nightside | Labora | `#FF7A3D` | **light** |
| 02 | **55 Cancri e** | Tidally-locked super-Earth, **lava ocean**, carbon-rich | Quizzy | `#FF5C1F` | dark |
| 03 | **TrES-2b** | **Darkest known planet** — reflects <1% of light; only a faint red self-glow | Prayer Times | `#C1352B` | **light** |
| 04 | **KELT-9b** | Hottest known gas giant ~4300 K; atmosphere **stripped into a comet-like tail**, molecules dissociating | RDMID | `#B8D8FF` | dark |
| 05 | **Kepler-16b** | **Circumbinary "Tatooine" planet** — two suns, **double shadows**, cold Saturn-class | ATTG | `#CBB894` | dark |
| 06 | **K2-18b** | Habitable-zone sub-Neptune, **water vapour confirmed**, candidate hycean ocean world | CVD Prediction | `#4FB8C9` | dark |
| 07 | **HD 110067** | Six sub-Neptunes in a perfect **3:2·3:2·3:2·4:3·4:3 resonant chain** — most harmonious system known | This Portfolio | `#C8D2E0` | dark |

`panelMode: 'light'` is required where the world is near-black (WASP-76 b nightside,
TrES-2b) — the panel becomes instrument-white with dark text to keep contrast.

`WASP-193 b` (super-puff, cotton-candy density) and `PSR B1257+12 b` (pulsar planet)
remain defined in `data/worlds.ts` as unused slots 08 and 09 for future projects.

### 5.1 Region detail

**Stephenson 2-18 (hero).** Dim red hypergiant filling most of the frame. Shader:
domain-warped fBm granulation (convection cells) + limb darkening + chromosphere Fresnel
rim + slow surface churn. Foreground dust lanes on two parallax planes give the scale cue.
Overlay: eyebrow (`STEPHENSON 2-18 · SCUTUM · 2150 R☉`), name as `<h1>`, rotating role,
one-line intro, `ENTER THE UNIVERSE` primary CTA.

**HD 189733 b (about).** Planet framed right, dossier panel left. Shader: deep cobalt
base, Rayleigh-scattering blue limb, high-velocity zonal wind bands advecting, silicate
haze layer on a second slightly-larger sphere, glass-rain streaks driven sideways by the
wind vector. Dossier carries the profile photo, the four bio paragraphs as real `<p>`s,
a telemetry sidebar (location, institution, focus areas) and the Cormorant quote.

**Saturn system (skills).** Body: banded fBm with hexagonal-polar hint. Rings:
`InstancedMesh` particle field respecting real A/B/C optical depths with the **Cassini
Division as a genuine gap**; planet shadow projected onto the ring plane in the shader.
The 7 skill groups become **7 orbital bands** outside the rings; the 48 skills become
moons on them (`InstancedMesh`, promoted to an individual mesh only when hovered or
selected). Orbital periods follow Kepler's third law from each band's radius, so inner
bands genuinely move faster. Hover → moon brightens and scales, label appears. Click →
camera eases to the moon, detail panel opens, Saturn stays framed behind. HUD band
selector isolates a single group.

**Project belt.** The 7 worlds on a wide elliptical arc at varying inclinations, each in
its own lighting pocket (a scoped point light + rim light per world, assigned to a light
layer so it cannot leak). A spacecraft nav manifest (`01 WASP-76 b · LABORA`) is always
reachable. Clicking a planet *or* a manifest row flies the camera in.

**The Milano (contact).** An original procedurally-modelled scavenger craft — long
fuselage, forward-swept wings, twin nacelles, canopy, chipped blue-and-orange plating —
**parked inside Saturn's rings, wedged in the Cassini Division**. A citation decal on the
canopy reads `UNAUTHORIZED PARKING · RING DIVISION C · FINE: 40,000 UNITS`, and a small
HUD marker tracks it. It is discoverable while exploring skills, and also has a HUD nav
entry so it is never lost. Clicking triggers a scripted camera sequence: approach → hull
plating passes the lens → cut to interior. Interior: cockpit seats, canopy showing the
rings still turning outside, ambient panel lights, and the **contact console** carrying
email, phone, GitHub, LinkedIn and the Web3Forms transmitter, with an original rotating
boot-log of jokes (short, professional, chaotic-space-adventure energy — no copyrighted
dialogue).

---

## 6. Architecture

### 6.1 Approach — hybrid one-sky, mounted regions

One persistent `<Canvas>` and one persistent sky (starfield + nebula + dust) that never
unmount. Region scene-graphs mount and unmount as the traveller moves. A single camera
rig is continuous, so every transition is a real flight, never a page swap. Only the
active region plus a prefetched neighbour are resident.

### 6.2 File layout

```
src/
├── main.tsx
├── App.tsx                     Canvas + overlays + content spine
├── data/
│   ├── personal.ts             identity, bio, contact, socials
│   ├── skills.ts               7 groups → orbital bands, 48 skills → moons
│   ├── projects.ts             7 projects (pure content)
│   ├── worlds.ts               astronomy + shader params + accent + panelMode
│   └── milano.ts               boot-log quips, citation text
├── store/
│   └── journey.ts              zustand: region, target, phase, tier, audio, a11y
├── scene/
│   ├── Universe.tsx            Canvas, composer, region switch
│   ├── CameraRig.tsx           waypoint easing, warp, orbit, shake
│   ├── Sky.tsx                 Starfield + Nebula + Dust (persistent)
│   ├── Planet.tsx              one shader-driven planet, param-configured
│   ├── Atmosphere.tsx          Fresnel shell
│   ├── OrbitPath.tsx           instanced arc line
│   ├── Hotspot.tsx             invisible raycast sphere (large touch target)
│   ├── shaders/                planet.glsl.ts, star.glsl.ts, rings.glsl.ts,
│   │                           nebula.glsl.ts, noise.glsl.ts (shared fBm)
│   └── quality.ts              device tier probe → render budgets
├── regions/
│   ├── HeroRegion.tsx          Stephenson 2-18
│   ├── AboutRegion.tsx         HD 189733 b
│   ├── SkillsRegion.tsx        Saturn + rings + 7 bands + 48 moons + Milano
│   ├── ProjectsRegion.tsx      7-world belt
│   └── MilanoInterior.tsx      cockpit + contact console
├── ui/
│   ├── HUD.tsx                 nav reticle, region readout, breadcrumb
│   ├── NavManifest.tsx         spacecraft nav list (projects + skill bands)
│   ├── Panel.tsx               double-bezel housing, light/dark modes
│   ├── LoadingScreen.tsx       real-progress star ignition
│   ├── WarpVeil.tsx            transition overlay
│   └── AudioToggle.tsx         WebAudio synth ambience, default muted
├── content/
│   ├── ContentSpine.tsx        semantic DOM of ALL content (a11y + SEO + fallback)
│   └── FallbackSite.tsx        visible styled version of the spine
└── styles/
    ├── tokens.css              palette, type scale, motion curves
    └── index.css               Tailwind entry + component layer
```

### 6.3 The content spine (accessibility + SEO + fallback in one)

All copy lives in `src/data/*.ts` and renders once through `ContentSpine` into a real
semantic `<main>`: one `<h1>`, `<section>` per region, `<article>` per project, real
`<a href>` links, real `<h2>`/`<h3>` hierarchy.

- **3D mode:** the spine is visually clipped but present, focusable and fully readable by
  screen readers and crawlers.
- **Fallback mode:** the *same markup* is revealed and styled as a deep-space document.

Fallback triggers: WebGL unavailable/context-lost, `prefers-reduced-motion: reduce`
(offered, with an opt-in to enter 3D anyway), device tier probe failure, or an explicit
user toggle. There is therefore no second implementation of the content and no path to a
blank screen.

### 6.4 State

`zustand` store, single source of truth:

```ts
{
  region: 'hero'|'about'|'skills'|'projects'|'milano-exterior'|'milano-interior'
  focus:  { kind: 'none'|'project'|'skill'|'milano', id?: string }
  phase:  'loading'|'idle'|'traveling'
  tier:   'high'|'medium'|'low'
  reducedMotion: boolean
  audioEnabled: boolean   // default false
  mode: '3d'|'fallback'
}
```

Camera, HUD, panels and the region switch all derive from this. No component owns
navigation state locally.

---

## 7. Rendering and performance

Applying the loaded `premium-3d-website`, `threejs-*` and `web-performance-optimization`
guidance:

- `<Canvas dpr={[1, 1.75]} gl={{ antialias: false, powerPreference: 'high-performance' }}>`
  — antialiasing off because post-processing is active; FXAA-equivalent via the composer.
- **Post-processing: 2 passes maximum** — selective Bloom (half-resolution render target,
  `luminanceThreshold` tuned per region) + a combined Vignette/grain pass. Disabled
  entirely on `tier: 'low'`.
- **No real-time shadow maps.** The one shadow that matters (Saturn's, on its rings) is
  computed analytically inside the ring shader. Terminators are shader-side.
- **Instancing everywhere repeated:** starfield, nebula billboards, dust, ring particles,
  48 skill moons, orbit-path segments.
- **Shader discipline:** shared `noise.glsl.ts` (hash → value noise → fBm → domain warp)
  included by every planet shader; `mix`/`step`/`smoothstep` instead of branches;
  uniforms packed into vectors; octave count driven by a `uOctaves` tier uniform.
- **Lighting:** ≤3 lights active per region, scoped with light layers so a world's rim
  light cannot leak onto its neighbour.
- **Raycasting:** throttled to ~30 Hz, restricted to a dedicated `Hotspot` layer of
  invisible spheres sized ≥44 px in screen space (this is also the mobile touch-target
  mechanism).
- **Regions** are `React.lazy` + `Suspense`, so first paint ships only the hero.
- **Disposal:** every region unmount disposes its geometries, materials and render targets.

### Device tier probe
`WEBGL_debug_renderer_info` renderer string + `navigator.hardwareConcurrency` +
`deviceMemory` + a first-second frame-time sample → `high` / `medium` / `low`, driving
shader octaves, particle budgets, ring density, post-processing and `dpr`. A sustained
sub-40 fps reading downgrades the tier at runtime.

### Mobile — a distinct configuration, not a scale-down
Pulled-back camera framing per region; panels become bottom sheets rather than side
panels; hotspot radii enlarged; particle budgets halved; tap-to-orbit rather than
drag-inertia; the Milano sequence shortened; `min-h-[100dvh]` never `h-screen`.

---

## 8. Motion

Custom cubic-bezier curves only — no `linear`, no `ease-in-out`.

- `--ease-flight: cubic-bezier(0.32, 0.72, 0, 1)` — camera arrivals, panel entrances
- `--ease-instrument: cubic-bezier(0.22, 1, 0.36, 1)` — HUD, readouts
- Camera travel uses damped interpolation toward the target waypoint (position and
  look-at eased independently so the framing settles after the position does).
- Panels enter with a masked rise + blur resolve; telemetry values type in character by
  character; the payload (project name, links) never animates in — it must read instantly.
- Microinteractions: planet rotation, cloud advection, star drift, moon orbits, HUD
  reticle breathing, an occasional distant vessel crossing the frame, ring particles
  glinting. All subtle and all GPU-safe (`transform`/`opacity` only).
- `prefers-reduced-motion: reduce` freezes orbital and drift animation, replaces camera
  flights with short cross-fades, and stops all looping effects.

---

## 9. Accessibility (WCAG 2.2 AA)

- Semantic HTML throughout; `<html lang="en">`.
- Every interactive 3D object has a corresponding real `<button>` in the HUD or manifest,
  so nothing is reachable only by clicking a mesh.
- Full keyboard model: `Tab` through HUD → manifest → panel → links; `↑/↓` to move
  between worlds; `Enter` to approach; `Esc` to pull back one level.
- `focus-visible` ring in `--signal` at 2px with 2px offset on every focusable element.
- Touch targets ≥44×44 px (`min-h-11 min-w-11`).
- Text contrast verified ≥4.5:1 for body and ≥3:1 for large text and UI graphics against
  its actual panel ground, for both `panelMode` variants.
- Form inputs have visible labels; errors associated via `aria-describedby`;
  `aria-live="polite"` on the transmitter status.
- Canvas is `aria-hidden="true"` — it is presentation; the spine carries the meaning.
- Region changes announced via a polite live region.
- No information conveyed by colour alone.

## 10. SEO

`<title>`, meta description, canonical, Open Graph and Twitter card tags, JSON-LD
`Person` schema (name, job titles, `alumniOf`, `sameAs` socials, `knowsAbout` skills),
`theme-color`, and a `Person`-scoped semantic spine that crawlers read as normal HTML.

## 11. Sound

WebAudio-synthesised only — no audio files. A low filtered-noise drone plus short blips
on approach and panel open. **Default muted**, persistent toggle in the HUD, state saved
to `localStorage`, auto-disabled under `prefers-reduced-motion`. The site is fully
functional silent.

---

## 12. Build, deps, deployment

**Add:** `three`, `@react-three/fiber`, `@react-three/drei`,
`@react-three/postprocessing`, `postprocessing`, `zustand`, `tailwindcss`,
`@tailwindcss/vite`, `typescript` (currently missing — nothing type-checks today).

**Remove:** all 26 `@radix-ui/*`, `recharts`, `embla-carousel-react`, `cmdk`, `vaul`,
`sonner`, `input-otp`, `react-day-picker`, `react-hook-form`, `react-resizable-panels`,
`next-themes`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`,
`gh-pages`. Delete `src/components/ui/` (46 files), `src/index.css` (1857 lines),
`src/styles/rose-pine.css`, `src/styles/globals.css`, all old section components, the
`vite.config.ts` versioned-alias block, and the stale `build/` and root `assets/` folders.

**Keep:** `motion` (2D overlay animation), `react`, `react-dom`.

**Vercel:**
- `build.outDir` → `dist`
- `vercel.json`: SPA rewrite + `Cache-Control: public, max-age=31536000, immutable` on
  `/assets/*`
- `.gitignore` gains `dist`, `.vercel`
- `docs/` is emptied of the old GH Pages build (this repo path now holds only this spec
  and the implementation plan). **The existing GitHub Pages site goes offline as a result;
  this is intended, given the move to Vercel.**

**Scripts:** `dev`, `build`, `preview`, `typecheck` (`tsc --noEmit`).

---

## 13. Verification

1. `npm run typecheck` — zero errors (`strict: true`).
2. `npm run build` — clean, and report the gzipped bundle budget.
3. Playwright pass (per `webapp-testing`): zero console errors; loading screen resolves;
   `ENTER THE UNIVERSE` works; all 7 project worlds open and show correct content; all 7
   skill bands and a sample of moons respond; the Milano is findable, enters and exits;
   HUD navigation reaches every region; every external link resolves to the URL in
   `data/`.
4. Keyboard-only traversal of the entire experience.
5. `prefers-reduced-motion` and forced-no-WebGL both render the complete fallback.
6. Mobile viewport (375×812) — content readable, targets tappable, Milano works.
7. Frame-time sampling per region on `high` and `low` tiers.
8. Contrast audit of both `panelMode` variants against their real grounds.

## 14. Definition of done

All 7 project worlds, Saturn with 7 bands and 48 skill moons, HD 189733 b, Stephenson
2-18, the Milano and its interior, HUD navigation, loading screen, mobile configuration,
WebGL/reduced-motion fallback, SEO metadata and the accessibility spine are implemented,
type-check clean, build clean, and verified by the checks in §13.

It is done when the answer to *"does this feel like a real interactive universe that
happens to be a portfolio?"* is yes — and not "a normal portfolio with planets added".
