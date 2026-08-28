"""Verify Saturn's skill system: hover, click, panel content, band isolation."""
import sys, time
from playwright.sync_api import sync_playwright

fails = []
def check(name, cond, detail=""):
    print(("  ok   " if cond else "  FAIL ") + name + (f" — {detail}" if not cond and detail else ""))
    if not cond: fails.append(name)

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("window.__moonDebug = true")
    pg.goto("http://localhost:3000", wait_until="networkidle")
    pg.wait_for_selector(".hud-nav", timeout=25000)
    pg.click("button:has-text('SKILLS')")
    time.sleep(4)

    print("\nsaturn system")
    check("manifest lists 7 bands + all", pg.locator(".mf-row").count() == 8)
    check("no overlap: rail is one column", pg.evaluate("""() => {
      const mf = document.querySelector('.mf')?.getBoundingClientRect();
      const nv = document.querySelector('.hud-nav')?.getBoundingClientRect();
      return !!mf && !!nv && mf.bottom <= nv.top + 1;
    }"""))

    moons = pg.evaluate("window.__moonScreen") or []
    check(f"48 moons projected (got {len(moons)})", len(moons) == 48)
    onscreen = [m for m in moons if 300 < m["x"] < 1400 and 60 < m["y"] < 820]
    check(f"moons on screen ({len(onscreen)})", len(onscreen) >= 20)

    print("\nhover")
    # Moons orbit, so the aim point has to be read immediately before the
    # move — a position sampled a second ago is stale by tens of pixels.
    def aim():
        live = pg.evaluate("window.__moonScreen") or []
        for m in live:
            if 340 < m["x"] < 1380 and 80 < m["y"] < 800:
                return m
        return None
    target = aim()
    check("found an on-screen moon to aim at", target is not None)
    pg.mouse.move(target["x"], target["y"])
    time.sleep(0.45)
    check("hover label appears", pg.locator(".hvr").count() == 1)
    if pg.locator(".hvr").count():
        lbl = pg.inner_text(".hvr-label")
        names = [m["name"] for m in (pg.evaluate("window.__moonScreen") or [])]
        check(f"label names a real skill ({lbl!r})", lbl in names)

    print("\nclick → panel")
    hovered_name = pg.inner_text(".hvr-label") if pg.locator(".hvr").count() else target["name"]
    pg.mouse.click(target["x"], target["y"])
    time.sleep(1.8)
    check("skill panel opens", pg.locator(".pnl").count() == 1)
    if pg.locator(".pnl").count():
        check("panel titles the hovered skill", pg.inner_text(".pnl-title").strip() == hovered_name,
              f"panel={pg.inner_text('.pnl-title')!r} hovered={hovered_name!r}")
        check("panel shows the band designation", "MOON" in pg.inner_text(".pnl-desig"))
        chips = pg.locator(".skp-chip").count()
        check(f"sibling chips present ({chips})", chips >= 5)
        check("saturn facts shown", "Cassini" in pg.inner_text(".pnl-facts") or "ice" in pg.inner_text(".pnl-facts"))

    print("\nband isolation")
    pg.keyboard.press("Escape")
    time.sleep(0.8)
    check("Esc closes the panel", pg.locator(".pnl").count() == 0)
    pg.click(".mf-row:has-text('Machine Learning')")
    time.sleep(1.2)
    check("band marked active", pg.locator(".mf-row.is-active:has-text('Machine Learning')").count() == 1)
    isolated = pg.evaluate("window.__moonScreen") or []
    state = pg.evaluate("window.__moonState")
    check(f"only that band is pickable ({len(isolated)} moons)", len(isolated) == 10,
          f"got {len(isolated)}, scene state={state}")
    pg.click(".mf-row:has-text('All bands')")
    time.sleep(1.0)
    check("all bands restored", len(pg.evaluate("window.__moonScreen") or []) == 48)

    print("\nmilano")
    check("proximity hint shown", pg.locator(".hud-hint").count() == 1)
    check("ship nav entry is anonymous until found",
          "·" in pg.inner_text(".hud-nav-btn--ship .hud-nav-label"))

    print(f"\nconsole errors: {errs if errs else 'none'}")
    if errs: fails.append("console errors")
    pg.screenshot(path="qa/shots/skills-panel.png")
    b.close()

print(f"\n{'✓ skills verified' if not fails else '✗ ' + str(len(fails)) + ' failure(s): ' + ', '.join(fails)}\n")
sys.exit(0 if not fails else 1)
