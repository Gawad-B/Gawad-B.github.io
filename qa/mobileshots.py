import sys, time
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    ctx=b.new_context(viewport={"width":375,"height":812},is_mobile=True,has_touch=True,device_scale_factor=2)
    pg=ctx.new_page()
    pg.goto(sys.argv[1],wait_until="networkidle")
    pg.wait_for_selector(".hero-cta",timeout=45000)
    time.sleep(1.5)
    pg.screenshot(path="qa/shots/m-hero.png")
    pg.click(".hero-cta",force=True)
    for _ in range(20):
        time.sleep(0.6)
        if pg.evaluate("document.querySelectorAll('.sc-callout').length")>0: break
    pg.screenshot(path="qa/shots/m-system.png")
    for name,sel in [("about","button:has-text('About')"),("skills","button:has-text('Skills')"),
                     ("projects","button:has-text('Projects')")]:
        pg.click(sel,force=True)
        for _ in range(20):
            time.sleep(0.6)
            if "HOLDING" in pg.inner_text(".hud-status"): break
        time.sleep(1.2)
        pg.screenshot(path=f"qa/shots/m-{name}.png")
    pg.click(".mf-row:has-text('Labora')",force=True); time.sleep(4)
    pg.screenshot(path="qa/shots/m-panel.png")
    print("mobile shots done")
    b.close()
