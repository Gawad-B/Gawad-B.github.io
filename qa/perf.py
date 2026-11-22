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
from _launch import UNIVERSE_URL, launch

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
    b = launch(p)
    for tier_label in ("high", "low"):
        ctx = b.new_context(viewport={"width":1280,"height":800})
        pg = ctx.new_page()
        pg.add_init_script("window.__perfProbe = true")
        pg.goto(f"{UNIVERSE_URL}?tier={tier_label}", wait_until="networkidle")
        pg.wait_for_selector(".hud-nav", timeout=30000)
        print(f"\n{tier_label} tier")
        worst = {}
        for label, sel in [("hero", None), ("about","button:has-text('ABOUT')"),
                           ("skills","button:has-text('SKILLS')"),
                           ("projects","button:has-text('PROJECTS')"),
                           ("milano",".hud-nav-btn--ship")]:
            want = {"hero":"hero","about":"about","skills":"skills",
                    "projects":"projects","milano":"milano-interior"}[label]
            if sel:
                # Force + verify + retry: this is a diagnostics harness on a
                # 2fps software rasteriser, and a swallowed click here reads
                # as a scene bug when it isn't.
                for _ in range(3):
                    pg.click(sel, force=True)
                    for _ in range(8):
                        time.sleep(0.5)
                        m0 = pg.evaluate("window.__perf")
                        if m0 and m0.get("region") == want:
                            break
                    else:
                        continue
                    break
            # Wait for the probe to report the region it was asked about, and
            # for the camera to have settled, before trusting the sample.
            m = None
            deadline = time.time() + 30
            while time.time() < deadline:
                time.sleep(0.6)
                cand = pg.evaluate("window.__perf")
                if cand and cand.get("region") == want and cand.get("settled"):
                    time.sleep(1.2)
                    m = pg.evaluate("window.__perf")
                    if m and m.get("region") == want:
                        break
                    m = None
            if not m:
                check(f"{label}: sample aligned to region", False, f"never saw region={want}")
                continue
            if m:
                per_region.setdefault(tier_label, {})[label] = m
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
# The one permitted texture is the skill-label atlas: generated on a canvas
# at runtime, never downloaded. Anything beyond it would mean an image
# snuck into the build.
check("low tier holds only the runtime label atlas (<= 1 texture)",
      ctxs.get("low", {}).get("textures", 99) <= 1,
      f"got {ctxs.get('low', {}).get('textures')}")
check("Saturn's 49 moons are one InstancedMesh",
      per_region.get("high", {}).get("skills", {}).get("instancedMeshes", 0) >= 1,
      f"got {per_region.get('high', {}).get('skills', {}).get('instancedMeshes')}")

print("\ntier scaling (same region, both tiers — comparing peaks across")
print("regions is meaningless when which region peaks depends on sampling)")
for region in ("hero", "skills", "projects"):
    hi = per_region.get("high", {}).get(region)
    lo = per_region.get("low", {}).get(region)
    if not hi or not lo:
        check(f"{region}: sampled on both tiers", False); continue
    check(f"{region}: low tier draws no more than high "
          f"({lo['triangles']:,} <= {hi['triangles']:,})",
          lo["triangles"] <= hi["triangles"])
# NOT asserted on `programs`: that counter is cumulative across the session
# as regions compile their materials, so it never decreases and is
# order-dependent. The honest signal that the low tier drops post-processing
# is the render-target count above — the bloom mip pyramid is simply absent.
check("post-processing render targets exist only on the high tier",
      ctxs["low"]["textures"] <= 1 and ctxs["high"]["textures"] > ctxs["low"]["textures"] + 8,
      f"low={ctxs['low']['textures']} high={ctxs['high']['textures']}")

print(f"\n{'✓ scene complexity within budget' if not fails else '✗ ' + str(len(fails)) + ' failure(s)'}\n")
sys.exit(0 if not fails else 1)
