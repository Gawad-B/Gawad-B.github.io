"""Professional view at `/`: structure, intro cover, nav, hero, content, links, performance, layout, motion, a11y.

Run against a dev or production server:  python qa/pro.py   (QA_BASE / QA_CHROMIUM: see README)
"""
import re, sys
from playwright.sync_api import sync_playwright
from _launch import PRO_URL, UNIVERSE_URL, launch

failures = []
errors = []   # console errors and uncaught page errors across the whole run

NAV_RED = "rgb(207, 59, 36)"
WHITE = "rgb(255, 255, 255)"
PROOFS = ["3,500+", "0.861", "18×", "260+", "76th", "162"]
PROJECTS = ["Quizzy", "DaCode", "Labora", "CardioScreen"]


def check(name, cond, detail=""):
    print(("  ok   " if cond else "  FAIL ") + name + (f" — {detail}" if not cond and detail else ""))
    if not cond:
        failures.append(name)


def open_page(b, w, h, **ctx_kw):
    ctx = b.new_context(viewport={"width": w, "height": h}, **ctx_kw)
    pg = ctx.new_page()
    pg.on("console", lambda m: errors.append(f"{w}x{h} console: {m.text}") if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(f"{w}x{h} pageerror: {e}"))
    return ctx, pg


def load(pg, wait=400):
    """Open the page and wait until the entry cover has cleared and the content is interactive."""
    pg.goto(PRO_URL, wait_until="networkidle")
    pg.wait_for_selector("#contact", state="attached", timeout=15000)
    pg.wait_for_function("() => !document.documentElement.classList.contains('pv-intro')", timeout=10000)
    pg.wait_for_timeout(wait)


def scroll_to(pg, y, wait=600):
    pg.evaluate("(y) => window.scrollTo({top: y, behavior: 'instant'})", y)
    pg.wait_for_timeout(wait)


def scroll_bottom(pg, wait=900):
    pg.evaluate("window.scrollTo({top: document.documentElement.scrollHeight, behavior: 'instant'})")
    pg.wait_for_timeout(wait)


VISIBLE_JS = """
  const vis = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
"""

NAME_JS = """
  const nameOf = e => {
    const lb = e.getAttribute('aria-labelledby');
    if (lb) { const t = lb.split(/\\s+/).map(i => (document.getElementById(i) || {}).textContent || '').join(' ').trim(); if (t) return t; }
    const al = (e.getAttribute('aria-label') || '').trim(); if (al) return al;
    const tx = (e.textContent || '').trim(); if (tx) return tx;
    for (const im of e.querySelectorAll('img[alt]')) if (im.alt.trim()) return im.alt.trim();
    return (e.getAttribute('title') || '').trim();
  };
"""


def hits(a, b):
    """True when two {l,t,r,b} boxes overlap by more than a 1px rounding tolerance."""
    return a["l"] < b["r"] - 1 and b["l"] < a["r"] - 1 and a["t"] < b["b"] - 1 and b["t"] < a["b"] - 1


