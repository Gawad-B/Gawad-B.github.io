"""Verify Saturn's skill system: hover, click, panel content, band isolation."""
import sys, time
from playwright.sync_api import sync_playwright
from _launch import UNIVERSE_URL, launch

fails = []
def check(name, cond, detail=""):
    print(("  ok   " if cond else "  FAIL ") + name + (f" — {detail}" if not cond and detail else ""))
    if not cond: fails.append(name)

with sync_playwright() as p:
    b = launch(p)
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("window.__moonDebug = true")
    pg.goto(UNIVERSE_URL, wait_until="networkidle")
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
    check(f"49 moons projected (got {len(moons)})", len(moons) == 49)
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

    # Poll rather than sleep a fixed amount. Under the software rasteriser
    # available here the scene runs at ~2fps, so acquiring hover takes a
    # second or more of wall clock — a fixed wait either flakes or hides a
    # real failure. Re-aim each attempt because the moons are orbiting.
    def acquire(timeout=14.0):
        deadline = time.time() + timeout
        while time.time() < deadline:
            m = aim()
            if not m:
                time.sleep(0.3); continue
            pg.mouse.move(m["x"], m["y"])
            time.sleep(0.5)
            if pg.locator(".hvr").count() == 1:
                return m
        return None
    acquired = acquire()
    check("hover label appears", acquired is not None)
    if acquired: target = acquired
    if pg.locator(".hvr").count():
        lbl = pg.inner_text(".hvr-label")
        names = [m["name"] for m in (pg.evaluate("window.__moonScreen") or [])]
        check(f"label names a real skill ({lbl!r})", lbl in names)

    print("\nclick → panel")
    # Re-acquire immediately before clicking: a moon that has drifted past the
    # 44px release radius has correctly dropped hover, and clicking a stale
    # position would test nothing.
    live = acquire() or target
    hovered_name = pg.inner_text(".hvr-label") if pg.locator(".hvr").count() else live["name"]
    pg.mouse.click(live["x"], live["y"])
    for _ in range(16):
        if pg.locator(".pnl").count() == 1: break
        time.sleep(0.5)
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
    check("all bands restored", len(pg.evaluate("window.__moonScreen") or []) == 49)

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
