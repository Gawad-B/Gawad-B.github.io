# Portfolio Universe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `Gawad-B.github.io` from scratch as an immersive 3D deep-space portfolio where the universe is the navigation system, deployed to Vercel.

**Architecture:** One persistent R3F `<Canvas>` with a never-unmounting sky and a continuous camera rig; region scene-graphs lazy-mount as the traveller moves. All content lives in `src/data/*.ts` and renders once through a semantic `ContentSpine` that serves triple duty — screen-reader layer, SEO payload, and the no-WebGL fallback. All planet surfaces are procedural GLSL; zero texture or model files.

**Tech Stack:** Vite 6 · React 18 · TypeScript (strict) · three · @react-three/fiber · @react-three/drei · @react-three/postprocessing · zustand · Tailwind CSS v4 · motion · Playwright (verification)

**Spec:** `docs/superpowers/specs/2026-08-28-portfolio-universe-design.md`

## Global Constraints

- **No fabricated content.** Every project, skill, link and bio sentence traces to `src/components/*.tsx` at commit `b35eae0`. 7 projects, 7 skill groups, 48 skills. Copy is preserved in meaning; only "This Portfolio" is rewritten (it now describes the universe).
- **No asset files.** No `.glb`, `.gltf`, texture images, or audio files. Procedural GLSL and constructed geometry only. Sound is WebAudio-synthesised.
- **No copyrighted assets.** The Milano is an original procedurally-modelled craft; the name is an in-fiction homage reference only. No third-party model, no quoted film dialogue.
- **Palette is fixed** (spec §4.1). Chrome is monochrome void/instrument greys plus exactly three signals: `--signal #FFB35C`, `--data #7FD4E8`, `--alert #FF5F57`. All other colour comes from `worlds.ts` accents.
- **Fonts:** DM Sans 300, JetBrains Mono, Cormorant Garamond — already loaded, no new font requests.
- **Render budget:** `dpr={[1,1.75]}`, `antialias:false`, **max 2 post passes**, no real-time shadow maps, instancing for every repeated mesh, ≤3 lights per region, raycasts throttled to 30 Hz on a dedicated hotspot layer.
- **Motion:** custom cubic-beziers only (`--ease-flight cubic-bezier(0.32,0.72,0,1)`, `--ease-instrument cubic-bezier(0.22,1,0.36,1)`). Animate only `transform`/`opacity`. Never animate the payload (project names, links) into view.
- **A11y floor:** WCAG 2.2 AA. Touch targets ≥44×44px. `focus-visible` ring 2px `--signal` + 2px offset. Canvas is `aria-hidden`. Every clickable mesh has a real `<button>` equivalent. Nothing exists only in 3D.
- **Build:** `outDir: 'dist'`, `tsc --noEmit` clean under `strict: true`, Vercel.

---

### Task 1: Clean slate, dependencies, config, design tokens

**Files:**
- Delete: `src/components/ui/` (46 files), `src/components/{About,Contact,CursorTrail,Hero,Nav,ParticleField,Projects,Skills}.tsx`, `src/index.css`, `src/styles/rose-pine.css`, `src/styles/globals.css`, `src/guidelines/`, `src/Attributions.md`, `build/`, `assets/`, `docs/assets/`, `docs/index.html`, `docs/favicon.svg`
- Modify: `package.json`, `vite.config.ts`, `index.html`, `.gitignore`
- Create: `tsconfig.json`, `tsconfig.node.json`, `vercel.json`, `src/styles/tokens.css`, `src/styles/index.css`

**Interfaces:**
- Consumes: nothing
- Produces: `npm run dev|build|preview|typecheck`; CSS custom properties from spec §4.1 available globally; Tailwind v4 with `@theme` bridging tokens to utilities (`bg-void-0`, `text-instr-70`, `text-signal`, …); `@` → `src` alias.

