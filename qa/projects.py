"""Verify all 7 project worlds: manifest, panel content, links, contrast mode."""
import json, subprocess, sys, time
from playwright.sync_api import sync_playwright

data = json.loads(subprocess.run(
    ["npx","tsx","-e","""
import {PROJECTS} from './src/data/projects';
import {worldForProject} from './src/data/worlds';
console.log(JSON.stringify(PROJECTS.map(p=>{
  const w = worldForProject(p.id)!;
  return {id:p.id,index:p.index,name:p.name,kind:p.kind,desc:p.description,
          tech:p.tech,links:p.links.map(l=>l.href),priv:p.private,
          world:w.displayName,desig:w.designation,mode:w.panelMode,facts:w.facts};
})));
"""], capture_output=True, text=True).stdout.strip().splitlines()[-1])

fails = []
def check(name, cond, detail=""):
    print(("  ok   " if cond else "  FAIL ") + name + (f" — {detail}" if not cond and detail else ""))
    if not cond: fails.append(name)

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("http://localhost:3000", wait_until="networkidle")
    pg.wait_for_selector(".hud-nav", timeout=25000)
    pg.click("button:has-text('PROJECTS')")
    time.sleep(4)

    print("\nsurvey manifest")
    check("7 rows", pg.locator(".mf-row").count() == 7)
    check("no overlap with the rail", pg.evaluate("""() => {
      const mf = document.querySelector('.mf')?.getBoundingClientRect();
      const nv = document.querySelector('.hud-nav')?.getBoundingClientRect();
      return !!mf && !!nv && mf.bottom <= nv.top + 1;
    }"""))
    for d in data:
        row = pg.locator(f".mf-row:has-text('{d['name']}')")
        check(f"manifest {d['index']} {d['name']}", row.count() == 1)

    print("\nopening every world from the manifest")
    for d in data:
        pg.click(f".mf-row:has-text('{d['name']}')")
        time.sleep(2.4)
        if pg.locator(".pnl").count() != 1:
            check(f"{d['name']} panel opens", False)
            continue
        title = pg.inner_text(".pnl-title").strip()
        body = pg.inner_text(".pnl-body")
        desig = pg.inner_text(".pnl-desig").strip()
        facts = pg.inner_text(".pnl-facts")
        mode_light = pg.locator(".pnl--light").count() == 1
        hrefs = pg.eval_on_selector_all(".pnl a[href]", "els=>els.map(e=>e.getAttribute('href'))")
        techs = pg.eval_on_selector_all(".prp-tech li", "els=>els.map(e=>e.textContent.trim())")

        ok = (title == d["name"]
              and desig == d["desig"]
              and d["desc"][:70] in body
              and techs == d["tech"]
              and sorted(hrefs) == sorted(d["links"])
              and mode_light == (d["mode"] == "light")
              and all(f in facts for f in d["facts"]))
        detail = ""
        if not ok:
            detail = (f"title={title!r} desig={desig!r} tech_ok={techs == d['tech']} "
                      f"links={hrefs} want={d['links']} light={mode_light} want_light={d['mode']=='light'} "
                      f"desc_ok={d['desc'][:70] in body} facts_ok={all(f in facts for f in d['facts'])}")
        check(f"{d['index']} {d['name']} / {d['world']}", ok, detail)

        if d["priv"]:
            check(f"   {d['name']} marks the repo private", pg.locator(".prp-private").count() == 1)
        pg.keyboard.press("Escape")
        time.sleep(0.9)

    print(f"\nconsole errors: {errs if errs else 'none'}")
    if errs: fails.append("console errors")
    b.close()

print(f"\n{'✓ all 7 project worlds verified' if not fails else '✗ ' + str(len(fails)) + ' failure(s)'}\n")
sys.exit(0 if not fails else 1)
