"""Screenshot a URL after WebGL settles, and report console errors."""
import sys, time
from playwright.sync_api import sync_playwright

url = sys.argv[1]
out = sys.argv[2]
w = int(sys.argv[3]) if len(sys.argv) > 3 else 1280
h = int(sys.argv[4]) if len(sys.argv) > 4 else 800
wait = float(sys.argv[5]) if len(sys.argv) > 5 else 3.0

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=[
        "--use-gl=angle", "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist",
    ])
    page = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
    errs = []
    page.on("console", lambda m: errs.append(f"[{m.type}] {m.text}") if m.type in ("error","warning") else None)
    page.on("pageerror", lambda e: errs.append(f"[pageerror] {e}"))
    page.goto(url, wait_until="networkidle")
    time.sleep(wait)
    page.screenshot(path=out, timeout=60000, animations="disabled")
    b.close()

print(f"saved {out}")
if errs:
    print("\nconsole:")
    for e in dict.fromkeys(errs):
        print("  " + e[:400])
else:
    print("console: clean")
