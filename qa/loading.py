"""Loading: appears immediately, reports real progress, never strands."""
import sys, time
from playwright.sync_api import sync_playwright

fails=[]
def check(n,c,d=""):
    print(("  ok   " if c else "  FAIL ")+n+(f" — {d}" if not c and d else ""))
    if not c: fails.append(n)

with sync_playwright() as p:
    b=p.chromium.launch(headless=True,args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    pg=b.new_page(viewport={"width":1440,"height":900})
    t0=time.time()
    pg.goto("http://localhost:3000")
    try:
        pg.wait_for_selector(".ld",timeout=8000)
        check("loading screen appears", True)
    except Exception:
        check("loading screen appears", False)
    samples=[]
    for _ in range(40):
        s=pg.evaluate("""() => ({
          ld: !!document.querySelector('.ld'),
          pct: document.querySelector('.ld-pct')?.textContent?.replace(/\\D/g,'') ?? null,
          hero: !!document.querySelector('.hero-cta'),
        })""")
        samples.append(s)
        if s["hero"] and not s["ld"]: break
        time.sleep(0.5)
    took=time.time()-t0
    pcts=[int(s["pct"]) for s in samples if s["pct"]]
    check("progress is monotonic (no theatre, no resets)",
          all(a<=b for a,b in zip(pcts,pcts[1:])), str(pcts[:14]))
    check("progress actually moves", len(set(pcts))>=3, str(set(pcts)))
    check(f"resolves into the hero ({took:.1f}s on a software rasteriser)",
          samples[-1]["hero"] and not samples[-1]["ld"])
    check("well under the 14s stranding ceiling", took < 14, f"{took:.1f}s")
    b.close()

print(f"\n{'✓ loading verified' if not fails else '✗ '+str(len(fails))+' failure(s)'}\n")
sys.exit(0 if not fails else 1)
