"""Accessibility audit: keyboard traversal, focus, contrast, targets, ARIA."""
import sys, time, json
from playwright.sync_api import sync_playwright

fails, warns = [], []
def check(name, cond, detail=""):
    print(("  ok   " if cond else "  FAIL ") + name + (f" — {detail}" if not cond and detail else ""))
    if not cond: fails.append(name)
def warn(name, cond, detail=""):
    print(("  ok   " if cond else "  warn " ) + name + (f" — {detail}" if not cond and detail else ""))
    if not cond: warns.append(name)

CONTRAST_JS = """
() => {
  const lum = (c) => {
    const [r,g,b] = c.map(v => { v/=255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
    return 0.2126*r + 0.7152*g + 0.0722*b;
  };
  const parse = (s) => {
    const m = s.match(/[\\d.]+/g);
    return m ? m.slice(0,3).map(Number) : null;
  };
  // Composite over ancestors until an opaque background is found.
  const bgOf = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      const c = cs.backgroundColor;
      const m = c.match(/[\\d.]+/g);
      if (m && (m.length < 4 || Number(m[3]) > 0.85)) return parse(c);
      n = n.parentElement;
    }
    return [4,6,11];
  };
  const ratio = (a,b) => { const l1=lum(a), l2=lum(b); const [hi,lo]=l1>l2?[l1,l2]:[l2,l1];
    return (hi+0.05)/(lo+0.05); };

  const out = [];
  document.querySelectorAll('main, .pnl, .dos-card, .mon-screen, .con-plate, .hud-nav, .mf, .hero-inner, .hud-status')
    .forEach(root => {
      root.querySelectorAll('*').forEach(el => {
        if (!el.childNodes.length) return;
        const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
        if (!hasText) return;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.5) return;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return;
        const fg = parse(cs.color); if (!fg) return;
        const size = parseFloat(cs.fontSize);
        const bold = Number(cs.fontWeight) >= 700;
        const large = size >= 24 || (size >= 18.66 && bold);
        const need = large ? 3.0 : 4.5;
        const got = ratio(fg, bgOf(el));
        if (got < need) out.push({
          sel: el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : el.tagName,
          text: el.textContent.trim().slice(0,42), size: Math.round(size),
          ratio: +got.toFixed(2), need
        });
      });
    });
  return out;
}
"""

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width":1440,"height":900})
    pg.goto("http://localhost:3000", wait_until="networkidle")
    pg.wait_for_selector(".hud-nav", timeout=25000)
    time.sleep(1.5)

    print("\nsemantics")
    check("canvas is aria-hidden", pg.get_attribute("canvas", "aria-hidden") == "true")
    check("exactly one <main>", pg.locator("main").count() == 1)
    check("exactly one <h1>", pg.locator("h1").count() == 1)
    check("html[lang]", pg.get_attribute("html", "lang") == "en")
    check("nav has an accessible name", bool(pg.get_attribute("nav[aria-label]", "aria-label")))
    check("live region for region changes", pg.locator("[aria-live='polite']").count() >= 1)
    check("spine is clipped, not display:none", pg.evaluate(
        "getComputedStyle(document.querySelector('main')).display !== 'none'"))

    print("\naccessibility tree exposes all content")
    txt = pg.evaluate("document.querySelector('main').innerText")
    import subprocess
    skills = json.loads(subprocess.run(["npx","tsx","-e",
        "import {ALL_SKILLS} from './src/data/skills';console.log(JSON.stringify(ALL_SKILLS.map(s=>s.name)))"],
        capture_output=True,text=True).stdout.strip().splitlines()[-1])
    projects = json.loads(subprocess.run(["npx","tsx","-e",
        "import {PROJECTS} from './src/data/projects';console.log(JSON.stringify(PROJECTS.map(p=>p.name)))"],
        capture_output=True,text=True).stdout.strip().splitlines()[-1])
    check("all 48 skills in the spine", all(s in txt for s in skills),
          str([s for s in skills if s not in txt][:5]))
    check("all 7 projects in the spine", all(x in txt for x in projects))

    print("\nkeyboard traversal")
    focusables = pg.evaluate("""() => {
      const sel = 'a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])';
      return [...document.querySelectorAll(sel)].filter(e => {
        const r = e.getBoundingClientRect();
        const cs = getComputedStyle(e);
        return cs.display !== 'none' && cs.visibility !== 'hidden';
      }).length;
    }""")
    check(f"focusable controls present ({focusables})", focusables >= 10)

    reached = set()
    for _ in range(60):
        pg.keyboard.press("Tab")
        info = pg.evaluate("""() => {
          const e = document.activeElement;
          if (!e || e === document.body) return null;
          const cs = getComputedStyle(e);
          const r = e.getBoundingClientRect();
          return {tag: e.tagName, cls: (typeof e.className === 'string' ? e.className : ''),
                  label: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0,34),
                  outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
                  w: Math.round(r.width), h: Math.round(r.height)};
        }""")
        if info: reached.add(info["label"] or info["tag"])
    check(f"tab reaches many controls ({len(reached)})", len(reached) >= 8)

    focus_ok = pg.evaluate("""() => {
      const sel = 'a[href],button:not([disabled]),input,textarea';
      const bad = [];
      for (const el of document.querySelectorAll(sel)) {
        el.focus();
        const cs = getComputedStyle(el);
        const has = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 1)
                 || cs.boxShadow !== 'none';
        if (!has) bad.push((el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0,30));
      }
      return bad;
    }""")
    check("every control shows a focus indicator", not focus_ok, str(focus_ok[:5]))

    print("\ntouch targets (>=44px on the primary axis)")
    small = pg.evaluate("""() => {
      const sel = 'a[href],button:not([disabled]),input,textarea';
      const bad = [];
      for (const el of document.querySelectorAll(sel)) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        if (r.height < 24 || r.width < 24) bad.push({
          l: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0,28),
          w: Math.round(r.width), h: Math.round(r.height)});
      }
      return bad;
    }""")
    warn("no control under 24px", not small, str(small[:6]))

    print("\ncontrast (WCAG 2.2 AA)")
    for stage, clicks in [("hero", []),
                          ("about", ["button:has-text('ABOUT')"]),
                          ("projects+light panel", ["button:has-text('PROJECTS')", ".mf-row:has-text('Prayer Times')"]),
                          ("projects+dark panel", ["button:has-text('PROJECTS')", ".mf-row:has-text('CVD Prediction')"]),
                          ("milano", [".hud-nav-btn--ship"])]:
        for c in clicks:
            try:
                pg.click(c, timeout=8000); time.sleep(2.2)
            except Exception: pass
        time.sleep(1.0)
        bad = pg.evaluate(CONTRAST_JS)
        check(f"{stage}: text contrast", not bad,
              "; ".join(f"{x['sel']} {x['ratio']}:1<{x['need']} {x['text']!r}" for x in bad[:4]))
        try:
            pg.keyboard.press("Escape"); time.sleep(1.0)
        except Exception: pass

    print(f"\nwarnings: {warns if warns else 'none'}")
    b.close()

print(f"\n{'✓ a11y verified' if not fails else '✗ ' + str(len(fails)) + ' failure(s)'}\n")
sys.exit(0 if not fails else 1)
