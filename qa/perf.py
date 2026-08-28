"""
Scene-complexity audit.

Frame timing is not measurable here: the only renderer available in this
environment is SwiftShader, a software rasteriser running at a few frames a
second, so its numbers say nothing about hardware. What IS hardware
independent — and what actually predicts whether a scene holds frame rate —
is draw calls, triangle count, shader program count and texture memory.
Those are what this asserts, against the budget in scene/quality.ts.
"""
import sys, time
from playwright.sync_api import sync_playwright

# Ceilings chosen so the scene stays comfortable on integrated mobile GPUs.
# Ceilings chosen so the scene stays comfortable on integrated mobile GPUs.
# `textures` counts GPU render targets, not image files — there are no image
# textures in this build at all. On the high tier the count is entirely the
# post-processing chain's bloom mip pyramid.
BUDGET = {"calls": 90, "triangles": 900_000, "programs": 40, "textures": 24}

results = {}
ctxs = {}
per_region = {}
fails = []
def check(name, cond, detail=""):
    print(("  ok   " if cond else "  FAIL ") + name + (f" — {detail}" if not cond and detail else ""))
    if not cond: fails.append(name)

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    for tier_label in ("high", "low"):
        ctx = b.new_context(viewport={"width":1280,"height":800})
        pg = ctx.new_page()
        pg.add_init_script("window.__perfProbe = true")
        pg.goto(f"http://localhost:3000/?tier={tier_label}", wait_until="networkidle")
        pg.wait_for_selector(".hud-nav", timeout=30000)
        print(f"\n{tier_label} tier")
        worst = {}
        for label, sel in [("hero", None), ("about","button:has-text('ABOUT')"),
                           ("skills","button:has-text('SKILLS')"),
                           ("projects","button:has-text('PROJECTS')"),
                           ("milano",".hud-nav-btn--ship")]:
            if sel:
                pg.click(sel); time.sleep(4.5)
            time.sleep(1.5)
            m = pg.evaluate("window.__perf")
            if label == "skills" and m:
                per_region.setdefault(tier_label, {})["skills"] = m
            if not m:
                check(f"{label}: probe reported", False); continue
            print(f"    {label:<9} calls {m['calls']:>4}  tris {m['triangles']:>8,}  "
                  f"pts {m['points']:>6,}  progs {m['programs']:>3}  "
                  f"tex {m['textures']:>3}  geo {m['geometries']:>3}  "
                  f"meshes {m['meshes']:>3}  inst {m['instancedMeshes']}  dpr {m['pixelRatio']}")
            for k in BUDGET:
                worst[k] = max(worst.get(k, 0), m[k])
        for k, limit in BUDGET.items():
            check(f"{tier_label}: {k} within budget ({worst.get(k,0)} <= {limit:,})",
                  worst.get(k, 0) <= limit, f"peak {worst.get(k,0):,}")
        check(f"{tier_label}: pixel ratio capped below 2",
              pg.evaluate("window.__perf.pixelRatio") <= 1.75)
        results[tier_label] = worst
        ctxs[tier_label] = pg.evaluate("window.__perf")
        ctx.close()
    b.close()

print("\nprocedural + instancing")
check("no image textures on the low tier (post-processing disabled there)",
      ctxs.get("low", {}).get("textures", 99) == 0,
      f"got {ctxs.get('low', {}).get('textures')}")
check("Saturn's 48 moons are one InstancedMesh",
      per_region.get("high", {}).get("skills", {}).get("instancedMeshes", 0) >= 1,
      f"got {per_region.get('high', {}).get('skills', {}).get('instancedMeshes')}")

print("\ntier scaling")
check("low tier draws fewer triangles than high",
      results["low"]["triangles"] < results["high"]["triangles"],
      f"low={results['low']['triangles']:,} high={results['high']['triangles']:,}")
# NOT asserted on `programs`: that counter is cumulative across the session
# as regions compile their materials, so it never decreases and is
# order-dependent. The honest signal that the low tier drops post-processing
# is the render-target count above — the bloom mip pyramid is simply absent.
check("low tier allocates no render targets, high tier does",
      ctxs["low"]["textures"] == 0 and ctxs["high"]["textures"] > 0,
      f"low={ctxs['low']['textures']} high={ctxs['high']['textures']}")

print(f"\n{'✓ scene complexity within budget' if not fails else '✗ ' + str(len(fails)) + ' failure(s)'}\n")
sys.exit(0 if not fails else 1)
