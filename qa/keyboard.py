"""Arrows, digits, Esc — the full keyboard model, post-Rev-2."""
import sys, time
from playwright.sync_api import sync_playwright

fails=[]
def check(n,c,d=""):
    print(("  ok   " if c else "  FAIL ")+n+(f" — {d}" if not c and d else ""))
    if not c: fails.append(n)

def wait_pos(pg, want, timeout=16):
    end=time.time()+timeout
    while time.time()<end:
        if want in pg.inner_text(".hud-status-row:nth-child(1) .readout"): return True
        time.sleep(0.5)
    return False

with sync_playwright() as p:
    b=p.chromium.launch(headless=True,args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    pg=b.new_page(viewport={"width":1440,"height":900})
    pg.goto("http://localhost:3000",wait_until="networkidle")
    pg.wait_for_selector(".hero-cta",timeout=40000)

    print("\narrow keys walk the scroll order")
    pg.keyboard.press("ArrowDown");  check("↓ hero → system", wait_pos(pg,"HELIOCENTRIC"))
    pg.keyboard.press("ArrowDown");  check("↓ system → about", wait_pos(pg,"HD 189733"))
    pg.keyboard.press("ArrowUp");    check("↑ back to system", wait_pos(pg,"HELIOCENTRIC"))

    print("\ndigits jump to the five stations")
    pg.keyboard.press("3"); check("3 → Saturn", wait_pos(pg,"SATURN"))
    pg.keyboard.press("4"); check("4 → belt", wait_pos(pg,"EXOPLANET"))
    pg.keyboard.press("5"); check("5 → the ship", wait_pos(pg,"MILANO"))
    pg.wait_for_selector(".mon-screen",timeout=20000)

    print("\nEsc walks back out, one layer at a time")
    pg.keyboard.press("Escape"); check("Esc exits the vessel", wait_pos(pg,"SATURN"))
    pg.keyboard.press("4"); wait_pos(pg,"EXOPLANET")
    pg.click(".mf-row:has-text('RDMID')"); time.sleep(3)
    check("dossier open", pg.locator(".pnl").count()==1)
    pg.keyboard.press("Escape"); time.sleep(1.2)
    check("Esc closes the dossier, stays in the belt",
          pg.locator(".pnl").count()==0 and "EXOPLANET" in pg.inner_text(".hud-status"))

    print("\nkeys stay out of form fields")
    pg.keyboard.press("5"); wait_pos(pg,"MILANO")
    pg.wait_for_selector("#con-name",timeout=20000)
    pg.fill("#con-name","4 and 5 and arrows", force=True)
    pg.focus("#con-name")
    pg.keyboard.press("ArrowLeft"); pg.keyboard.press("4"); time.sleep(1.5)
    check("typing digits in a field doesn't fly the ship anywhere",
          "MILANO" in pg.inner_text(".hud-status"))
    b.close()

print(f"\n{'✓ keyboard model verified' if not fails else '✗ '+str(len(fails))+' failure(s)'}\n")
sys.exit(0 if not fails else 1)
