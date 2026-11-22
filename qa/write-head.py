#!/usr/bin/env python3
"""
Write index.html (professional view), universe/index.html, sitemap.xml and
robots.txt from /tmp/head.json.

Both heads are generated from src/data (via qa/gen-head.ts) rather than
hand-maintained, so titles, descriptions, JSON-LD and the noscript contact
details cannot drift out of sync with the content the site actually renders.
This file holds no email address or phone number: they come from the JSON.
Run via qa/build-head.sh.
"""
import json
import os
from html import escape

d = json.load(open('/tmp/head.json'))
site, contact = d['site'], d['contact']


def e(s):
    return escape(s, quote=True)


def indent_jsonld(jsonld):
    return "\n".join("      " + line for line in jsonld.splitlines())


def head_common(p, theme, scheme='dark', icon='/favicon.svg'):
    """Meta, Open Graph and Twitter block shared by both pages."""
    title, desc = e(p['title']), e(p['description'])
    return f'''    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

    <title>{title}</title>
    <meta name="description" content="{desc}" />
    <link rel="canonical" href="{e(p['canonical'])}" />
    <meta name="author" content="Abdelrahman Gawad" />
    <meta name="theme-color" content="{theme}" />
    <meta name="color-scheme" content="{scheme}" />

    <link rel="icon" type="image/svg+xml" href="{icon}" />
    <link rel="apple-touch-icon" href="/assets/profile.jpg" />

    <!-- Open Graph -->
    <meta property="og:type" content="profile" />
    <meta property="og:title" content="{title}" />
    <meta property="og:description" content="{desc}" />
    <meta property="og:url" content="{e(p['canonical'])}" />
    <meta property="og:image" content="{e(p['ogImage'])}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="{e(p['ogImageAlt'])}" />
    <meta property="og:site_name" content="Abdelrahman Gawad" />
    <meta property="profile:first_name" content="Abdelrahman" />
    <meta property="profile:last_name" content="Gawad" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{e(p['twitterTitle'])}" />
    <meta name="twitter:description" content="{desc}" />
    <meta name="twitter:image" content="{e(p['ogImage'])}" />
'''


PRO_FONTS = (
    'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400..800&display=swap'
)
UNIVERSE_FONTS = (
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400'
    '&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap'
)


def fonts_link(href):
    return f'''    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="{href}"
      rel="stylesheet"
    />
'''


# --- professional view: `/` ---------------------------------------------------
# The page-change wipe: five black columns. It is static HTML with inline CSS (not React) so that
# on entry it covers the screen from the very first paint, before any stylesheet or script has
# loaded (the dev server serves no prerendered markup and delivers CSS through JavaScript).
# html.pv-intro (head script) = covered; + html.pv-open (src/pro/hooks/wipe.ts startIntro) = opening;
# .pv-wipe.is-covering (wipeTo) = covering before leaving the page.
_WIPE_EASE = 'cubic-bezier(.32,.72,0,1)'
_WIPE_TRANSITION = f'transform 420ms {_WIPE_EASE} calc(var(--i) * 60ms)'
PRO_WIPE_STYLE = (
    '    <style>'
    '.pv-wipe{position:fixed;inset:0;z-index:90;display:flex;pointer-events:none}'
    '.pv-wipe.is-covering{pointer-events:auto}'
    '.pv-wipe>span{flex:1;background:#111;outline:1px solid #111;transform:scaleY(0);'
    f'transform-origin:bottom;transition:{_WIPE_TRANSITION}}}'
    '.pv-wipe.is-covering>span{transform:scaleY(1)}'
    'html.pv-intro .pv-wipe>span{transform:scaleY(1);transform-origin:top;transition:none}'
    f'html.pv-intro.pv-open .pv-wipe>span{{transform:scaleY(0);transition:{_WIPE_TRANSITION}}}'
    '@media (prefers-reduced-motion:reduce){.pv-wipe{display:none}}'
    '@media print{.pv-wipe{display:none}}'
    '</style>'
)
PRO_WIPE_HTML = (
    '    <div class="pv-wipe" aria-hidden="true">'
    + ''.join(f'<span style="--i:{i}"></span>' for i in range(5))
    + '</div>'
)

# The marker inside #root is replaced by the prerender step (scripts/prerender.mjs).
pro = d['pro']
pro_html = f'''<!DOCTYPE html>
<html lang="en">
  <head>
{head_common(pro, '#cf3b24', 'light', '/favicon-pro.svg')}
{fonts_link(PRO_FONTS)}
{PRO_WIPE_STYLE}
    <script>(function(){{var h=document.documentElement;h.classList.add('pv-js');var t='navigate';try{{var n=performance.getEntriesByType('navigation')[0];if(n&&n.type)t=n.type}}catch(e){{}}var m=false;try{{m=matchMedia('(prefers-reduced-motion: reduce)').matches}}catch(e){{}}if(!m&&t!=='back_forward')h.classList.add('pv-intro');setTimeout(function(){{if(!window.__pvBooted)h.classList.remove('pv-js','pv-intro','pv-open')}},3000)}})();</script>

    <script type="application/ld+json">
{indent_jsonld(pro['jsonld'])}
    </script>
  </head>

  <body>
{PRO_WIPE_HTML}
    <div id="root"><!--pv-ssr--></div>
    <script type="module" src="/src/pro/main.tsx"></script>
  </body>
</html>
'''
open('index.html', 'w').write(pro_html)

# --- universe: `/universe/` ---------------------------------------------------
uni = d['universe']
noscript = f'''    <noscript>
      <div style="max-width:42rem;margin:4rem auto;padding:0 1.5rem;font-family:system-ui,sans-serif;color:#aeb8c9;background:#04060b">
        <h1 style="color:#f2f5fa;font-weight:300">Abdelrahman Gawad</h1>
        <p>{e(d['tagline'])}</p>
        <p>{e(d['location'])}</p>
        <p>This portfolio is an interactive 3D universe and needs JavaScript. You can still reach me directly:</p>
        <ul>
          <li><a style="color:#ffb35c" href="mailto:{e(contact['email'])}">{e(contact['email'])}</a></li>
          <li><a style="color:#ffb35c" href="tel:{e(contact['phone'])}">{e(contact['phoneDisplay'])}</a></li>
          <li><a style="color:#ffb35c" href="{e(contact['github'])}">github.com/{e(contact['githubHandle'])}</a></li>
          <li><a style="color:#ffb35c" href="{e(contact['linkedin'])}">LinkedIn</a></li>
        </ul>
      </div>
    </noscript>
'''
uni_html = f'''<!DOCTYPE html>
<html lang="en">
  <head>
{head_common(uni, '#04060b')}
{fonts_link(UNIVERSE_FONTS)}
    <script type="application/ld+json">
{indent_jsonld(uni['jsonld'])}
    </script>
  </head>

  <body>
    <div id="root"></div>
{noscript}    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
'''
os.makedirs('universe', exist_ok=True)
open('universe/index.html', 'w').write(uni_html)

# --- crawlers -----------------------------------------------------------------
open('public/robots.txt', 'w').write(
    f"User-agent: *\nAllow: /\n\nSitemap: {site}/sitemap.xml\n"
)

open('public/sitemap.xml', 'w').write(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    f'  <url>\n    <loc>{pro["canonical"]}</loc>\n'
    '    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>\n'
    f'  <url>\n    <loc>{uni["canonical"]}</loc>\n'
    '    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n'
    '</urlset>\n'
)
print("wrote index.html, universe/index.html, public/robots.txt, public/sitemap.xml")
