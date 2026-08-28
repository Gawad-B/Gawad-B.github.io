PY
cat > qa/sheet.py <<'PY'
"""Capture region shots for the polish review. Reuses one page per batch."""
import sys, time
from playwright.sync_api import sync_playwright

BATCHES = {
  "a": [("hero", []),
        ("about", ["button:has-text('ABOUT')"]),
        ("skills", ["button:has-text('SKILLS')"]),
        ("skillpanel", [".mf-row:has-text('Machine Learning')"])],
  "b": [("projects", ["button:has-text('PROJECTS')"]),
        ("wasp76", [".mf-row:has-text('Labora')"]),
        ("cancri", ["button:has-text('PROJECTS')", ".mf-row:has-text('Quizzy')"])],
  "c": [("kelt9", ["button:has-text('PROJECTS')", ".mf-row:has-text('RDMID')"]),
        ("kepler16", ["button:has-text('PROJECTS')", ".mf-row:has-text('ATTG')"]),
        ("hd110067", ["button:has-text('PROJECTS')", ".mf-row:has-text('This Universe')"])],
  "d": [("milano", [".hud-nav-btn--ship"]),
        ("tres2b", ["button:has-text('PROJECTS')", ".mf-row:has-text('Prayer Times')"]),
        ("k218b", ["button:has-text('PROJECTS')", ".mf-row:has-text('CVD Prediction')"])],
}

batch = BATCHES[sys.argv[1]]
with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width":1440,"height":900})
    pg.goto("http://localhost:3000", wait_until="networkidle")
    pg.wait_for_selector(".hud-nav", timeout=30000)
    time.sleep(2)
    for name, clicks in batch:
        for c in clicks:
            try:
                pg.click(c, timeout=9000); time.sleep(2.4)
            except Exception as e:
                print(f"  !! {name}: {c} -> {str(e)[:60]}")
        time.sleep(2.0)
        pg.screenshot(path=f"qa/shots/p-{name}.png")
        print(f"  {name}")
        try:
            pg.keyboard.press("Escape"); time.sleep(1.4)
        except Exception: pass
    b.close()
PY
for g in a b; do .venv-qa/bin/python qa/sheet.py $g; done 2>&1 | tail -10