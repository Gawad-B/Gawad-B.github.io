"""Verify the no-WebGL fallback renders the COMPLETE portfolio."""
import json, re, subprocess, sys, time
from playwright.sync_api import sync_playwright

skills = json.loads(subprocess.run(
    ["npx","tsx","-e","import {ALL_SKILLS} from './src/data/skills';console.log(JSON.stringify(ALL_SKILLS.map(s=>s.name)))"],
    capture_output=True, text=True).stdout.strip().splitlines()[-1])
projects = json.loads(subprocess.run(
    ["npx","tsx","-e","import {PROJECTS} from './src/data/projects';console.log(JSON.stringify(PROJECTS.map(p=>({n:p.name,l:p.links.map(x=>x.href)}))))"],
    capture_output=True, text=True).stdout.strip().splitlines()[-1])

fails = []
def check(name, cond, detail=""):
    print(("  ok   " if cond else "  FAIL ") + name + (f" — {detail}" if not cond and detail else ""))
    if not cond: fails.append(name)

with sync_playwright() as p:
    # Block WebGL entirely to force the fallback path.
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width":1280,"height":900})
    errors = []
    page.on("console", lambda m: errors.append(m.text) if m.type=="error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.add_init_script("""
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(t, ...a){
        if (String(t).includes('webgl')) return null;
        return orig.call(this, t, ...a);
      };
    """)
    page.goto("http://localhost:3000", wait_until="networkidle")
    time.sleep(0.6)
    text = page.inner_text("body")

    print("\nfallback render")
    check("no console errors", not errors, "; ".join(errors[:3]))
    check("banner says WEBGL UNAVAILABLE", "WEBGL UNAVAILABLE" in text)
    check("h1 is the name", page.inner_text("h1").strip() == "Abdelrahman Gawad")
    check("exactly one h1", page.locator("h1").count() == 1)

    print("\ncontent completeness")
    missing_s = [s for s in skills if s not in text]
    check(f"all {len(skills)} skills present", not missing_s, f"missing {missing_s[:6]}")
    missing_p = [x["n"] for x in projects if x["n"] not in text]
    check(f"all {len(projects)} projects present", not missing_p, f"missing {missing_p}")
    for para in ["Mediterranean does most of my thinking", "predict cardiovascular disease before it happens", "story-driven game"]:
        check(f'bio: "{para[:34]}…"', para in text)
    check("quote present", "Craft is just care, made visible" in text)

    print("\nlinks")
    hrefs = set(page.eval_on_selector_all("a[href]", "els=>els.map(e=>e.getAttribute('href'))"))
    for x in projects:
        for l in x["l"]:
            check(f"link {l[:52]}", l in hrefs)
    check("mailto present", "mailto:abdelrahman.gawad.28@gmail.com" in hrefs)
    check("tel present", "tel:+201027321793" in hrefs)
    check("github present", "https://github.com/Gawad-B" in hrefs)
    check("linkedin present", "https://linkedin.com/in/abdelrahman-gawad-3536302bb" in hrefs)

    print("\nstructure / semantics")
    check("has <main>", page.locator("main").count() == 1)
    check("5 top-level sections (about/skills/projects/contact + skill subsections)",
          page.locator("main section[id]").count() == 4)
    check("7 <article> elements", page.locator("article").count() == 7)
    check("48 skill <li>", page.locator("#skills li").count() == 48)
    check("html lang set", page.get_attribute("html","lang") == "en")

    page.screenshot(path="qa/shots/fallback-desktop.png", full_page=True)
    page.set_viewport_size({"width":375,"height":812})
    time.sleep(0.4)
    page.screenshot(path="qa/shots/fallback-mobile.png", full_page=True)
    check("no horizontal overflow at 375px",
          page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"),
          f'scrollWidth={page.evaluate("document.documentElement.scrollWidth")}')
    browser.close()

print(f"\n{'✓ fallback verified' if not fails else '✗ ' + str(len(fails)) + ' failure(s): ' + ', '.join(fails)}\n")
sys.exit(0 if not fails else 1)
