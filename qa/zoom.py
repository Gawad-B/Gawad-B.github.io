"""OS display scaling: 1920x1080 at 125%-250% yields short CSS viewports
(1536x864 down to 770x432) that must keep the desktop layout intact —
the hero must clear both the HUD readout above and the nav rail below."""
import sys, time
from playwright.sync_api import sync_playwright
from _launch import UNIVERSE_URL, launch

fails = []
def check(name, cond, detail=""):
    print(("  ok   " if cond else "  FAIL ") + name + (f" — {detail}" if not cond and detail else ""))
    if not cond: fails.append(name)

SIZES = {"125%": (1536, 864), "150%": (1280, 720), "175%": (1097, 617),
         "200%": (960, 540), "225%": (853, 480), "240%": (800, 450), "250%-edge": (770, 432)}

with sync_playwright() as p:
    b = launch(p)
    for name, (w, h) in SIZES.items():
        pg = b.new_page(viewport={"width": w, "height": h})
        pg.goto(UNIVERSE_URL + "?qa=1", wait_until="networkidle")
        pg.wait_for_selector(".hero-cta", timeout=40000)
        time.sleep(2.4)  # entrance animations are one-shot <=1.2s; rects must be settled
        probe = pg.evaluate("""()=>{
          const r=(s)=>{const e=document.querySelector(s); return e&&getComputedStyle(e).display!=='none'?e.getBoundingClientRect():null};
          const ol=(a,b)=>a&&b&&!(a.right<b.left||a.left>b.right||a.bottom<b.top||a.top>b.bottom);
          const cta=r('.hero-cta'), rail=r('.rail'), hud=r('.hud-status'),
                name=r('.hero-name'), eye=r('.hero-eyebrow'), loc=r('.hero-locale');
          const top=loc||eye||name;
          return {ctaRail: !!ol(cta,rail), topHud: !!ol(top,hud),
                  ctaIn: cta.bottom <= innerHeight && cta.top >= 0,
                  railGap: Math.round(rail.top-cta.bottom), hudGap: Math.round(top.top-hud.bottom)};
        }""")
        check(f"{name} ({w}x{h}): CTA clear of the rail (gap {probe['railGap']}px)", not probe["ctaRail"])
        check(f"{name}: hero clear of the HUD readout (gap {probe['hudGap']}px)", not probe["topHud"])
        check(f"{name}: CTA fully inside the viewport", probe["ctaIn"])
        pg.close()
    b.close()

print(f"\n{'✓ display-scaling layout verified' if not fails else '✗ '+str(len(fails))+' failure(s)'}\n")
sys.exit(0 if not fails else 1)
