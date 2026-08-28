"""Wheel/swipe section navigation: the scroll IS the page flow now."""
import sys, time
from playwright.sync_api import sync_playwright

fails = []
def check(name, cond, detail=""):
    print(("  ok   " if cond else "  FAIL ") + name + (f" — {detail}" if not cond and detail else ""))
    if not cond: fails.append(name)

def pos(pg):
    return pg.inner_text(".hud-status-row:nth-child(1) .readout").strip()

def wheel_until(pg, dy, want, tries=6):
    """One section per gesture, but flights take seconds — poll between."""
    for _ in range(tries):
        pg.mouse.wheel(0, dy)
        for _ in range(24):
            time.sleep(0.5)
            if want in pos(pg):
                return True
            # keep waiting while in transit
        # gesture may have been swallowed mid-flight; try again
    return False

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width":1440,"height":900})
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("http://localhost:3000", wait_until="networkidle")
    pg.wait_for_selector(".hero-cta", timeout=30000)
    pg.mouse.move(720, 450)

    print("\nscroll down through the sections")
    check("starts at the star", "STEPHENSON" in pos(pg))
    check("scroll → system overview", wheel_until(pg, 240, "HELIOCENTRIC"))
    check("scroll → about", wheel_until(pg, 240, "HD 189733"))
    check("scroll → skills", wheel_until(pg, 240, "SATURN"))
    check("scroll → projects", wheel_until(pg, 240, "EXOPLANET"))
    check("scroll → into the ship", wheel_until(pg, 240, "MILANO"))

    print("\nscroll up reverses")
    # Move the pointer off the monitor: wheel over the projected screen
    # must stay with the screen, not hijack navigation.
    pg.mouse.move(120, 450)
    check("scroll back → projects", wheel_until(pg, -240, "EXOPLANET"))
    check("scroll back → skills", wheel_until(pg, -240, "SATURN"))

    print("\nguards")
    pg.click("button:has-text('PROJECTS')"); time.sleep(4)
    pg.click(".mf-row:has-text('Labora')"); time.sleep(3.5)
    check("panel open", pg.locator(".pnl").count() == 1)
    box = pg.locator(".pnl-body").bounding_box()
    pg.mouse.move(box["x"] + box["width"]/2, box["y"] + 40)
    pg.mouse.wheel(0, 240)
    time.sleep(2.5)
    check("wheel inside the dossier scrolls the dossier, not the universe",
          "EXOPLANET" in pos(pg))

    print(f"\nconsole errors: {errs if errs else 'none'}")
    if errs: fails.append("console errors")
    b.close()

print(f"\n{'✓ scroll navigation verified' if not fails else '✗ ' + str(len(fails)) + ' failure(s)'}\n")
sys.exit(0 if not fails else 1)
