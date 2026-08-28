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

Then:

```bash
.venv-qa/bin/python qa/fallback.py   # no-WebGL path renders the whole portfolio
.venv-qa/bin/python qa/skills.py     # Saturn: hover, select, panel, band isolation
.venv-qa/bin/python qa/projects.py   # all 7 worlds vs. the data, incl. panel contrast mode
.venv-qa/bin/python qa/milano.py     # discovery → entry → channels → transmit → exit
.venv-qa/bin/python qa/a11y.py       # semantics, keyboard, focus, targets, WCAG AA contrast
.venv-qa/bin/python qa/mobile.py     # 375x812 matrix, reduced motion, frame sampling
.venv-qa/bin/python qa/perf.py       # scene complexity vs. budget, tier scaling
.venv-qa/bin/python qa/shot.py URL OUT [W H WAIT WAIT_FOR CLICK...]
```

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

`index.html`, `sitemap.xml` and `robots.txt` are generated from `src/data`:

```bash
bash qa/build-head.sh
```

Change `SITE` in `qa/gen-head.ts` first if the deploy domain changes — it
feeds the canonical link, Open Graph, Twitter card and sitemap.
