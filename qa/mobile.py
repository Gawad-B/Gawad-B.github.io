"""Mobile matrix + reduced motion + performance sampling."""
import sys, time
from playwright.sync_api import sync_playwright

fails = []
def check(name, cond, detail=""):
    print(("  ok   " if cond else "  FAIL ") + name + (f" — {detail}" if not cond and detail else ""))
    if not cond: fails.append(name)

ARGS = ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=ARGS)

    # ---------------- mobile ----------------
    print("\nmobile 375x812")
    ctx = b.new_context(viewport={"width":375,"height":812}, is_mobile=True,
                        has_touch=True, device_scale_factor=2,
                        user_agent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36")
    pg = ctx.new_page()
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("http://localhost:3000", wait_until="networkidle")
    pg.wait_for_selector(".hud-nav", timeout=30000)
    time.sleep(2)

    check("no horizontal overflow",
          pg.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"),
          f"scrollWidth={pg.evaluate('document.documentElement.scrollWidth')}")
    check("nav became a bottom bar", pg.evaluate("""() => {
      const r = document.querySelector('.hud-nav').getBoundingClientRect();
      return r.bottom > window.innerHeight - 60 && r.width > window.innerWidth * 0.8;
    }"""))
    check("keyboard legend hidden on touch",
          pg.evaluate("!document.querySelector('.hud-keys') || getComputedStyle(document.querySelector('.hud-keys')).display === 'none'"))
    check("nav buttons are >=44px tall", pg.evaluate("""() => [...document.querySelectorAll('.hud-nav-btn')]
      .every(e => e.getBoundingClientRect().height >= 43)"""),
      str(pg.evaluate("[...document.querySelectorAll('.hud-nav-btn')].map(e=>Math.round(e.getBoundingClientRect().height))")))
    pg.screenshot(path="qa/shots/mobile-hero.png")

    for label, sel in [("about","button:has-text('About')"), ("skills","button:has-text('Skills')"),
                       ("projects","button:has-text('Projects')")]:
        pg.click(sel); time.sleep(3)
        check(f"{label}: no horizontal overflow",
              pg.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"))
    # A project panel should be a bottom sheet, not a side panel.
    pg.click(".mf-row:has-text('Labora')"); time.sleep(3)
    check("panel opens on mobile", pg.locator(".pnl").count() == 1)
    if pg.locator(".pnl").count():
        check("panel is a bottom sheet", pg.evaluate("""() => {
          const r = document.querySelector('.pnl').getBoundingClientRect();
          return r.width > window.innerWidth * 0.85 && r.bottom > window.innerHeight * 0.55;
        }"""))
        check("panel text is readable size", pg.evaluate("""() => {
          const p = document.querySelector('.pnl-body p');
          return p && parseFloat(getComputedStyle(p).fontSize) >= 12.5;
        }"""))
    pg.screenshot(path="qa/shots/mobile-panel.png")
    pg.keyboard.press("Escape"); time.sleep(1.5)

    pg.click(".hud-nav-btn--ship")
    # Boarding is a flown sequence now (approach → hold → ingress), so wait
    # for the monitor rather than assuming a fixed flight time.
    pg.wait_for_selector(".mon-screen", timeout=20000)
    time.sleep(1)
    check("Milano works on mobile", pg.locator(".mon-screen").count() == 1)
    check("monitor fits the viewport", pg.evaluate("""() => {
      const r = document.querySelector('.mon-screen').getBoundingClientRect();
      return r.width <= window.innerWidth * 1.02 && r.width > window.innerWidth * 0.5;
    }"""))
    check("all 4 channels reachable on mobile", pg.locator(".mon-channel").count() == 4)
    check("phone console is the scrollable overlay, not projected glass",
          pg.locator(".mon-overlay .mon-screen").count() == 1)
    pg.screenshot(path="qa/shots/mobile-milano.png")
    check("no console errors on mobile", not errs, str(errs[:2]))
    ctx.close()

    # ---------------- small phone: TRANSMIT must be reachable ----------------
    print("\nsmall phone (360x640)")
    ctx = b.new_context(viewport={"width":360,"height":640}, is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    pg.route("https://api.web3forms.com/**", lambda r: r.fulfill(
        status=200, content_type="application/json", body='{"success":true,"message":"ok"}'))
    pg.goto("http://localhost:3000/?qa=1", wait_until="networkidle")
    pg.wait_for_selector(".hud-nav", timeout=30000)
    pg.evaluate("()=>window.__journey.getState().enterMilano()")
    pg.wait_for_selector(".mon-overlay .mon-screen", timeout=30000)
    pg.wait_for_function("()=>!document.querySelector('.dock-veil.on')", timeout=20000)
    check("console overlay scrolls", pg.evaluate(
        "()=>{const o=document.querySelector('.mon-overlay');return o.scrollHeight>o.clientHeight}"))
    pg.evaluate("()=>document.querySelector('.mon-send').scrollIntoView({block:'center'})")
    time.sleep(0.5)
    box = pg.locator(".mon-send").bounding_box()
    check("TRANSMIT button reachable on a small phone",
          bool(box and 0 <= box["y"] and box["y"] + box["height"] <= 640))
    ctx.close()

    # ---------------- touch gestures ----------------
    print("\ntouch gestures")
    ctx = b.new_context(viewport={"width":375,"height":812}, is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    pg.goto("http://localhost:3000/?qa=1", wait_until="networkidle")
    pg.wait_for_selector(".hud-nav", timeout=30000)
    check("first visit shows the gesture coach", pg.locator(".coach").count() == 1)
    # Reading surfaces: the whole sheet scrolls on phones (nested scroll
    # regions get crushed when fixed sections fill the height cap).
    pg.evaluate("()=>window.__journey.getState().travelTo('about')")
    for _ in range(50):
        time.sleep(0.3)
        if pg.evaluate("()=>window.__journey.getState().phase==='idle'"): break
    time.sleep(0.5)
    check("about dossier scrolls as one sheet", pg.evaluate(
        "()=>{const s=document.querySelector('.dos-screen');return s.scrollHeight>s.clientHeight+4}"))
    pg.evaluate("()=>{const s=document.querySelector('.dos-screen'); s.scrollTop=s.scrollHeight}")
    time.sleep(0.4)
    check("the whole bio is reachable", pg.evaluate("""()=>{
      const ps=document.querySelectorAll('.dos-body p');
      const last=ps[ps.length-1]; if(!last) return false;
      const r=last.getBoundingClientRect();
      const c=document.querySelector('.dos-card').getBoundingClientRect();
      return ps.length>=3 && r.bottom <= c.bottom + 2;
    }"""))
    check("manifest yields to the dossier", pg.locator(".mf").count() == 0)
    check("dossier never bleeds past its card", pg.evaluate(
        "()=>getComputedStyle(document.querySelector('.dos-card')).overflow==='hidden'"))
    def wait_idle():
        for _ in range(50):
            time.sleep(0.3)
            if pg.evaluate("()=>window.__journey.getState().phase==='idle'"): return
    def swipe(x0, y0, x1, y1):
        pg.evaluate(f'''()=>{{
          const t0=new Touch({{identifier:1,target:document.body,clientX:{x0},clientY:{y0}}});
          const t1=new Touch({{identifier:1,target:document.body,clientX:{x1},clientY:{y1}}});
          window.dispatchEvent(new TouchEvent('touchstart',{{touches:[t0],changedTouches:[t0],bubbles:true}}));
          window.dispatchEvent(new TouchEvent('touchend',{{touches:[],changedTouches:[t1],bubbles:true}}));
        }}''')
    pg.evaluate("()=>window.__journey.getState().focusOn('project','rdmid')")
    wait_idle(); time.sleep(0.4)
    check("navigating dismisses the coach", pg.locator(".coach").count() == 0)
    pg.touchscreen.tap(14, 352)
    got = False
    for _ in range(12):
        time.sleep(0.25)
        if pg.evaluate("()=>window.__journey.getState().focus.kind") == "none": got = True; break
    check("tap on empty space closes the panel", got)
    wait_idle(); time.sleep(0.4)
    pg.touchscreen.tap(14, 352)
    got = False
    for _ in range(20):
        time.sleep(0.4)
        if pg.evaluate("()=>window.__journey.getState().region") == "system": got = True; break
    check("tap again zooms out to the system map", got)
    wait_idle(); time.sleep(0.4)
    swipe(300, 400, 110, 405)
    got = False
    for _ in range(20):
        time.sleep(0.4)
        if pg.evaluate("()=>window.__journey.getState().region") == "about": got = True; break
    check("swipe left travels forward", got)
    wait_idle(); time.sleep(0.4)
    swipe(110, 400, 300, 396)
    got = False
    for _ in range(20):
        time.sleep(0.4)
        if pg.evaluate("()=>window.__journey.getState().region") == "system": got = True; break
    check("swipe right travels back", got)
    ctx.close()

    # ---------------- reduced motion ----------------
    print("\nprefers-reduced-motion")
    ctx = b.new_context(viewport={"width":1280,"height":800}, reduced_motion="reduce")
    pg = ctx.new_page()
    pg.goto("http://localhost:3000", wait_until="networkidle")
    time.sleep(2)
    check("offers the document instead of imposing the flight",
          pg.locator(".fb").count() == 1)
    check("banner explains why", "REDUCED MOTION" in pg.inner_text(".fb-banner"))
    check("complete content is present",
          "Craft is just care" in pg.inner_text("body") and pg.locator("article").count() == 6)
    check("an opt-in into 3D is offered", pg.locator(".fb-cta").count() == 1)
    pg.click(".fb-cta")
    pg.wait_for_selector(".hud-nav", timeout=30000)
    time.sleep(2)
    check("opting in reaches the universe", pg.locator("canvas").count() == 1)
    pg.screenshot(path="qa/shots/reduced-motion.png")
    ctx.close()

    # ---------------- performance ----------------
    print("\nframe timing per region (software renderer — hardware will differ)")
    ctx = b.new_context(viewport={"width":1280,"height":800})
    pg = ctx.new_page()
    pg.goto("http://localhost:3000", wait_until="networkidle")
    pg.wait_for_selector(".hud-nav", timeout=30000)
    pg.evaluate("""() => {
      window.__ft = [];
      let last = performance.now();
      const loop = () => { const n = performance.now(); window.__ft.push(n - last); last = n;
        window.__raf = requestAnimationFrame(loop); };
      window.__raf = requestAnimationFrame(loop);
    }""")
    for label, sel in [("hero", None), ("about","button:has-text('ABOUT')"),
                       ("skills","button:has-text('SKILLS')"), ("projects","button:has-text('PROJECTS')"),
                       ("milano",".hud-nav-btn--ship")]:
        if sel: pg.click(sel); time.sleep(4)
        pg.evaluate("window.__ft = []")
        time.sleep(3)
        ft = pg.evaluate("window.__ft") or [16]
        ft = sorted(ft)
        med = ft[len(ft)//2]
        print(f"    {label:<10} median {med:6.1f}ms   p95 {ft[int(len(ft)*0.95)]:6.1f}ms   samples {len(ft)}")
    check("tier probe exposed a value",
          pg.evaluate("!!document.querySelector('.hud-status')"))
    ctx.close()
    b.close()

print(f"\n{'✓ mobile + reduced-motion verified' if not fails else '✗ ' + str(len(fails)) + ' failure(s)'}\n")
sys.exit(0 if not fails else 1)
