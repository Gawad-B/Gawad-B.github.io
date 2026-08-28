"""
The full sweep: every skill moon, every project world, every panel field.
Drives the store directly (?qa=1) — the organic pointer path is covered by
qa/skills.py / qa/projects.py; this verifies CONTENT completeness.
"""
import json, subprocess, sys, time
from playwright.sync_api import sync_playwright

skills = json.loads(subprocess.run(["npx","tsx","-e","""
import {SKILL_GROUPS} from './src/data/skills';
console.log(JSON.stringify(SKILL_GROUPS.map(g=>({id:g.id,label:g.label,skills:g.skills.map(s=>({id:s.id,name:s.name})),n:g.skills.length}))));
"""],capture_output=True,text=True).stdout.strip().splitlines()[-1])
projects = json.loads(subprocess.run(["npx","tsx","-e","""
import {PROJECTS} from './src/data/projects';
import {worldForProject} from './src/data/worlds';
console.log(JSON.stringify(PROJECTS.map(p=>({id:p.id,name:p.name,world:worldForProject(p.id)!.displayName,links:p.links.length,priv:p.private}))));
"""],capture_output=True,text=True).stdout.strip().splitlines()[-1])

fails=[]
def check(name,cond,detail=""):
    if cond: print(f"  ok   {name}")
    else:
        print(f"  FAIL {name}" + (f" — {detail}" if detail else ""))
        fails.append(name)

with sync_playwright() as p:
    b=p.chromium.launch(headless=True,args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    pg=b.new_page(viewport={"width":1440,"height":900})
    errs=[]
    pg.on("console",lambda m: errs.append(m.text[:200]) if m.type=="error" else None)
    pg.on("pageerror",lambda e: errs.append(str(e)[:200]))
    pg.goto("http://localhost:3000/?qa=1",wait_until="networkidle")
    pg.wait_for_selector(".hud-nav",timeout=40000)
    pg.wait_for_function("!!window.__journey", timeout=10000)

    print(f"\nall {sum(g['n'] for g in skills)} skill moons")
    bad=[]
    for g in skills:
        for sk in g["skills"]:
            pg.evaluate("(id)=>window.__journey.getState().focusOn('skill', id)", sk["id"])
            # Poll until the panel shows THIS skill — a fixed one-shot wait
            # races the React flush when the rasteriser is saturated.
            try:
                pg.wait_for_function(
                    "(want)=>document.querySelector('.pnl-title')?.textContent.trim()===want",
                    arg=sk["name"], timeout=10000)
            except Exception:
                got=pg.evaluate("document.querySelector('.pnl-title')?.textContent ?? '(none)'")
                bad.append(f"{sk['name']}: stuck at {got!r}"); continue
            eyebrow=pg.inner_text(".pnl-eyebrow").strip()
            chips=pg.locator(".skp-chip").count()
            if g["label"].upper() not in eyebrow.upper(): bad.append(f"{sk['name']}: band={eyebrow!r}")
            elif chips!=g["n"]: bad.append(f"{sk['name']}: chips={chips} want {g['n']}")
    check(f"every moon opens a correct panel ({sum(g['n'] for g in skills)-len(bad)}/{sum(g['n'] for g in skills)})",
          not bad, "; ".join(bad[:4]))

    pg.evaluate("()=>window.__journey.getState().clearFocus()")
    time.sleep(0.4)

    print(f"\nall {len(projects)} project worlds")
    bad=[]
    for pr in projects:
        pg.evaluate("(id)=>window.__journey.getState().focusOn('project', id)", pr["id"])
        try:
            pg.wait_for_function(
                "(want)=>document.querySelector('.pnl-title')?.textContent.trim()===want",
                arg=pr["name"], timeout=6000)
        except Exception:
            bad.append(f"{pr['name']}: panel/title"); continue
        links=pg.locator(".pnl a[href]").count()
        privm=pg.locator(".prp-private").count()
        if links!=pr["links"]: bad.append(f"{pr['name']}: links={links} want {pr['links']}")
        elif pr["priv"] and privm!=1: bad.append(f"{pr['name']}: private marker missing")
    check(f"every world opens its dossier with links intact ({len(projects)-len(bad)}/{len(projects)})",
          not bad, "; ".join(bad[:4]))

    print("\nlayered escape")
    pg.keyboard.press("Escape"); time.sleep(1.0)
    check("Esc closes the dossier first", pg.locator(".pnl").count()==0)
    region=pg.evaluate("window.__journey.getState().region")
    check("…while staying in the belt", region=="projects", region)

    print("\ninteraction odds and ends")
    pg.evaluate("()=>window.__journey.getState().travelTo('about')")
    pg.wait_for_selector(".dos-next",timeout=10000)
    pg.click(".dos-next"); time.sleep(3)
    check("dossier's 'Continue to Saturn' flies to Saturn",
          "SATURN" in pg.inner_text(".hud-status"))
    pg.click(".mf-row:has-text('Machine Learning')"); time.sleep(0.6)
    pg.evaluate("()=>window.__journey.getState().focusOn('skill','ml-ai--pytorch')")
    pg.wait_for_selector(".skp-isolate",timeout=6000)
    pg.click(".skp-isolate"); time.sleep(0.6)
    iso=pg.evaluate("window.__journey.getState().isolatedBand")
    check("skill panel's isolate control isolates its band", iso=="ml-ai", str(iso))
    check("audio toggle present and off by default",
          pg.get_attribute(".hud-audio","aria-pressed")=="false")
    pg.click(".hud-audio"); time.sleep(0.4)
    check("audio toggles on", pg.get_attribute(".hud-audio","aria-pressed")=="true")
    pg.click(".hud-audio")

    print("\ntransmitter error path")
    pg.route("https://api.web3forms.com/**", lambda r: r.fulfill(status=500, content_type="application/json", body='{"success":false,"message":"Refused by test"}'))
    pg.evaluate("()=>window.__journey.getState().enterMilano()")
    pg.wait_for_selector(".mon-screen",timeout=20000)
    for fid,val in [("#con-name","QA"),("#con-email","qa@e.com"),("#con-message","x")]:
        pg.fill(fid,val,force=True)
    pg.click(".mon-send",force=True)
    ok=False
    for _ in range(12):
        time.sleep(0.6)
        if pg.locator(".mon-status.is-error").count()==1: ok=True; break
    check("a refused transmission reports the error", ok, pg.inner_text(".mon-status"))
    check("form keeps the draft on error", pg.input_value("#con-name")=="QA")

    # The stubbed 500 above logs a resource error by design.
    real = [e for e in errs if "web3forms" not in e and "500" not in e]
    print(f"\nconsole errors: {real if real else 'none (1 deliberate stubbed 500 excluded)'}")
    if real: fails.append("console errors")
    b.close()

print(f"\n{'✓ exhaustive sweep passed' if not fails else '✗ '+str(len(fails))+' failure(s)'}\n")
sys.exit(0 if not fails else 1)
