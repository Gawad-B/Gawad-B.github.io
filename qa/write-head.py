#!/usr/bin/env python3
"""
Write index.html, sitemap.xml and robots.txt from /tmp/head.json.

The head is generated from src/data rather than hand-maintained, so the
title, description and JSON-LD cannot drift out of sync with the content
the site actually renders. Run via qa/build-head.sh.
"""
import json

d = json.load(open('/tmp/head.json'))
desc, jsonld, site = d['description'], d['jsonld'], d['site']
jsonld_indented = "\n".join("      " + line for line in jsonld.splitlines())

html = f'''<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

    <title>Abdelrahman Gawad — Healthcare AI Engineer &amp; Full-Stack Developer</title>
    <meta name="description" content="{desc}" />
    <link rel="canonical" href="{site}/" />
    <meta name="author" content="Abdelrahman Gawad" />
    <meta name="theme-color" content="#04060b" />
    <meta name="color-scheme" content="dark" />

    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/assets/profile.jpg" />

    <!-- Open Graph -->
    <meta property="og:type" content="profile" />
    <meta property="og:title" content="Abdelrahman Gawad — Healthcare AI Engineer &amp; Full-Stack Developer" />
    <meta property="og:description" content="{desc}" />
    <meta property="og:url" content="{site}/" />
    <meta property="og:image" content="{site}/og.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="A red hypergiant in deep space, with the name Abdelrahman Gawad overlaid" />
    <meta property="og:site_name" content="Abdelrahman Gawad" />
    <meta property="profile:first_name" content="Abdelrahman" />
    <meta property="profile:last_name" content="Gawad" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Abdelrahman Gawad — Healthcare AI Engineer" />
    <meta name="twitter:description" content="{desc}" />
    <meta name="twitter:image" content="{site}/og.png" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />

    <script type="application/ld+json">
{jsonld_indented}
    </script>
  </head>

  <body>
    <div id="root"></div>
    <noscript>
      <div style="max-width:42rem;margin:4rem auto;padding:0 1.5rem;font-family:system-ui,sans-serif;color:#aeb8c9;background:#04060b">
        <h1 style="color:#f2f5fa;font-weight:300">Abdelrahman Gawad</h1>
        <p>Healthcare AI Engineer · Full-Stack Developer · Linux Enthusiast · Competitive Programmer</p>
        <p>Alexandria, Egypt · CS at Egypt-Japan University of Science and Technology.</p>
        <p>This portfolio is an interactive 3D universe and needs JavaScript. You can still reach me directly:</p>
        <ul>
          <li><a style="color:#ffb35c" href="mailto:abdelrahman.gawad.28@gmail.com">abdelrahman.gawad.28@gmail.com</a></li>
          <li><a style="color:#ffb35c" href="tel:+201027321793">+20 102 732 1793</a></li>
          <li><a style="color:#ffb35c" href="https://github.com/Gawad-B">github.com/Gawad-B</a></li>
          <li><a style="color:#ffb35c" href="https://linkedin.com/in/abdelrahman-gawad-3536302bb">LinkedIn</a></li>
        </ul>
      </div>
    </noscript>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
'''
open('index.html', 'w').write(html)

open('public/robots.txt', 'w').write(
    f"User-agent: *\nAllow: /\n\nSitemap: {site}/sitemap.xml\n"
)

open('public/sitemap.xml', 'w').write(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    f'  <url>\n    <loc>{site}/</loc>\n'
    '    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>\n'
    '</urlset>\n'
)
print("wrote index.html, public/robots.txt, public/sitemap.xml")