with sync_playwright() as p:
    b = launch(p)

    # ---------------- a. structure, intro cover, content, links ----------------
    print("\nstructure")
    ctx, pg = open_page(b, 1440, 900)
    # Record the root classes at DOMContentLoaded: the entry cover must already be on at first paint.
    pg.add_init_script("document.addEventListener('DOMContentLoaded', () => { window.__rootAtStart = document.documentElement.className; });")
    requests = []
    pg.on("request", lambda r: requests.append(r.url))
    load(pg, 800)

    h1 = pg.locator("h1")
    check("exactly one h1", h1.count() == 1, f"found {h1.count()}")
    check("h1 contains the name", "Abdelrahman Gawad" in (h1.first.text_content() or ""))
    ids = ["projects", "experience", "skills", "about", "contact"]
    present = [pg.locator(f"section#{i}").count() == 1 for i in ids]
    check("sections #projects #experience #skills #about #contact exist", all(present), str(dict(zip(ids, present))))
    order = pg.evaluate("""(ids) => {
      const els = ids.map(i => document.getElementById(i));
      if (els.some(e => !e)) return false;
      return els.every((e, i) => i === 0 || (els[i-1].compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0);
    }""", ids)
    check("sections are in DOM order", order)
    check("main#main exists", pg.locator("main#main").count() == 1)
    check("skip link to #main exists", pg.locator('a.pv-skip[href="#main"]').count() == 1)
    check("hero is the first section in main", pg.evaluate(
        "(() => { const m = document.querySelector('main#main'); return !!m && !!m.firstElementChild && m.firstElementChild.classList.contains('pv-hero'); })()"))

    foot = pg.evaluate("""() => {
      const f = [...document.querySelectorAll('footer')], m = document.querySelector('main#main');
      const nav = document.querySelector('footer nav[aria-label="Footer"]');
      return {n: f.length, outside: !!m && f.length === 1 && !m.contains(f[0]),
              after: !!m && f.length === 1 && (m.compareDocumentPosition(f[0]) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
              navHrefs: nav ? [...nav.querySelectorAll('a')].map(a => a.getAttribute('href')) : null,
              mark: !!document.querySelector('footer .pv-foot__mark[aria-hidden="true"]')}; }""")
    check("one <footer> landmark, after </main> and outside it", foot["n"] == 1 and foot["outside"] and foot["after"], str(foot))
    check("footer has a nav labelled Footer with the four section links",
          sorted(foot["navHrefs"] or []) == sorted(["#projects", "#experience", "#skills", "#about"]), str(foot["navHrefs"]))
    check("footer wordmark is decorative (aria-hidden)", foot["mark"])

    # ---------------- b. intro cover ----------------
    print("\nintro cover")
    root_start = pg.evaluate("window.__rootAtStart || ''")
    check("html has pv-js and the cover was on at first paint", "pv-js" in root_start and "pv-intro" in root_start, root_start)
    root_now = pg.evaluate("document.documentElement.className")
    check("after entry html has pv-entered and no pv-intro / pv-open",
          "pv-entered" in root_now and "pv-intro" not in root_now and "pv-open" not in root_now, root_now)
    wipe = pg.evaluate("""() => {
      const w = document.querySelector('div.pv-wipe'); if (!w) return null;
      const kids = [...document.body.children].slice(0, 3);
      const cx = innerWidth / 2, cy = innerHeight / 2, hit = document.elementFromPoint(cx, cy);
      return {spans: w.querySelectorAll(':scope > span').length, hidden: w.getAttribute('aria-hidden'),
              early: kids.includes(w), parent: w.parentElement === document.body,
              maxH: Math.max(...[...w.children].map(s => s.getBoundingClientRect().height)),
              events: getComputedStyle(w).pointerEvents, blocks: !!hit && !!hit.closest('.pv-wipe')}; }""")
    check("cover div.pv-wipe is in the body, near its start, with five spans and aria-hidden",
          bool(wipe) and wipe["spans"] == 5 and wipe["hidden"] == "true" and wipe["parent"] and wipe["early"], str(wipe))
    check("cover has cleared: columns collapsed and the page is not blocked",
          bool(wipe) and wipe["maxH"] < 1 and wipe["events"] == "none" and not wipe["blocks"], str(wipe))

    # ---------------- c. nav at 1440 ----------------
    print("\nnav 1440x900")
    nav_state = lambda page: page.evaluate("""() => {
      const n = document.querySelector('.pv-nav');
      const link = n.querySelector('.pv-nav__link'), brand = n.querySelector('.pv-nav__brand');
      return {scrolled: n.classList.contains('is-scrolled'), onDark: n.classList.contains('pv-on-dark'),
              bg: getComputedStyle(n).backgroundColor, link: getComputedStyle(link).color, brand: getComputedStyle(brand).color}; }""")
    top = nav_state(pg)
    check("nav at the top of the page is plain: pv-on-dark, not is-scrolled, no background",
          top["onDark"] and not top["scrolled"] and top["bg"] in ("rgba(0, 0, 0, 0)", "transparent"), str(top))
    scroll_to(pg, 60, 700)
    s60 = nav_state(pg)
    check("scrolling by a few px sets is-scrolled", s60["scrolled"], str(s60))
    check("scrolled nav is solid red with white text (never a light bar)",
          s60["bg"] == NAV_RED and s60["link"] == WHITE and s60["brand"] == WHITE, str(s60))
    scroll_to(pg, 2400, 700)
    deep = nav_state(pg)
    check("nav stays solid red further down the page", deep["scrolled"] and deep["bg"] == NAV_RED, str(deep))
    scroll_to(pg, 0, 700)
    back = nav_state(pg)
    check("back at the top the nav is plain again", not back["scrolled"] and back["bg"] in ("rgba(0, 0, 0, 0)", "transparent"), str(back))

    nav_links = pg.evaluate("""() => { %s
      return [...document.querySelectorAll('.pv-nav a[href^="#"]')].filter(vis)
        .map(a => a.getAttribute('href')).filter(h => h !== '#main'); }""" % VISIBLE_JS)
    check("four nav links with the section hrefs", sorted(nav_links) == sorted(["#projects", "#experience", "#skills", "#about"]),
          str(nav_links))
    home = pg.evaluate("""() => { %s
      return [...document.querySelectorAll('a, button')].filter(e => /^home$/i.test(nameOf(e))).length; }""" % NAME_JS)
    check('no link named "Home"', home == 0)
    resume = pg.locator('.pv-nav a[href$=".pdf"]')
    check("nav has a resume link ending in .pdf", resume.count() >= 1)
    if resume.count():
        href = resume.first.get_attribute("href") or ""
        r = pg.request.get(PRO_URL.rstrip("/") + href if href.startswith("/") else href)
        ctype = r.headers.get("content-type", "")
        check("resume fetch returns 200", r.status == 200, f"status {r.status}")
        check("resume content type is PDF", "pdf" in ctype.lower(), ctype)
    menu_vis = lambda page: page.evaluate("""() => { %s
      return [...document.querySelectorAll('.pv-nav button[aria-expanded]')].filter(vis).length; }""" % VISIBLE_JS)
    check("no menu button at 1440", menu_vis(pg) == 0)
    switch = pg.evaluate("""() => { const s = document.querySelector('.pv-nav .pv-gate--switch');
      return s ? {cur: (s.querySelector('[aria-current="page"]') || {}).textContent, href: (s.querySelector('a') || {}).getAttribute('href')} : null; }""")
    check("nav view switch marks the professional view current and links to /universe/",
          bool(switch) and bool(switch["cur"]) and switch["href"] == "/universe/", str(switch))

    # ---------------- d. hero ----------------
    print("\nhero")
    ctas = pg.locator(".pv-hero .pv-btn--primary, .pv-hero .pv-btn--ghost").count()
    check("hero has 1-2 CTAs", 1 <= ctas <= 2, f"found {ctas}")
    cta_hrefs = pg.evaluate("[...document.querySelectorAll('.pv-hero .pv-btn--primary, .pv-hero .pv-btn--ghost')].map(a => a.getAttribute('href'))")
    check("hero CTAs go to #projects and to the résumé PDF",
          len(cta_hrefs) == 2 and cta_hrefs[0] == "#projects" and (cta_hrefs[1] or "").endswith(".pdf"), str(cta_hrefs))
    check("hero has a GitHub link", pg.locator('.pv-hero a[href*="github.com"]').count() >= 1)
    check("hero has a LinkedIn link", pg.locator('.pv-hero a[href*="linkedin.com"]').count() >= 1)
    check("hero has a mailto link", pg.locator('.pv-hero a[href^="mailto:"]').count() >= 1)
    mini = pg.evaluate("""() => { const a = document.querySelector('.pv-hero a.pv-hero__mini');
      return a ? {href: a.getAttribute('href'), text: a.textContent, bg: getComputedStyle(a).backgroundColor} : null; }""")
    check("hero has the black \"Let's talk\" card linking to #contact",
          bool(mini) and mini["href"] == "#contact" and "let's talk" in mini["text"].lower()
          and sum(int(n) for n in re.findall(r"\d+", mini["bg"])[:3]) < 90, str(mini))
    giant = pg.locator(".pv-hero__giant")
    check("giant word is hidden from assistive tech", giant.count() == 1
          and giant.first.evaluate("el => !!el.closest('[aria-hidden=\"true\"]')"))
    card = pg.evaluate("""() => { const a = document.querySelector('.pv-hero .pv-gate--card');
      if (!a) return null; const r = a.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return {href: a.getAttribute('href'), clickable: !!hit && !!hit.closest('.pv-gate--card')}; }""")
    check("hero universe card links to /universe/ and is not covered by another element",
          bool(card) and card["href"] == "/universe/" and card["clickable"], str(card))
    portrait = pg.locator('.pv-hero img[fetchpriority="high"]')
    check("cut-out portrait image exists", portrait.count() == 1)
    if portrait.count():
        try:
            portrait.first.evaluate("el => el.complete || new Promise(res => el.addEventListener('load', res, {once: true}))")
        except Exception:
            pass
        check("portrait has loaded", portrait.first.evaluate("el => el.naturalWidth > 0"))
        check("portrait has width/height attributes",
              bool(portrait.first.get_attribute("width")) and bool(portrait.first.get_attribute("height")))
        check("portrait has alt text", bool((portrait.first.get_attribute("alt") or "").strip()))
    strip = pg.evaluate("""() => { const red = document.querySelector('.pv-hero__red'), s = document.querySelector('.pv-hero__strip');
      return red && s ? {gap: Math.abs(s.getBoundingClientRect().top - red.getBoundingClientRect().bottom),
                         n: s.querySelectorAll('.pv-hero__proof').length} : null; }""")
    check("proof strip of six numbers sits directly under the red block",
          bool(strip) and strip["n"] == 6 and strip["gap"] <= 1, str(strip))
    pg.locator(".pv-hero__strip").scroll_into_view_if_needed()
    pg.wait_for_timeout(2200)
    proofs = pg.evaluate("[...document.querySelectorAll('.pv-hero__proof .pv-count__n')].map(e => e.textContent.trim())")
    check("proof numbers settle on their final values", proofs == PROOFS, str(proofs))
    spoken = pg.evaluate("[...document.querySelectorAll('.pv-hero__proof .pv-count > .pv-vh')].map(e => e.textContent.trim())")
    check("each proof number is also available as static text for screen readers", spoken == PROOFS, str(spoken))
    scroll_to(pg, 0, 300)

    # ---------------- e. projects ----------------
    print("\nprojects")
    rows = pg.locator(".pv-proj__row")
    check("exactly four numbered project rows", rows.count() == 4, f"found {rows.count()}")
    nums = pg.evaluate("[...document.querySelectorAll('.pv-proj__row .pv-proj__num')].map(e => e.textContent.trim())")
    check("rows are numbered 001-004", nums == ["001", "002", "003", "004"], str(nums))
    names = pg.evaluate("[...document.querySelectorAll('.pv-proj__row h3')].map(e => e.textContent.trim())")
    check("rows are Quizzy, DaCode, Labora, CardioScreen in that order", names == PROJECTS, str(names))
    quizzy_status = pg.evaluate("(document.querySelector('.pv-proj__row .pv-proj__meta') || {}).textContent || ''")
    check('Quizzy status reads "In production"', quizzy_status.strip().startswith("In production"), quizzy_status)
    for i in range(rows.count()):
        row = rows.nth(i)
        row.scroll_into_view_if_needed()
        img = row.locator(".pv-proj__frame img").first
        try:
            img.evaluate("el => el.complete && el.naturalWidth > 0 || new Promise(res => { el.addEventListener('load', res, {once: true}); setTimeout(res, 6000); })")
        except Exception:
            pass
        nm = (row.locator("h3").first.text_content() or f"row {i}").strip() if row.locator("h3").count() else f"row {i}"
        check(f"{nm}: framed screenshot loaded", row.locator(".pv-proj__frame img").count() == 1 and img.evaluate("el => el.naturalWidth > 0"))
        check(f"{nm}: image alt is non-empty", row.locator(".pv-proj__frame img").count() == 1 and bool((img.get_attribute("alt") or "").strip()))
        check(f"{nm}: has exactly one h3", row.locator("h3").count() == 1)
        nb = row.locator(".pv-proj__bullets > li").count()
        check(f"{nm}: 2-3 bullets", 2 <= nb <= 3, f"found {nb}")
        nt = row.locator(".pv-proj__tags .pv-tag").count()
        check(f"{nm}: 4-6 tags", 4 <= nt <= 6, f"found {nt}")
        check(f"{nm}: a link or the private marker",
              row.locator(".pv-proj__links a[href]").count() >= 1 or row.locator(".pv-proj__private").count() >= 1)
    more = pg.locator(".pv-proj__more-item")
    check('five "More work" items', more.count() == 5, f"found {more.count()}")
    more_head = pg.evaluate("(document.querySelector('.pv-proj__more-title') || {}).textContent || ''")
    check('"More work" heading is present', more_head.strip() == "More work", more_head)
    thin = pg.evaluate("""() => [...document.querySelectorAll('.pv-proj__more-item')]
      .filter(li => !(li.querySelector('.pv-proj__more-name') || {}).textContent || !(li.querySelector('.pv-proj__more-summary') || {}).textContent
                    || li.querySelectorAll('.pv-tag').length < 1).length""")
    check("every More work item has a name, a summary and tags", thin == 0, f"{thin} incomplete")
    gh = pg.evaluate("""() => { const a = document.querySelector('.pv-proj__cta a');
      return a ? {href: a.getAttribute('href'), text: a.textContent.trim(), rel: a.getAttribute('rel')} : null; }""")
    check('"More on GitHub" button links to GitHub with rel=noopener',
          bool(gh) and "github.com" in (gh["href"] or "") and gh["text"] == "More on GitHub" and "noopener" in (gh["rel"] or ""), str(gh))

    # ---------------- f. experience, skills, about, contact ----------------
    print("\nexperience / skills / about / contact")
    body_text = pg.evaluate("document.body.textContent") or ""
    n_items = pg.locator("#experience ol > li").count()
    check("three timeline items", n_items == 3, f"found {n_items}")
    n_cards = pg.locator("#experience .pv-exp__card").count()
    kickers = pg.evaluate("[...document.querySelectorAll('#experience .pv-exp__kicker')].map(e => e.textContent.trim())")
    check("black cards after the timeline: education, honours, certificates",
          n_cards == 5 and kickers[0] == "Education" and "Competitive programming" in kickers and kickers.count("Certificates") == 3, str(kickers))
    card_bg = pg.evaluate("getComputedStyle(document.querySelector('#experience .pv-exp__card')).backgroundColor")
    check("experience cards are black", sum(int(n) for n in re.findall(r"\d+", card_bg)[:3]) < 90, card_bg)
    check('"Expected June 2027" is present', "Expected June 2027" in body_text)
    n_groups = pg.locator("#skills h3").count()
    check("exactly four skill groups", n_groups == 4, f"found {n_groups}")
    check("four chip cards", pg.locator("#skills .pv-skills__card").count() == 4)
    langs = pg.evaluate("""() => { const g = [...document.querySelectorAll('#skills .pv-skills__card')]
        .find(c => /^\\s*languages/i.test((c.querySelector('h3') || {}).textContent || ''));
      return g ? [...g.querySelectorAll('.pv-skills__chip')].map(c => c.firstChild && c.textContent.replace(/\\(.*\\)/, '').trim()) : null; }""")
    check("Languages group includes Rust", bool(langs) and "Rust" in langs, str(langs))
    rust = pg.evaluate("""() => { const c = [...document.querySelectorAll('#skills .pv-skills__chip')]
        .find(c => c.textContent.replace(/\\(.*\\)/, '').trim() === 'Rust');
      return c ? {dot: !!c.querySelector('.pv-skills__dot[aria-hidden="true"]'), hidden: (c.querySelector('.pv-vh') || {}).textContent || ''} : null; }""")
    check("Rust chip carries the used-in marker and a visually hidden note naming DaCode",
          bool(rust) and rust["dot"] and re.search(r"used in .*DaCode", rust["hidden"], re.I) is not None, str(rust))
    plain = pg.evaluate("""() => { const c = [...document.querySelectorAll('#skills .pv-skills__chip')]
        .find(c => c.textContent.trim() === 'Bash');
      return c ? {dot: !!c.querySelector('.pv-skills__dot'), vh: !!c.querySelector('.pv-vh')} : null; }""")
    check("a chip not used in a featured project has no marker and no hidden note",
          bool(plain) and not plain["dot"] and not plain["vh"], str(plain))
    check("skills legend explains the marker", pg.locator("#skills .pv-skills__legend").count() == 1)
    check("no progress / meter / progressbar anywhere", pg.locator("progress, meter, [role=progressbar]").count() == 0)
    paras = pg.locator("#about p:not(.pv-label)")
    check("about is one paragraph", paras.count() == 1, f"found {paras.count()}")
    if paras.count():
        txt = re.sub(r"\s+", " ", (paras.first.text_content() or "")).strip()
        sentences = re.findall(r"[^.!?]+[.!?]+(?=\s|$)", txt)
        check("about paragraph has 3-4 sentences", 3 <= len(sentences) <= 4, f"found {len(sentences)}")
    check("about has a closing quote", pg.locator("#about blockquote").count() == 1)
    check("no <form> on the page", pg.locator("form").count() == 0)

    mail = pg.locator('#contact a[href^="mailto:"]')
    check("contact has one mailto link", mail.count() == 1, f"found {mail.count()}")
    copy_btn = pg.locator("#contact").get_by_role("button", name=re.compile(r"copy email", re.I))
    check("contact has a Copy email button", copy_btn.count() == 1)
    status = pg.locator('#contact [role="status"]')
    check("contact has a live region for the copy result", status.count() == 1)
    others = pg.evaluate("""() => { const q = s => document.querySelector('#contact ' + s);
      const g = q('a[href*="github.com"]'), l = q('a[href*="linkedin.com"]'), r = q('a[href$=".pdf"]'), t = q('a[href^="tel:"]');
      return {github: !!g, linkedin: !!l, resume: !!r, phone: !!t && /\\d/.test(t.textContent)}; }""")
    check("contact card also has GitHub, LinkedIn, résumé PDF and phone links", all(others.values()), str(others))
    if mail.count() == 1 and copy_btn.count() == 1:
        ctx.grant_permissions(["clipboard-read", "clipboard-write"])
        address = re.sub(r"^mailto:", "", (mail.first.get_attribute("href") or "")).split("?")[0]
        copy_btn.scroll_into_view_if_needed()
        copy_btn.click()
        try:
            pg.wait_for_function(
                "() => /^copied$/i.test(((document.querySelector('#contact .pv-contact__lbl') || {}).textContent || '').trim())", timeout=3000)
            became = True
        except Exception:
            became = False
        check('button text becomes "Copied"', became, (copy_btn.text_content() or "").strip())
        live = (status.first.text_content() or "").strip()
        check('live region announces "Copied"', live.lower() == "copied", live)
        try:
            clip = pg.evaluate("navigator.clipboard.readText()")
        except Exception as e:
            clip = f"<unreadable: {str(e)[:60]}>"
        check("clipboard text equals the mailto address", clip == address, "clipboard did not match the mailto href")
        pg.wait_for_timeout(2400)
        check('button text returns to "Copy email"',
              (pg.locator("#contact .pv-contact__lbl").first.text_content() or "").strip().lower() == "copy email")

    # ---------------- g. links ----------------
    print("\nlinks")
    links = pg.evaluate("""() => [...document.querySelectorAll('a')].map(a => ({
      href: a.getAttribute('href'), rel: a.getAttribute('rel') || '' }))""")
    check('no a[href="#"]', not any(l["href"] == "#" for l in links))
    check("no empty or missing hrefs", not any(not (l["href"] or "").strip() for l in links))
    bad_ext = [l["href"] for l in links
               if re.match(r"^[a-z][a-z0-9+.-]*:", l["href"] or "", re.I)
               and not re.match(r"^(mailto|tel):", l["href"], re.I)
               and (not l["href"].startswith("https://") or "noopener" not in l["rel"])]
    check("external links are https with rel=noopener", not bad_ext, str(bad_ext[:3]))
    missing = pg.evaluate("""() => [...document.querySelectorAll('a[href^="#"]')]
      .map(a => a.getAttribute('href')).filter(h => h.length > 1 && !document.getElementById(h.slice(1)))""")
    check("every in-page anchor points at an existing id", not missing, str(missing))
    gates = pg.evaluate("""() => ({card: !!document.querySelector('.pv-hero a.pv-gate--card[href="/universe/"]'),
      sw: !!document.querySelector('.pv-nav .pv-gate--switch a[href="/universe/"]'),
      line: !!document.querySelector('#contact .pv-gate--line a[href="/universe/"]')})""")
    check("universe links exist in the hero card, the nav switch and the contact closing line", all(gates.values()), str(gates))
    r = pg.request.get(UNIVERSE_URL)
    check("/universe/ responds 200", r.status == 200, f"status {r.status}")

    # ---------------- h. performance ----------------
    print("\nperformance")
    scroll_bottom(pg, 500)
    pg.wait_for_load_state("networkidle")
    heavy = [u for u in requests if re.search(r"three|postfx|@react-three|/src/scene/|universe-[\w-]+\.js", u, re.I)]
    check("no three.js / postfx / scene / universe chunk requests", not heavy, str(heavy[:3]))
    check("no canvas in the DOM", pg.locator("canvas").count() == 0)
    ctx.close()

    # ---------------- i. nav at narrower widths ----------------
    print("\nnav 1000x800 and 800x900")
    ctx, pg = open_page(b, 1000, 800)
    load(pg)
    check("no menu button at 1000", menu_vis(pg) == 0)
    ctx.close()

    ctx, pg = open_page(b, 800, 900)
    load(pg)
    check("menu button visible at 800", menu_vis(pg) == 1)
    btn = pg.locator(".pv-nav button[aria-expanded]").first
    if btn.count():
        sheet_id = btn.get_attribute("aria-controls") or ""
        sheet_state = lambda: pg.evaluate("""(id) => { %s
          const s = document.getElementById(id); return !!s && vis(s) && !s.inert; }""" % VISIBLE_JS, sheet_id)
        check("sheet is closed and inert before the menu is opened",
              btn.get_attribute("aria-expanded") == "false" and not sheet_state())
        btn.click()
        pg.wait_for_timeout(500)
        opened = btn.get_attribute("aria-expanded") == "true"
        sheet_ok = sheet_state()
        check("menu button opens the sheet", opened and sheet_ok, f"expanded={opened} sheet={sheet_ok}")
        sheet_links = pg.evaluate("(id) => [...document.querySelectorAll('#' + id + ' nav a')].map(a => a.getAttribute('href'))", sheet_id)
        check("sheet lists the four section links", sorted(sheet_links) == sorted(["#projects", "#experience", "#skills", "#about"]), str(sheet_links))
        pg.keyboard.press("Escape")
        pg.wait_for_timeout(500)
        closed = btn.get_attribute("aria-expanded") == "false"
        check("Escape closes the sheet", closed)
        check("focus returns to the menu button after Escape", pg.evaluate("document.activeElement === document.querySelector('.pv-nav button[aria-expanded]')"))
        btn.click()
        pg.wait_for_timeout(400)
        pg.locator(f"#{sheet_id} nav a").first.click()
        pg.wait_for_timeout(500)
        check("choosing a sheet link closes the sheet", btn.get_attribute("aria-expanded") == "false")
    ctx.close()

    # ---------------- j. responsive ----------------
    print("\nresponsive")
    sizes = [(360, 740), (768, 1024), (1000, 800), (1280, 720), (960, 540), (770, 432), (1440, 900), (1920, 1080)]
    layout_js = """() => { %s
      const box = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; };
      const sels = {h1: '.pv-hero h1', status: '.pv-hero__status', blurb: '.pv-hero__blurb', lead: '.pv-hero .pv-lead',
        primary: '.pv-hero .pv-btn--primary', ghost: '.pv-hero .pv-btn--ghost', card: '.pv-hero .pv-gate--card',
        mini: '.pv-hero__mini', socials: '.pv-hero__socials'};
      const blocks = {};
      for (const [k, s] of Object.entries(sels)) { const e = document.querySelector(s); if (e && vis(e)) blocks[k] = box(e); }
      const nav = document.querySelector('.pv-nav');
      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        blocks, nav: nav ? box(nav) : null, vh: window.innerHeight,
      }; }""" % VISIBLE_JS
    for w, h in sizes:
        ctx, pg = open_page(b, w, h)
        load(pg, 2200)   # past the hero's load sequence, so boxes are at rest
        m = pg.evaluate(layout_js)
        check(f"{w}x{h}: no horizontal overflow", m["overflow"] <= 1, f"scrollWidth exceeds viewport by {m['overflow']}px")
        blocks = m["blocks"]
        check(f"{w}x{h}: hero name, blurb and CTAs are visible", all(k in blocks for k in ("h1", "blurb", "primary", "ghost")), str(list(blocks)))
        keys = list(blocks)
        clash = [f"{a}/{c}" for i, a in enumerate(keys) for c in keys[i + 1:] if hits(blocks[a], blocks[c])]
        check(f"{w}x{h}: hero text, buttons, card and socials do not overlap each other", not clash, str(clash))
        if (w, h) in [(1440, 900), (1280, 720), (960, 540)] and m["nav"]:
            t_n = [k for k, v in blocks.items() if hits(v, m["nav"])]
            check(f"{w}x{h}: nav bar does not meet the hero content", not t_n, str(t_n))
        if (w, h) in [(1440, 900), (1280, 720)]:
            check(f"{w}x{h}: universe card is shown beside the text", "card" in blocks)
        if (w, h) == (1280, 720):
            hd = blocks.get("h1")
            check("1280x720: h1 inside the first viewport", bool(hd) and hd["b"] <= m["vh"], f"h1 bottom {hd and round(hd['b'])} > {m['vh']}")
            for k in ("primary", "ghost"):
                bx = blocks.get(k)
                check(f"1280x720: {k} CTA inside the first viewport", bool(bx) and bx["b"] <= m["vh"],
                      f"bottom {bx and round(bx['b'])} > {m['vh']}")
        ctx.close()

    # ---------------- k. behaviour ----------------
    print("\nbehaviour")
    ctx, pg = open_page(b, 1280, 800)
    load(pg)
    pg.mouse.move(640, 400)
    pg.mouse.wheel(0, 700)
    pg.wait_for_timeout(900)
    y = pg.evaluate("window.scrollY")
    check("mouse wheel moves scrollY (no scroll-jacking)", y > 0, f"scrollY={y}")
    us = pg.evaluate("getComputedStyle(document.body).userSelect")
    check("body user-select is not none", us != "none", us)
    ctx.close()

    # Reversible scroll reveals: in view -> is-in, below the viewport -> removed, above it -> kept.
    ctx, pg = open_page(b, 1280, 800)
    load(pg, 600)
    has_in = lambda sel: pg.evaluate("(s) => document.querySelector(s).classList.contains('is-in')", sel)
    check("a reveal far below the fold is not shown yet", not has_in("#contact .pv-contact__card"))
    pg.evaluate("document.querySelector('#projects .pv-proj__frame').scrollIntoView({block: 'center', behavior: 'instant'})")
    pg.wait_for_timeout(1200)
    check("a reveal scrolled into view gets .is-in", has_in("#projects .pv-proj__frame"))
    scroll_bottom(pg, 1300)
    check("the contact card gets .is-in at the bottom of the page", has_in("#contact .pv-contact__card"))
    above_missing = pg.evaluate("""() => [...document.querySelectorAll('.pv-rv')]
      .filter(e => e.getBoundingClientRect().bottom <= 0 && !e.classList.contains('is-in')).length""")
    check("every .pv-rv above the viewport keeps .is-in after scrolling to the bottom", above_missing == 0, f"{above_missing} missing")
    in_view_missing = pg.evaluate("""() => [...document.querySelectorAll('.pv-rv')]
      .filter(e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight * 0.88 && r.height > 0 && !e.classList.contains('is-in'); }).length""")
    check("every .pv-rv fully in view has .is-in", in_view_missing == 0, f"{in_view_missing} missing")
    scroll_to(pg, 0, 1300)
    check("scrolling back up removes .is-in from reveals now below the viewport", not has_in("#contact .pv-contact__card"))
    pg.evaluate("document.querySelector('#about').scrollIntoView({behavior: 'instant'})")
    pg.wait_for_timeout(1200)
    check("reveals above the viewport keep .is-in", has_in("#projects .pv-proj__frame"))
    ctx.close()

    # Hero entrance replays when the reader comes back to it.
    ctx, pg = open_page(b, 1440, 900)
    load(pg, 3200)
    reset = lambda: pg.evaluate("document.querySelector('.pv-hero__red').classList.contains('pv-hero--reset')")
    h1_op = lambda: pg.evaluate("parseFloat(getComputedStyle(document.querySelector('.pv-hero h1')).opacity)")
    check("hero is shown (not reset) after the first entrance", not reset() and h1_op() == 1)
    scroll_bottom(pg, 900)
    check("with the hero fully scrolled away its entrance pieces are held back (pv-hero--reset)", reset())
    check("held hero name is at opacity 0", h1_op() == 0, str(h1_op()))
    scroll_to(pg, 0, 3000)
    check("scrolling back to the hero replays the entrance (reset class dropped)", not reset())
    check("replayed hero name is fully visible again", h1_op() == 1, str(h1_op()))
    ctx.close()

    # Universe links run the cover before navigating.
    uctx = b.new_context(viewport={"width": 1440, "height": 900})
    upg = uctx.new_page()
    upg.goto(PRO_URL, wait_until="networkidle")
    upg.wait_for_function("() => !document.documentElement.classList.contains('pv-intro')", timeout=10000)
    upg.wait_for_timeout(1500)
    upg.locator(".pv-hero .pv-gate--card").click(no_wait_after=True)
    try:
        upg.wait_for_selector(".pv-wipe.is-covering", state="attached", timeout=1500)
        covered = True
    except Exception:
        covered = False
    check("clicking the universe card starts the cover (.pv-wipe.is-covering)", covered)
    check("the page has not navigated yet when the cover starts", "/universe" not in upg.url, upg.url)
    try:
        upg.wait_for_url(re.compile(r"/universe/?$"), timeout=8000, wait_until="commit")
        went = True
    except Exception:
        went = False
    check("the cover then navigates to /universe/", went, upg.url)
    uctx.close()

    # Reduced motion: no intro cover, everything visible at once, hero never held back.
    ctx, pg = open_page(b, 1280, 800, reduced_motion="reduce")
    load(pg, 300)
    opac = pg.evaluate("""() => [...document.querySelectorAll('.pv-rv')]
      .map(e => parseFloat(getComputedStyle(e).opacity)).filter(o => o !== 1).length""")
    n_rv = pg.locator(".pv-rv").count()
    check("reduced motion: every .pv-rv is opaque without scrolling", n_rv > 0 and opac == 0, f"{opac} of {n_rv} not opaque")
    not_in = pg.evaluate("document.querySelectorAll('.pv-rv:not(.is-in)').length")
    check("reduced motion: every .pv-rv already has .is-in", not_in == 0, f"{not_in} without")
    check("reduced motion: no entry cover class and the cover is not displayed",
          pg.evaluate("!document.documentElement.classList.contains('pv-intro') && getComputedStyle(document.querySelector('.pv-wipe')).display === 'none'"))
    scroll_bottom(pg, 600)
    scroll_to(pg, 0, 800)
    check("reduced motion: hero is never held back after scrolling away and back",
          not pg.evaluate("document.querySelector('.pv-hero__red').classList.contains('pv-hero--reset')")
          and pg.evaluate("parseFloat(getComputedStyle(document.querySelector('.pv-hero h1')).opacity)") == 1)
    ctx.close()
    # JavaScript disabled is skipped: the dev server serves an empty #root. Run it against a production build (see README).

    # ---------------- l. accessibility basics ----------------
    print("\naccessibility")
    ctx, pg = open_page(b, 1440, 900)
    load(pg)
    no_alt = pg.evaluate("[...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).length")
    check("every img has an alt attribute", no_alt == 0, f"{no_alt} without")
    unnamed = pg.evaluate("""() => { %s
      return [...document.querySelectorAll('a, button')].filter(e => !nameOf(e)).map(e => e.outerHTML.slice(0, 80)); }""" % NAME_JS)
    check("every link and button has an accessible name", not unnamed, str(unnamed[:3]))
    levels = pg.evaluate("[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => +h.tagName[1])")
    skips = [(a, c) for a, c in zip(levels, levels[1:]) if c > a + 1]
    check("heading levels never skip", bool(levels) and levels[0] == 1 and not skips, f"levels {levels}")
    landmarks = pg.evaluate("""() => ({header: document.querySelectorAll('header.pv-nav').length, main: document.querySelectorAll('main').length,
      footer: document.querySelectorAll('footer').length, navs: [...document.querySelectorAll('nav')].map(n => n.getAttribute('aria-label'))})""")
    check("landmarks: one header, one main, one footer, every nav labelled",
          landmarks["header"] == 1 and landmarks["main"] == 1 and landmarks["footer"] == 1 and all(landmarks["navs"]), str(landmarks))
    ctx.close()

    ctx, pg = open_page(b, 375, 812, is_mobile=True, has_touch=True, device_scale_factor=2)
    load(pg, 1500)
    check("375x812: menu button visible and no horizontal overflow",
          menu_vis(pg) == 1 and pg.evaluate("document.documentElement.scrollWidth - innerWidth") <= 1)
    small = pg.evaluate("""() => { %s
      const sel = ['.pv-nav a', '.pv-nav button', '.pv-hero .pv-btn--primary', '.pv-hero .pv-btn--ghost', '#contact a', '#contact button'];
      const seen = new Set(), out = [];
      for (const e of document.querySelectorAll(sel.join(','))) {
        if (seen.has(e) || !vis(e)) continue; seen.add(e);
        const r = e.getBoundingClientRect();
        if (r.width < 43.5 || r.height < 43.5)
          out.push((e.getAttribute('aria-label') || e.textContent || e.className).trim().slice(0, 30) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      }
      return {small: out, n: seen.size}; }""" % VISIBLE_JS)
    check("375x812 touch: nav, hero CTA and contact targets are at least 44x44", small["n"] > 0 and not small["small"], str(small["small"][:4]))
    ctx.close()

    b.close()

# ---------------- m. errors ----------------
print("\nerrors")
check("no console errors and no page errors across the run", not errors, "; ".join(errors[:3]))

print(f"\n{'ALL PASS' if not failures else str(len(failures)) + ' FAILED'}")
for f in failures:
    print("  -", f)
sys.exit(1 if failures else 0)
