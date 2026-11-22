"""Verify the Milano: discovery, entry, console content, exit."""
import json, subprocess, sys, time
from playwright.sync_api import sync_playwright
from _launch import UNIVERSE_URL, launch

quips = json.loads(subprocess.run(
    ["npx","tsx","-e","import {MILANO} from './src/data/milano';console.log(JSON.stringify(MILANO.quips))"],
    capture_output=True, text=True).stdout.strip().splitlines()[-1])

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
    # Never actually post to Web3Forms from a test.
    pg.route("https://api.web3forms.com/**", lambda r: r.fulfill(
        status=200, content_type="application/json", body='{"success":true,"message":"ok"}'))
    pg.goto(UNIVERSE_URL + "?qa=1", wait_until="networkidle")
    pg.wait_for_selector(".hud-nav", timeout=25000)

    print("\ndiscovery")
    check("ship entry is anonymous before discovery",
          "·" in pg.inner_text(".hud-nav-btn--ship .hud-nav-label"))
    pg.click("button:has-text('PROJECTS')")
    time.sleep(4.5)
    check("proximity hint appears at the belt", pg.locator(".hud-hint").count() == 1)
    check("hint names the vessel", "UNREGISTERED" in pg.inner_text(".hud-hint").upper())

    print("\nentry")
    pg.click(".hud-nav-btn--ship")
    time.sleep(0.3)
    check("entry is a boarding sequence, not a teleport",
          pg.evaluate("()=>window.__journey.getState().docking") == "approach")
    veiled = False
    for _ in range(24):  # approach + hold + ingress from skills ≈ 3s
        time.sleep(0.35)
        if pg.locator(".dock-veil.on").count() == 1: veiled = True; break
    check("airlock veil covers the hull crossing", veiled)
    pg.wait_for_selector(".mon-screen", timeout=20000)
    check("monitor boots", pg.locator(".mon-screen").count() == 1)
    check("HUD reports the interior", "MILANO" in pg.inner_text(".hud-status").upper())
    check("nav entry is now named CONTACT",
          "CONTACT" in pg.inner_text(".hud-nav-btn--ship .hud-nav-label").upper())
    check("citation shown", pg.locator(".con-plate").count() == 1)
    check("citation states the fine", "40,000" in pg.inner_text(".con-plate"))

    print("\nchannels")
    hrefs = pg.eval_on_selector_all(".mon-channel", "els=>els.map(e=>e.getAttribute('href'))")
    for want in ["mailto:abdelrahman.gawad.28@gmail.com", "tel:+201027321793",
                 "https://github.com/Gawad-B", "https://linkedin.com/in/abdelrahman-gawad-3536302bb"]:
        check(f"channel {want[:44]}", want in hrefs)
    check("exactly 4 channels", len(hrefs) == 4)
    check("email value marquees or fits", pg.locator(".mon-channel .mon-marquee").count() >= 4)

    print("\nboot log")
    line = pg.inner_text(".mon-log-line").strip()
    check(f"quip is from the data ({line[:40]!r})", line in quips)

    print("\ntransmitter")
    for fid, val in [("#con-name","Test Traveler"), ("#con-email","t@example.com"), ("#con-message","Hello from orbit.")]:
        pg.fill(fid, val, force=True)
    check("labels are associated", pg.evaluate("""() => ['con-name','con-email','con-message']
      .every(id => !!document.querySelector(`label[for="${id}"]`))"""))
    pg.click(".mon-send")
    time.sleep(1.6)
    check("success reported", "received" in pg.inner_text(".mon-status").lower(),
          pg.inner_text(".mon-status"))
    check("form cleared on success", pg.input_value("#con-name") == "")

    print("\nexit")
    pg.click(".mon-exit")
    time.sleep(3.5)
    check("monitor closes", pg.locator(".mon-screen").count() == 0)
    check("returned to the belt, beside the station",
          "BELT" in pg.inner_text(".hud-status").upper())
    pg.click(".hud-nav-btn--ship")
    pg.wait_for_selector(".mon-screen", timeout=20000)
    pg.keyboard.press("Escape")
    time.sleep(3)
    check("Esc also exits the vessel", pg.locator(".mon-screen").count() == 0)

    print("\nsystem map + abort")
    pg.evaluate("()=>window.__journey.getState().travelTo('system')")
    named = False
    for _ in range(30):  # callouts render once the flight settles
        time.sleep(0.4)
        if pg.locator(".sc-callout", has_text="APHELION").count() == 1: named = True; break
    check("the station is named on the system map", named)
    pg.locator(".sc-callout", has_text="APHELION").click()
    pg.wait_for_selector(".mon-screen", timeout=25000)
    check("the map callout boards the ship", pg.locator(".mon-screen").count() == 1)
    pg.keyboard.press("Escape")
    time.sleep(3)
    pg.evaluate("()=>window.__journey.getState().enterMilano()")
    time.sleep(0.5)
    pg.keyboard.press("Escape")
    time.sleep(0.5)
    aborted = pg.evaluate("()=>{const s=window.__journey.getState();return s.docking===null && s.region!=='milano-interior'}")
    check("Esc mid-approach aborts the boarding", bool(aborted))
    time.sleep(2.5)
    check("an aborted boarding never reaches the interior", pg.locator(".mon-screen").count() == 0)

    print(f"\nconsole errors: {errs if errs else 'none'}")
    if errs: fails.append("console errors")
    b.close()

print(f"\n{'✓ milano verified' if not fails else '✗ ' + str(len(fails)) + ' failure(s)'}\n")
sys.exit(0 if not fails else 1)
