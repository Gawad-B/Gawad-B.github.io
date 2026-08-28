"""The stuck-hover bug: bodies orbit and DOM overlays swallow pointer
events, so hover must release without waiting for a pointer event that
will never come (per-frame re-verification in Hotspot)."""
import sys, time, re
from playwright.sync_api import sync_playwright

fails = []
def check(name, cond, detail=""):
    print(("  ok   " if cond else "  FAIL ") + name + (f" — {detail}" if not cond and detail else ""))
    if not cond: fails.append(name)

def anchor_of(pg, text):
    el = pg.locator(".sc-callout", has_text=text).first
    m = re.search(r"translate3d\((\d+)px, (\d+)px", el.get_attribute("style"))
    return int(m.group(1)), int(m.group(2))

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width":1440,"height":900})
    pg.goto("http://localhost:3000/?qa=1", wait_until="networkidle")
    pg.wait_for_selector(".hud-nav", timeout=30000)
    pg.evaluate("()=>window.__journey.getState().travelTo('system')")
    for _ in range(40):
        time.sleep(0.3)
        if pg.evaluate("()=>window.__journey.getState().phase==='idle'"): break
    pg.wait_for_selector(".sc-callout", timeout=15000)

    # 1. Hovering a body still acquires (cursor flips to pointer).
    #    Project worlds carry the in-scene hotspots; About/Saturn are
    #    callout-only by design. The map is crowded, so find a project
    #    anchor point the DOM callout buttons don't cover — a covered
    #    anchor belongs to the button (clicking it is the intended UX).
    x = y = None
    for name in ["Labora", "Quizzy", "Prayer Times", "RDMID", "ATTG", "CVD Prediction"]:
        ax, ay = anchor_of(pg, name)
        for dx, dy in [(0, 0), (0, -10), (10, 0), (-10, 0), (0, 10)]:
            tag = pg.evaluate(f"()=>{{const e=document.elementFromPoint({ax+dx},{ay+dy});return e?e.tagName:''}}")
            if tag == "CANVAS":
                x, y = ax + dx, ay + dy
                break
        if x is not None: break
    check("found an uncovered body to hover", x is not None)
    pg.mouse.move(x, y, steps=4)
    got = False
    for _ in range(10):
        time.sleep(0.15)
        if pg.evaluate("()=>document.body.style.cursor") == "pointer": got = True; break
    check("hovering a body acquires (cursor: pointer)", got)
    check("the hover banner appears", pg.locator(".hvr").count() == 1)

    # 2. Pointer slides onto a DOM overlay (the nav rail) — the canvas
    #    stops receiving events; the hover must still release.
    pg.mouse.move(140, 700, steps=2)
    released = False
    for _ in range(12):
        time.sleep(0.15)
        if pg.evaluate("()=>document.body.style.cursor") != "pointer" and pg.locator(".hvr").count() == 0:
            released = True; break
    check("banner releases when the pointer leaves for a DOM overlay", released)

    # 3. Re-acquire and park the pointer on empty canvas: release too.
    pg.mouse.move(x, y, steps=4)
    time.sleep(0.4)
    pg.mouse.move(x + 220, y + 160, steps=6)  # empty space, still on canvas
    released = False
    for _ in range(12):
        time.sleep(0.15)
        if pg.evaluate("()=>document.body.style.cursor") != "pointer" and pg.locator(".hvr").count() == 0:
            released = True; break
    check("banner releases on empty canvas", released)

    # 4. THE reported repro, verbatim: hover the Milano itself, see its
    #    banner, take the cursor away, banner must disappear. Aim at the
    #    ship's true projected position (the callout anchor edge-pins).
    ship = pg.evaluate("()=>window.__bodyScreen && window.__bodyScreen('milano-ship')")
    check("ship position resolvable", bool(ship))
    sx, sy = int(ship["x"]), int(ship["y"])
    acquired = False
    import math
    points = [(0, 0)] + [
        (int(r * math.cos(a * math.pi / 4)), int(r * math.sin(a * math.pi / 4)))
        for r in (14, 24) for a in range(8)
    ]
    for dx, dy in points:
        px, py = sx + dx, sy + dy
        if not (0 <= px < 1440 and 0 <= py < 900): continue
        tag = pg.evaluate(f"()=>{{const e=document.elementFromPoint({px},{py});return e?e.tagName:''}}")
        if tag != "CANVAS": continue
        pg.mouse.move(px, py, steps=2)
        time.sleep(0.35)
        if pg.locator(".hvr", has_text="UNREGISTERED").count() == 1:
            acquired = True
            break
    check("the Milano's banner appears on hover", acquired)
    pg.mouse.move(max(sx - 320, 40), min(sy + 200, 880), steps=6)  # clear of ship and callout
    gone = False
    for _ in range(12):
        time.sleep(0.15)
        if pg.locator(".hvr").count() == 0: gone = True; break
    check("the Milano's banner disappears when the cursor leaves", gone)

print(f"\n{'✓ hover release verified' if not fails else '✗ '+str(len(fails))+' failure(s)'}\n")
sys.exit(0 if not fails else 1)