- [ ] **Step 1:** Delete the dead UI layer and stale build artifacts (list above). Keep `public/assets/*` and `public/favicon.svg`.
- [ ] **Step 2:** Rewrite `package.json` — remove all 26 `@radix-ui/*`, `recharts`, `embla-carousel-react`, `cmdk`, `vaul`, `sonner`, `input-otp`, `react-day-picker`, `react-hook-form`, `react-resizable-panels`, `next-themes`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `gh-pages`. Add `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `postprocessing`, `zustand`, and dev deps `typescript`, `tailwindcss`, `@tailwindcss/vite`, `@types/three`. Keep `react`, `react-dom`, `motion`. Scripts: `dev`, `build`, `preview`, `typecheck: tsc --noEmit`.
- [ ] **Step 3:** `npm install` and confirm it resolves clean.
- [ ] **Step 4:** Create `tsconfig.json` with `strict: true`, `noUnusedLocals`, `noUncheckedIndexedAccess`, `jsx: react-jsx`, `moduleResolution: bundler`, path alias `@/* → src/*`.
- [ ] **Step 5:** Rewrite `vite.config.ts` — drop the entire versioned-alias block, keep only `@ → src`; add `@tailwindcss/vite`; `build.outDir = 'dist'`, `build.target = 'esnext'`, `sourcemap: false`; manual chunk splitting `three` into its own vendor chunk.
- [ ] **Step 6:** Write `src/styles/tokens.css` — the palette, type scale, easing curves, and z-index layer scale from spec §4 and §8, as `:root` custom properties.
- [ ] **Step 7:** Write `src/styles/index.css` — `@import "tailwindcss"`, an `@theme` block mapping tokens to Tailwind colour names, then an `@layer components` block with `.bezel` (outer machined shell), `.bezel-screen` (inner screen), `.eyebrow`, `.readout`, `.scanlines`, `.hairline`, and a global `@media (prefers-reduced-motion: reduce)` damper.
- [ ] **Step 8:** Create `vercel.json` — SPA rewrite `{"source":"/(.*)","destination":"/"}` and `Cache-Control: public, max-age=31536000, immutable` on `/assets/(.*)`.
- [ ] **Step 9:** Add `dist` and `.vercel` to `.gitignore`.
- [ ] **Step 10:** Verify `npm run typecheck` and `npm run build` both succeed against a stub `App.tsx`. Commit: `chore: strip legacy UI layer, add 3D toolchain and design tokens`.

---

### Task 2: Data layer

**Files:**
- Create: `src/data/personal.ts`, `src/data/skills.ts`, `src/data/projects.ts`, `src/data/worlds.ts`, `src/data/milano.ts`, `src/data/index.ts`
- Test: `src/data/data.test.ts` (run via `tsx`/`node --test`, or a plain assertion script invoked by `npm run typecheck` — no test runner dependency is added)

**Interfaces:**
- Produces:
  - `PERSONAL: { name, roles: string[], location, institution, intro, bio: string[], quote, contact: { email, phone, github, linkedin, formKey } }`
  - `SKILL_GROUPS: SkillGroup[]` where `SkillGroup = { id, label, accent, bandRadius: number, skills: Skill[] }`, `Skill = { id, name, group }`
  - `PROJECTS: Project[]` where `Project = { id, index: number, name, kind, description, tech: string[], links: { label, href, kind: 'repo'|'demo' }[], private: boolean, screenshot?: string }`
  - `WORLDS: Record<WorldId, World>` where `World = { id, displayName, designation, project?: string, accent: string, panelMode: 'light'|'dark', facts: string[], shader: PlanetShaderParams }`
  - `PlanetShaderParams = { baseColor, hotColor, coolColor, atmosphereColor, atmosphereDensity, roughness, emission, bandStrength, warpStrength, octaves, cloudSpeed, terminatorSharpness, ringed: boolean, tail: boolean, glowStrength }`
  - `MILANO_QUIPS: string[]`, `MILANO_CITATION: { title, lines: string[] }`

- [ ] **Step 1:** Write `personal.ts` with the §3 identity block. Bio paragraphs copied from `About.tsx` verbatim. Roles copied from `Hero.tsx` `TAGLINES`.
- [ ] **Step 2:** Write `skills.ts` — the 7 groups and 48 skills exactly as inventoried in spec §3, each group given an `accent` from the monochrome-plus-signal set and a `bandRadius` (ascending, 7 distinct radii outside Saturn's ring system).
- [ ] **Step 3:** Write `projects.ts` — the 7 projects with descriptions verbatim from `Projects.tsx`, except `this-portfolio`, whose description is rewritten to describe the universe. Encode `private: true` for Labora and Quizzy.
- [ ] **Step 4:** Write `worlds.ts` — 10 entries: `stephenson-2-18`, `hd-189733-b`, `saturn`, the 7 project worlds mapped per spec §5, plus `wasp-193-b` and `psr-b1257-12-b` marked `unused: true`. Each carries 3–4 factual `facts` strings and tuned `shader` params that make it visually distinct.
- [ ] **Step 5:** Write `milano.ts` — 8–10 original quips and the citation text. Keep them short and professional-funny; no film dialogue.
- [ ] **Step 6:** Write `data.test.ts` asserting: 48 skills total; 7 groups; group counts `[10,6,5,6,7,7,7]`; 7 projects; every project `id` has a matching `World.project`; every world `accent` is a valid 6-digit hex; `bandRadius` values are unique and ascending; every `links[].href` starts with `https://`; no two worlds share a `designation`.
- [ ] **Step 7:** Run the test, confirm it passes. Commit: `feat(data): add personal, skills, projects, worlds and milano data`.

---

### Task 3: Content spine and fallback site

**Files:**
- Create: `src/content/ContentSpine.tsx`, `src/content/FallbackSite.tsx`, `src/content/useCapabilities.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: all of `src/data`
- Produces: `<ContentSpine visible={boolean} />`; `useCapabilities(): { webgl: boolean, reducedMotion: boolean, tier: 'high'|'medium'|'low', touch: boolean }`

- [ ] **Step 1:** Write `useCapabilities.ts` — probe WebGL2 then WebGL1 via a throwaway canvas (and `webglcontextlost` listener); read `matchMedia('(prefers-reduced-motion: reduce)')` reactively; derive `tier` from `WEBGL_debug_renderer_info` renderer string (flag Mali/Adreno 5xx/PowerVR as low), `navigator.hardwareConcurrency`, and `(navigator as any).deviceMemory`.
- [ ] **Step 2:** Write `ContentSpine.tsx` — one `<main>` containing: `<h1>` name, roles list, intro; `<section id="about">` with the 4 bio paragraphs, quote, location/institution; `<section id="skills">` with an `<h3>` per group and a `<ul>` of skills; `<section id="projects">` with an `<article>` per project (name, kind, description, tech `<ul>`, real `<a>` links, or a "repository private" note); `<section id="contact">` with `mailto:`, `tel:`, GitHub and LinkedIn anchors. When `visible={false}`, wrap in a `.spine-clipped` class (1px clip, not `display:none`, so it stays focusable and crawlable).
- [ ] **Step 3:** Write `FallbackSite.tsx` — renders `<ContentSpine visible />` inside a styled deep-space document shell: void gradient ground, CSS-only starfield (box-shadow dots on a fixed layer), bezel panels per section, project screenshots from `public/assets/`, and a banner explaining that the 3D universe needs WebGL, with a "try anyway" button when WebGL is present but reduced-motion is set.
- [ ] **Step 4:** Wire `App.tsx` to render `FallbackSite` when `!webgl`, and otherwise the Universe with a clipped spine.
- [ ] **Step 5:** Verify with Playwright: launch with `--disable-gpu` / a stubbed `getContext` returning null, screenshot the fallback, and assert the page text contains every project name and all 48 skill names. Commit: `feat(content): add semantic content spine and WebGL fallback site`.

---

### Task 4: Journey store and quality budgets

**Files:**
- Create: `src/store/journey.ts`, `src/scene/quality.ts`
- Test: `src/store/journey.test.ts`

**Interfaces:**
- Produces:
  - `useJourney` zustand store with state per spec §6.4 and actions `travelTo(region)`, `focus(kind,id)`, `clearFocus()`, `enterMilano()`, `exitMilano()`, `setTier(t)`, `toggleAudio()`, `beginTravel()`, `endTravel()`
  - `QUALITY: Record<Tier, { dpr:[number,number], octaves:number, stars:number, dust:number, ringParticles:number, post:boolean, moonSegments:number, planetSegments:number }>`
  - `useAutoTier()` — samples frame time and downgrades after a sustained sub-40fps window

- [ ] **Step 1:** Write `quality.ts` with the three budget tiers (high/medium/low), halving particle counts and dropping post-processing at `low`.
- [ ] **Step 2:** Write `journey.ts` with the store, plus a `REGION_ORDER` array used for keyboard next/previous traversal.
- [ ] **Step 3:** Write `journey.test.ts` asserting: `travelTo` sets `phase:'traveling'` then `endTravel` returns to `'idle'`; `focus` on a project sets both `focus` and `region:'projects'`; `enterMilano` from any region sets `region:'milano-interior'`; `exitMilano` returns to `'skills'` (where the ship is parked); `clearFocus` preserves region.
- [ ] **Step 4:** Run the test, confirm pass. Commit: `feat(store): add journey state machine and device quality budgets`.

---

### Task 5: Shader library

**Files:**
- Create: `src/scene/shaders/noise.glsl.ts`, `planet.glsl.ts`, `star.glsl.ts`, `rings.glsl.ts`, `nebula.glsl.ts`, `atmosphere.glsl.ts`

**Interfaces:**
- Produces: exported GLSL string chunks — `NOISE_CHUNK` (hash → value noise → fBm → domain warp, octave count driven by `uOctaves`), and `{vertex, fragment}` pairs for each of planet / star / rings / nebula / atmosphere, plus `PLANET_UNIFORMS(params: PlanetShaderParams)` returning a Three.js uniforms object.

- [ ] **Step 1:** Write `noise.glsl.ts` — a shared chunk with `hash33`, `vnoise3`, `fbm(p, octaves)` using a `for` loop bounded by a `const int MAX_OCTAVES` with `if (i >= uOctaves) break;`, and `domainWarp`. No other file duplicates noise code.
- [ ] **Step 2:** Write `planet.glsl.ts` — one parameterised fragment shader covering every project world: fBm-banded base mixed between `uCoolColor`/`uHotColor` by a day/night term, `uBandStrength` for zonal banding, `uWarpStrength` for turbulence, `uTerminatorSharpness` for the day/night edge, `smoothstep` Fresnel rim in `uAtmosphereColor`, advecting cloud layer at `uCloudSpeed`, and `uEmission` self-glow for the hot worlds. Branch-free: use `mix`/`step`/`smoothstep` throughout.
- [ ] **Step 3:** Write `star.glsl.ts` — Stephenson 2-18: domain-warped granulation cells, limb darkening (`pow(dot(N,V), 0.6)`), a chromosphere rim, and slow surface churn.
- [ ] **Step 4:** Write `rings.glsl.ts` — radial optical-depth ramp encoding real A/B/C ring densities with a hard **Cassini Division gap**, per-particle glint from radial hash, and an analytic planet-shadow term (project the fragment's radial position against the light vector) so no shadow map is needed.
- [ ] **Step 5:** Write `nebula.glsl.ts` — low-frequency fBm alpha over the three emission colours at 6–10% opacity, additive, on camera-facing billboards.
- [ ] **Step 6:** Write `atmosphere.glsl.ts` — back-face-rendered Fresnel shell for the atmospheric glow.
- [ ] **Step 7:** Verify: temporarily render one sphere per world in a scratch route, screenshot, and confirm all 7 read as visually distinct. Commit: `feat(shaders): add procedural noise, planet, star, ring, nebula and atmosphere shaders`.

---

### Task 6: Canvas, persistent sky, camera rig

**Files:**
- Create: `src/scene/Universe.tsx`, `src/scene/Sky.tsx`, `src/scene/CameraRig.tsx`, `src/scene/Planet.tsx`, `src/scene/Atmosphere.tsx`, `src/scene/OrbitPath.tsx`, `src/scene/Hotspot.tsx`

**Interfaces:**
- Consumes: `useJourney`, `QUALITY`, all shader chunks
- Produces:
  - `<Universe />` — the single `<Canvas>` with composer and lazy region switch
  - `<Sky />` — instanced starfield + nebula billboards + drifting dust, never unmounts
  - `<CameraRig />` — reads `useJourney` and eases position and look-at independently toward the active waypoint; exposes `WAYPOINTS: Record<Region|FocusKey, {position, target, fov}>`
  - `<Planet world={World} radius={number} …>`, `<Atmosphere color density radius>`, `<OrbitPath radius inclination>`, `<Hotspot onSelect label radius>` (invisible ≥44px-screen-space raycast sphere)

- [ ] **Step 1:** Write `Universe.tsx` — `<Canvas dpr={QUALITY[tier].dpr} gl={{antialias:false, powerPreference:'high-performance'}} aria-hidden="true">`, an `<EffectComposer disableNormalPass>` holding exactly **Bloom (half-res) + Vignette**, gated off entirely when `!QUALITY[tier].post`. Regions are `React.lazy` inside `<Suspense>`.
- [ ] **Step 2:** Write `Sky.tsx` — starfield as one `THREE.Points` with per-star colour drawn from a real stellar-class distribution (blue-white through amber), nebula billboards, and a slow dust drift. Counts from `QUALITY`.
- [ ] **Step 3:** Write `CameraRig.tsx` — damped interpolation with `--ease-flight` characteristics; look-at settles after position (different damping constants); a `warp` mode that briefly raises fov and stretches the starfield for long jumps; honours `reducedMotion` by snapping with a cross-fade instead.
- [ ] **Step 4:** Write `Planet.tsx` — sphere with segment count from `QUALITY`, `ShaderMaterial` from `PLANET_UNIFORMS(world.shader)`, `uTime` advanced in `useFrame`, optional ring child and optional stripped-tail child driven by `world.shader.ringed`/`.tail`, and disposal on unmount.
- [ ] **Step 5:** Write `Hotspot.tsx` — invisible sphere on a dedicated layer whose radius is recomputed each frame from camera distance so its projected size stays ≥44px; `onPointerOver`/`onClick` throttled to 30Hz.
- [ ] **Step 6:** Write `Atmosphere.tsx` and `OrbitPath.tsx` (instanced arc segments, additive, very low opacity).
- [ ] **Step 7:** Verify: render `Sky` + one `Planet` and confirm 60fps on high tier and no console errors. Commit: `feat(scene): add canvas, persistent sky, camera rig and shared 3D primitives`.

---

### Task 7: Loading screen

**Files:**
- Create: `src/ui/LoadingScreen.tsx`

**Interfaces:**
- Consumes: drei `useProgress`
- Produces: `<LoadingScreen onDone={() => void} />`

- [ ] **Step 1:** Build the sequence driven by **real** `useProgress` values — a point of light igniting and growing into a star as progress climbs, with mono status lines keyed to progress thresholds: `INITIALIZING SYSTEM…` → `CALIBRATING ORBITS…` → `LOADING WORLDS…` → `CONTACTING MILANO…` → `WELCOME, TRAVELER.`
- [ ] **Step 2:** No artificial delay: when progress hits 100 the final line shows and it fades out. Add a real progress percentage readout and an `aria-live="polite"` region announcing the current phase.
- [ ] **Step 3:** Verify with Playwright that the screen appears and is gone within 1s of `networkidle`. Commit: `feat(ui): add cinematic real-progress loading screen`.

---

### Task 8: Panel component and HUD shell

**Files:**
- Create: `src/ui/Panel.tsx`, `src/ui/HUD.tsx`, `src/ui/NavManifest.tsx`, `src/ui/AudioToggle.tsx`, `src/ui/useKeyboardNav.ts`, `src/audio/ambience.ts`

**Interfaces:**
- Produces:
  - `<Panel mode={'light'|'dark'} accent={string} eyebrow title onClose>` — double-bezel housing, corner brackets, scanline overlay; renders as a right-side panel ≥768px and a bottom sheet below
  - `<HUD />` — region readout, 5 nav buttons, breadcrumb, audio toggle, Milano proximity marker
  - `<NavManifest />` — spacecraft nav list; project mode lists `01 WASP-76 b · LABORA`, skills mode lists the 7 bands
  - `useKeyboardNav()` — `↑/↓` between worlds, `Enter` approach, `Esc` back out one level, `1–5` jump to region
  - `ambience.ts` — `startAmbience()/stopAmbience()/blip(kind)` using WebAudio oscillators + filtered noise, no files

- [ ] **Step 1:** Write `Panel.tsx` with both `panelMode` variants; the light variant uses `--instr-100` ground with `--void-1` text so near-black worlds stay legible. Verify both variants' contrast ≥4.5:1 for body text.
- [ ] **Step 2:** Write `HUD.tsx` — fixed, `backdrop-blur` (allowed: it is fixed), hairline bezels, mono labels, `--signal` for the active region. Every entry is a real `<button>` with `aria-current`.
- [ ] **Step 3:** Write `NavManifest.tsx` driven entirely by `PROJECTS`/`SKILL_GROUPS` so adding a project adds a row automatically.
- [ ] **Step 4:** Write `useKeyboardNav.ts` and mount it in `App`. Ensure it does not hijack keys while a form field has focus.
- [ ] **Step 5:** Write `ambience.ts` and `AudioToggle.tsx` — **default muted**, state in `localStorage`, force-off under `reducedMotion`.
- [ ] **Step 6:** Verify keyboard-only traversal of the HUD and manifest, and that focus rings are visible on every control. Commit: `feat(ui): add instrument panel, HUD, nav manifest, keyboard nav and synth ambience`.

---

### Task 9: Hero region — Stephenson 2-18

**Files:**
- Create: `src/regions/HeroRegion.tsx`, `src/ui/HeroOverlay.tsx`

**Interfaces:**
- Consumes: `star.glsl.ts`, `PERSONAL`, `WORLDS['stephenson-2-18']`, `CameraRig` waypoints
- Produces: `<HeroRegion />` mounted for `region==='hero'`

- [ ] **Step 1:** Build the star at a radius that fills ~70% of frame height, with two parallax dust-lane planes in front for scale, and a faint distant-cluster point field behind (Stephenson 2 is a cluster).
- [ ] **Step 2:** Build `HeroOverlay.tsx` — eyebrow `STEPHENSON 2-18 · SCUTUM · 2150 R☉`, `<h1>` name, the rotating role line (reusing the 4 roles), the one-line intro, and an `ENTER THE UNIVERSE` primary CTA using the button-in-button trailing-icon pattern. Role rotation freezes under reduced motion.
- [ ] **Step 3:** Wire the CTA to `travelTo('about')` with a warp transition.
- [ ] **Step 4:** Verify: screenshot at 1280×800 and 375×812; confirm the star reads as enormous and the text is legible over it. Commit: `feat(hero): add Stephenson 2-18 hero region`.

---

### Task 10: About region — HD 189733 b

**Files:**
- Create: `src/regions/AboutRegion.tsx`, `src/ui/AboutDossier.tsx`

- [ ] **Step 1:** Build the planet: cobalt base, advecting zonal wind bands, a second slightly-larger haze sphere, sideways glass-rain streaks aligned to the wind vector, blue Rayleigh limb. Framed right on desktop, top on mobile.
- [ ] **Step 2:** Build `AboutDossier.tsx` inside a `Panel` — profile photo in a bezel, the 4 bio paragraphs as real `<p>`s, a mono telemetry sidebar (`LOCATION`, `INSTITUTION`, `FOCUS`), and the Cormorant quote as the closing line. This is the only Cormorant use in the build.
- [ ] **Step 3:** Add 3–4 small orbiting HUD readouts around the planet showing `WORLDS['hd-189733-b'].facts` (7000 km/h winds, silicate haze, 63 ly). They must not overlap the dossier at any breakpoint.
- [ ] **Step 4:** Verify: screenshot both breakpoints; confirm no text overlaps the planet and contrast passes. Commit: `feat(about): add HD 189733 b about region with mission dossier`.

---

### Task 11: Skills region — Saturn, rings, 7 bands, 48 moons

**Files:**
- Create: `src/regions/SkillsRegion.tsx`, `src/scene/SaturnRings.tsx`, `src/scene/SkillMoons.tsx`, `src/ui/SkillPanel.tsx`

**Interfaces:**
- Consumes: `SKILL_GROUPS`, `rings.glsl.ts`, `planet.glsl.ts`, `Hotspot`
- Produces: `<SkillsRegion />`; `<SkillMoons group={SkillGroup} />` exposing hover/select callbacks into `useJourney`

- [ ] **Step 1:** Build Saturn — banded fBm body, correct oblateness (flatten Y by ~0.9), axial tilt 26.7°.
- [ ] **Step 2:** Build `SaturnRings.tsx` — an `InstancedMesh` particle field across the C/B/A radii with the **Cassini Division as a real gap**, density from `QUALITY.ringParticles`, and the analytic shadow term from `rings.glsl.ts`. Viewed near-edge-on at rest so the ring plane reads as a plane.
- [ ] **Step 3:** Build `SkillMoons.tsx` — one `InstancedMesh` for all 48 moons; per-moon orbital radius from its group's `bandRadius` with phase offset, angular velocity from Kepler's third law (`ω ∝ r^-1.5`) so inner bands visibly move faster, and slight inclination per band. A hovered or selected moon is promoted to a real mesh so it can take its own material.
- [ ] **Step 4:** Add per-moon `Hotspot`s and hover behaviour: the moon brightens and scales ~1.4×, an `OrbitPath` for its band lights up, and a mono label appears anchored to it.
- [ ] **Step 5:** On click — camera eases toward the moon while keeping Saturn framed behind; `SkillPanel.tsx` opens showing the skill name, its group, and the group's sibling skills as chips (real `<button>`s that switch selection).
- [ ] **Step 6:** Add the HUD band selector (7 real buttons) that isolates one group by dimming the other bands' moons.
- [ ] **Step 7:** Verify: click through all 7 bands and a sample of ~10 moons; confirm labels never collide, and frame time stays in budget with all 48 moons orbiting. Commit: `feat(skills): add Saturn with ring system and 48 orbiting skill moons`.

---

### Task 12: Projects region — the seven worlds

**Files:**
- Create: `src/regions/ProjectsRegion.tsx`, `src/ui/ProjectPanel.tsx`

- [ ] **Step 1:** Place the 7 worlds on a wide elliptical arc at varying inclinations and distances so the belt reads as depth rather than a row. Each gets a scoped point light plus a rim light on its own light layer.
- [ ] **Step 2:** Give each world its distinguishing extra: WASP-76 b iron-rain streaks on the nightside; 55 Cancri e magma-crack emission; TrES-2b near-total darkness with only an ember rim; KELT-9b a stripped comet-like tail; Kepler-16b **two light sources casting a doubled terminator**; K2-18b a thick hazy cloud deck; HD 110067 rendered as **six small worlds in a visible resonant chain** with arc paths rather than a single sphere.
- [ ] **Step 3:** Build `ProjectPanel.tsx` — reads `panelMode` from the world so WASP-76 b and TrES-2b get the light variant. Shows project name, kind, description, tech chips, the world's astronomical `facts` in a mono sidebar, and real `<a>` link buttons — or a `🔒 REPOSITORY PRIVATE` readout for Labora and Quizzy, with Labora's landing-page link still present.
- [ ] **Step 4:** Wire both the planet `Hotspot` and the `NavManifest` row to the same `focus('project', id)` action, so mouse, touch and keyboard all take the same path. Camera approaches; `Esc` or a close button pulls back to the belt.
- [ ] **Step 5:** Verify: open all 7 worlds; assert each panel's text matches `projects.ts` exactly; confirm every link resolves; screenshot all 7 to confirm they read as different worlds. Commit: `feat(projects): add seven-world exoplanet belt with mission panels`.

---

### Task 13: The Milano — exterior, entry sequence, interior console

**Files:**
- Create: `src/scene/Milano.tsx`, `src/regions/MilanoInterior.tsx`, `src/ui/ContactConsole.tsx`, `src/ui/MilanoTransition.tsx`
- Modify: `src/regions/SkillsRegion.tsx` (park the ship in the rings)

**Interfaces:**
- Consumes: `PERSONAL.contact`, `MILANO_QUIPS`, `MILANO_CITATION`
- Produces: `<Milano />` (exterior, parked), `<MilanoInterior />`, `<ContactConsole />`

- [ ] **Step 1:** Model the ship procedurally — original design: elongated fuselage (lathe/capsule), forward-swept wings, twin engine nacelles with emissive cores, a canopy, and chipped blue-and-orange plating via a shader stripe mask. No external model file.
- [ ] **Step 2:** Park it **inside Saturn's rings, in the Cassini Division**, slightly rolled as if badly parked, with ring particles drifting past it. Add the citation decal (`MILANO_CITATION`) on the canopy and a small blinking `--alert` HUD marker with `UNREGISTERED VESSEL` so it is discoverable but still a surprise.
- [ ] **Step 3:** Build `MilanoTransition.tsx` — the click sequence: camera accelerates toward the ship → hull plating fills and passes the lens → a brief white-out that doubles as the region swap → interior fades up. Under reduced motion, cross-fade instead.
- [ ] **Step 4:** Build `MilanoInterior.tsx` — cockpit interior geometry: two seats, a canopy showing Saturn's rings **still turning outside**, ceiling and panel lights, cabling, and a scattering of small details. Ambient interior lighting only; no shadow maps.
- [ ] **Step 5:** Build `ContactConsole.tsx` as the interior's focal screen — real `<a href="mailto:…">`, `<a href="tel:…">`, GitHub and LinkedIn links, plus the Web3Forms transmitter form (name/email/message, real labels, `aria-describedby` errors, `aria-live` status). Above it, a boot-log strip cycling `MILANO_QUIPS` on a slow timer.
- [ ] **Step 6:** Add an `EXIT VESSEL` control returning to the skills region, plus `Esc`.
- [ ] **Step 7:** Verify: find the Milano, click it, confirm the sequence plays, all 5 contact channels are present and correct, the form submits successfully against Web3Forms, and exit returns to Saturn. Commit: `feat(milano): add procedural ship, entry sequence and contact console interior`.

---

### Task 14: SEO, metadata, document head

**Files:**
- Modify: `index.html`
- Create: `public/robots.txt`, `public/sitemap.xml`, `public/og.svg`

- [ ] **Step 1:** Rewrite `index.html` head — `<title>Abdelrahman Gawad — Healthcare AI Engineer & Full-Stack Developer</title>`, meta description, canonical, `theme-color #04060B`, Open Graph (`og:title`, `og:description`, `og:type`, `og:image`, `og:url`) and `twitter:card summary_large_image`. Keep the existing three font links.
- [ ] **Step 2:** Add JSON-LD `Person` schema — name, `jobTitle` array from `PERSONAL.roles`, `alumniOf` E-JUST, `address` Alexandria EG, `sameAs` GitHub and LinkedIn, `knowsAbout` the 48 skills, `email`, `telephone`.
- [ ] **Step 3:** Add a `<noscript>` block with the core identity text so the page is never empty without JS.
- [ ] **Step 4:** Create `robots.txt`, `sitemap.xml`, and an `og.svg` social card drawn in the project's own palette and type.
- [ ] **Step 5:** Verify the rendered `<head>` and that the JSON-LD parses. Commit: `feat(seo): add metadata, Person schema, social card and crawler files`.

---

### Task 15: QA pass — build, types, Playwright, a11y, mobile, performance

**Files:**
- Create: `qa/smoke.py`, `qa/a11y.py`, `qa/perf.py`

- [ ] **Step 1:** `npm run typecheck` — fix every error to zero.
- [ ] **Step 2:** `npm run build` — fix every error and warning; record gzipped chunk sizes.
- [ ] **Step 3:** Write `qa/smoke.py` (Playwright, per `webapp-testing`): wait for `networkidle`; assert zero console errors; loading screen resolves; `ENTER THE UNIVERSE` transitions; open all 7 project worlds and assert their panel text against `projects.ts`; exercise all 7 skill bands and 10 moons; find, enter and exit the Milano; verify all 5 HUD regions; assert every external `href` matches `data/`.
- [ ] **Step 4:** Write `qa/a11y.py` — keyboard-only traversal reaching every interactive control; assert a visible focus indicator on each; assert the canvas is `aria-hidden`; assert the spine exposes all 48 skills and 7 projects to the accessibility tree; run an axe-core scan and fix all violations.
- [ ] **Step 5:** Write `qa/perf.py` — sample frame time per region on high and low tiers via CDP; assert no region drops below the budget; assert the low tier disables post-processing.
- [ ] **Step 6:** Run the mobile matrix at 375×812: every panel readable, every target ≥44px, the Milano sequence completes.
- [ ] **Step 7:** Force `prefers-reduced-motion` and no-WebGL; confirm both render complete content.
- [ ] **Step 8:** Fix everything found. Commit: `test: add smoke, accessibility and performance QA suites`.

---

### Task 16: Visual polish pass

- [ ] **Step 1:** Screenshot every region at 1280×800 and 375×812 and review as a set — check that the palette holds together, that no two worlds read alike, and that panel contrast is right in both `panelMode` variants.
- [ ] **Step 2:** Tune per-region bloom thresholds so hot worlds glow and TrES-2b stays genuinely dark.
- [ ] **Step 3:** Audit spacing rhythm and eyebrow/heading hierarchy across all panels for consistency.
- [ ] **Step 4:** Add the final microinteractions: HUD reticle breathing, occasional distant vessel crossing, ring-particle glints, panel-open blips.
- [ ] **Step 5:** Re-run `qa/smoke.py`. Commit: `polish: unify visual rhythm, tune bloom per region, add microinteractions`.

---

### Task 17: Deploy to Vercel

- [ ] **Step 1:** Confirm `dist/` builds clean and `npm run preview` serves the full experience.
- [ ] **Step 2:** Confirm `vercel.json` rewrite and cache headers are correct.
- [ ] **Step 3:** Hand off to the user for `vercel` CLI login and deploy (deployment is the user's action — it publishes outward).
- [ ] **Step 4:** Commit and push the branch.

---

## Self-Review

**Spec coverage:** §1–2 objectives → Tasks 3, 15, 16. §3 content → Task 2. §4 art direction → Tasks 1, 8. §5 world mapping → Tasks 5, 9, 10, 11, 12. §6 architecture → Tasks 3, 4, 6. §7 performance → Tasks 4, 6, 15. §8 motion → Tasks 1, 6, 8. §9 a11y → Tasks 3, 8, 15. §10 SEO → Task 14. §11 sound → Task 8. §12 build/deploy → Tasks 1, 17. §13 verification → Task 15. §14 done → Task 16. No gaps.

**Type consistency:** `World.panelMode` is consumed by `Panel` (Task 8) and `ProjectPanel` (Task 12) under the same name. `SkillGroup.bandRadius` is set in Task 2 and read in Task 11. `focus(kind,id)` has the same signature in Tasks 4, 11 and 12. `QUALITY[tier]` keys used in Task 6 all exist in Task 4.

**Known adaptation:** TDD-per-step applies to Tasks 2, 3 and 4 (data, spine, store — genuinely unit-testable). Shader and choreography work (Tasks 5, 6, 9–13) is gated by Playwright assertions and screenshot review in Task 15 instead, because GLSL output and camera feel are not meaningfully unit-testable. This is a deliberate deviation.
