# Abdelrahman Gawad — Portfolio

**Live: [gawad-b.github.io](https://gawad-b.github.io)**

One portfolio, two views that link to each other:

- **Professional view** — [`/`](https://gawad-b.github.io), the default. A single fast page for recruiters: featured projects, experience, skills, and contact. Plain React, prerendered to static HTML at build time, no three.js; about 60 KB of gzipped JavaScript.
- **Universe** — [`/universe/`](https://gawad-b.github.io/universe/). An interactive 3D portfolio where the space scene *is* the navigation: one star system in which every body is real content. The About page is a planet, 49 skills orbit Saturn as labeled moons, six projects form an exoplanet belt, and Contact means docking with a ship parked at a station on the system's edge. Scrolling flies the camera between them.

![The professional view](.github/preview-pro.jpg)

![The universe's system map](.github/preview.png)

## Technology & Why

| Technology | Where it's used | Why it was chosen |
|---|---|---|
| **TypeScript** (strict) | Everything in `src/` | The scene, camera, and UI share one state machine — strict types catch cross-layer mistakes at compile time. |
| **React 18 + Vite 6** | The professional view (`src/pro/`); the universe's app shell, HUD, and overlays (`src/App.tsx`, `src/ui/`) | Declarative UI for the page and over the canvas; Vite gives instant HMR in dev and a small static bundle out. |
| **Static prerender** (`react-dom/server`) | `scripts/prerender.mjs`, `src/pro/entry-server.tsx` | The professional view's content is in the HTML before any script runs — fast first paint, readable by crawlers and with JavaScript off. |
| **Plain CSS + custom properties** | Professional view tokens and styles (`src/pro/styles/`, `src/pro/components/*.css`) | One small token file (colour, type scale, motion) and no utility framework on the page recruiters load. |
| **three.js** | The universe itself (`src/scene/`) | The standard for WebGL — sun, planets, rings, moons, station, and ship are all three.js scene graph. |
| **React Three Fiber + drei** | Scene components (`src/scene/*.tsx`), the cockpit monitor (`src/regions/MilanoInterior.tsx`) | Lets 3D objects be React components sharing state with the UI; drei's `<Html transform>` projects the real DOM contact form onto the cockpit screen. |
| **Custom GLSL shaders** | `src/scene/shaders/` — star granulation, planet surfaces (fBm/ridged noise), atmospheres, rings with analytic shadow | The universe ships **zero texture or model files**: every surface is computed on the GPU, so the whole experience downloads in ~300 KB. |
| **@react-three/postprocessing** | Bloom + vignette (`src/scene/Universe.tsx`) | The cinematic glow on emissives (star, beacons, station windows), tiered down or off on weaker GPUs. |
| **Zustand** | State stores (`src/store/`) — journey/camera, hover, boot progress | Subscription-based state that updates 60×/second without re-rendering the React tree. |
| **Tailwind CSS v4** | The universe's design tokens and instrument-panel UI (`src/styles/`, `src/ui/*.css`) | One `@theme` token source (palette, spacing, z-layers) shared by every HUD panel. |
| **Playwright** (Python) | 16 browser suites + 2 unit suites in `qa/` | Tests the real rendered site: the professional page, all 49 moons, all 6 worlds, boarding, keyboard, a11y, mobile, and draw-call budgets. |
| **Web3Forms** | Contact transmitter in the universe (`src/ui/MonitorScreen.tsx`) | The form posts from the browser — no backend to host or maintain. |
| **GitHub Actions → GitHub Pages** | `.github/workflows/deploy.yml` | Fully static site, so Pages hosts it free at the original URL; every push to `main` typechecks, builds, and deploys. |

## How it's put together

- **Two entry points, one build** — a Vite multi-page build: `index.html` loads the professional view (`src/pro/`), `universe/index.html` loads the 3D scene (`src/`). After `vite build`, `scripts/prerender.mjs` renders the professional view to HTML; the browser then hydrates it. Its copy lives in `src/pro/content.ts`.
- **Motion without a library** — on the professional view, five columns cover the page on entry and open onto the hero; headings, rows, and chips blur in as they scroll into view and reverse when they drop back below it; numbers count up; the hero replays its entrance when you return to it. All of it is CSS driven by `IntersectionObserver`, switched off under `prefers-reduced-motion`, and a failsafe shows every section if the script never runs.
- **Generated `<head>`** — `qa/build-head.sh` writes both pages' meta tags, JSON-LD, and share-card tags from the same data, so titles and structured data cannot drift from the page.
- **One always-mounted heliocentric scene** — in the universe, regions are camera stops, not pages; every shader compiles once, under the loading screen.
- **Data-driven** — projects, skills, worlds, and the ship's dialogue live in `src/data/`; the scene and the accessible DOM are both generated from it.
- **Quality tiers** — a GPU probe plus a runtime frame-time governor scale octaves, particles, and post-processing from `high` down to `low`.
- **Accessible spine** — a complete semantic DOM mirrors the 3D content for screen readers, crawlers, and the no-WebGL fallback; WCAG 2.2 AA contrast and full keyboard navigation throughout.

## Run it

```bash
npm ci
npm run dev        # http://localhost:3000 (professional view), /universe/ for the 3D scene
```

```bash
npm run build && npm run preview   # production build at :4173
npm test                           # data + state-machine checks
```

The browser suites in `qa/` need Python + Playwright (`pip install playwright && playwright install chromium`), then `python qa/<suite>.py` against a running dev server. `qa/pro.py` covers the professional view; the others cover the universe. Set `QA_BASE` if the server is not on port 3000 — see `qa/README.md`.

## Deploy

Push to `main`. The workflow typechecks, builds, and publishes to GitHub Pages — live in about a minute.
