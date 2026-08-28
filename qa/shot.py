"""
Screenshot a URL once the scene has settled, reporting console noise.

Usage: shot.py URL OUT [W] [H] [WAIT_S] [WAIT_FOR_SELECTOR] [CLICK_SELECTOR...]

Animations are deliberately NOT disabled: this app eases its loading
progress on requestAnimationFrame, and freezing animations stops it ever
reaching 100%. Instead we wait for a selector that only exists once the
scene is live.
"""
import sys, time
from playwright.sync_api import sync_playwright

url, out = sys.argv[1], sys.argv[2]
w = int(sys.argv[3]) if len(sys.argv) > 3 else 1440
h = int(sys.argv[4]) if len(sys.argv) > 4 else 900
wait = float(sys.argv[5]) if len(sys.argv) > 5 else 3.0
wait_for = sys.argv[6] if len(sys.argv) > 6 and sys.argv[6] != "-" else ".hud-nav"
clicks = sys.argv[7:] if len(sys.argv) > 7 else []

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=[
        "--use-gl=angle", "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist",
    ])
    page = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
    errs = []
    page.on("console", lambda m: errs.append(f"[{m.type}] {m.text}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errs.append(f"[pageerror] {e}"))

    page.goto(url, wait_until="networkidle")
    if wait_for:
        try:
            page.wait_for_selector(wait_for, timeout=20000)
        except Exception as e:
            print(f"!! selector {wait_for} never appeared: {str(e)[:120]}")

    for sel in clicks:
        try:
            page.click(sel, timeout=8000, force=True)
            time.sleep(1.6)
        except Exception as e:
            print(f"!! click {sel} failed: {str(e)[:120]}")

    time.sleep(wait)
    page.screenshot(path=out, timeout=60000)
    b.close()

print(f"saved {out}")
if errs:
    print("console:")
    for e in dict.fromkeys(errs):
        print("  " + e[:300])
else:
    print("console: clean")
