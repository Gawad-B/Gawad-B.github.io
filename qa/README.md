# QA suites

Unit-level checks run without a browser:

```bash
npm test          # data integrity (37 assertions) + journey state machine
npm run typecheck # tsc --noEmit, strict
```

Browser suites need the dev server running (`npm run dev`) and the Python
venv created by:

```bash
python3 -m venv .venv-qa
.venv-qa/bin/pip install playwright
.venv-qa/bin/python -m playwright install chromium
```

The suites prefer a system Chromium when one is installed (see `_launch.py`
below); the `playwright install` step is only needed on machines without one.

## Two pages, two URLs

| URL | What | Suites |
|---|---|---|
| `/` | professional view (React, no WebGL) | `qa/pro.py` |
| `/universe/` | the 3D universe | every other suite |

`qa/_launch.py` is shared by all suites (they run as `python qa/<name>.py`, so
`from _launch import ...` resolves). It exports `BASE`, `PRO_URL` (`BASE + "/"`),
`UNIVERSE_URL` (`BASE + "/universe/"`) and `launch(p, **kwargs)`, which starts
headless Chromium with the SwiftShader WebGL flags. Environment variables:

- `QA_BASE` — server origin, default `http://localhost:3000`. Point it at a
  production preview to test the built site.
- `QA_CHROMIUM` — path to the Chromium binary. Default: `/usr/bin/chromium-browser`
  when that file exists, otherwise Playwright's own browser.

Then:

```bash
.venv-qa/bin/python qa/pro.py        # professional view: structure, nav, hero, intro, reveals, links, no-3D, layout, a11y
.venv-qa/bin/python qa/fallback.py   # universe: no-WebGL path renders the whole portfolio
.venv-qa/bin/python qa/skills.py     # Saturn: hover, select, panel, band isolation
.venv-qa/bin/python qa/projects.py   # all 7 worlds vs. the data, incl. panel contrast mode
.venv-qa/bin/python qa/milano.py     # discovery → entry → channels → transmit → exit
.venv-qa/bin/python qa/a11y.py       # semantics, keyboard, focus, targets, WCAG AA contrast
.venv-qa/bin/python qa/mobile.py     # 375x812 matrix, reduced motion, frame sampling
.venv-qa/bin/python qa/perf.py       # scene complexity vs. budget, tier scaling
.venv-qa/bin/python qa/shot.py URL OUT [W H WAIT WAIT_FOR CLICK...]
```

`qa/pro.py` skips one check on the dev server: with JavaScript disabled the dev
page is an empty `#root`. Against a production build (`npm run build`, then serve
`dist/` and set `QA_BASE`) also open `/` in a context created with
`java_script_enabled=False` and confirm the prerendered page shows the name,
all five sections and no hidden `.pv-rv` content.

## On performance numbers

`qa/mobile.py` prints frame times, but the only renderer available in a
headless container is SwiftShader — a software rasteriser running at a few
frames per second. **Those numbers are not indicative of hardware.**

`qa/perf.py` is the meaningful one: it asserts draw calls, triangle counts,
shader programs and render-target allocation, which are hardware-independent
and are what actually predicts whether a scene holds frame rate. Measured
peaks on the high tier are ~67 draw calls and ~136k triangles, with zero
image textures anywhere in the build.

## Regenerating the document head

`index.html`, `universe/index.html`, `sitemap.xml` and `robots.txt` are generated
from `src/data` and `src/pro/content.ts` — meta tags, JSON-LD, the share-card
tags, and (professional page only) the inline intro cover and its boot snippet:

```bash
bash qa/build-head.sh
```

Change `SITE` in `qa/gen-head.ts` first if the deploy domain changes — it
feeds the canonical link, Open Graph, Twitter card and sitemap.

## Regenerating the pictures

The share cards are plain HTML rendered at 1200x630:

```bash
chromium --headless=new --hide-scrollbars --window-size=1200,630 \
  --virtual-time-budget=9000 --screenshot=public/og.png     "file://$PWD/qa/og-card.html"
chromium --headless=new --hide-scrollbars --window-size=1200,630 \
  --virtual-time-budget=9000 --screenshot=public/og-pro.png "file://$PWD/qa/og-pro.html"
```

`.github/preview.png` is the universe's system map at 1440x900 (enter, press
Esc, let the labels settle); `public/assets/pro/universe-thumb.webp` is the same
capture at 960x600. `.github/preview-pro.jpg` is the professional view's hero.
Re-capture them when project order, labels or the hero change.
