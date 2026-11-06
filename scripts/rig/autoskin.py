"""Draft skin spec for a creature from its approved picture (decision 050): landmarks found on the picture, regions from a template.

  python scripts/rig/autoskin.py <art> [--template pig] [--from pig_boar]
      -> asset/rigs/<art>/skin_spec.json   (read by skin.py / skinRigs.py; hand fixes go in its "fix" block, kept on re-run)
      -> content/anim/rigs/<art>.json      (only when missing: a copy of the template rig's clips, renamed)
      -> art_inbox/.qa/autoskin_<art>.png  (the picture with every region, joint, eye and mouth drawn: look at it before using the rig)

Landmarks (px of the 512 picture): the two eyes (dark compact blobs, opened so outlines drop out, paired by size and place), the
snout (the pink disc next to the far eye), the mouth (dark line under the snout), the legs (runs of the silhouette along the feet),
the tail (the silhouette's left end). Regions are the pig template (the turtle pig, measured by hand) moved onto these landmarks.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]

# The hand-measured pink pig (pig_turtle without its shell): near eye, far eye, and its regions in px of its picture.
T_NEAR, T_FAR = (334, 271), (427, 248)
T_HEAD = [(275, 150), (300, 110), (512, 110), (512, 350), (470, 335), (420, 368), (365, 378), (310, 365), (282, 335), (268, 290), (270, 220)]
T_EAR_NEAR = [(170, 195), (222, 170), (292, 172), (306, 212), (300, 262), (270, 296), (212, 296), (176, 266)]
T_EAR_FAR = [(360, 150), (375, 110), (512, 110), (512, 250), (472, 238), (425, 205), (372, 182)]
T_JOINTS = {"head": (330, 360), "ear_near": (288, 192), "ear_far": (385, 165), "mane": (330, 160)}


def picture(art: str) -> np.ndarray:
    return np.array(Image.open(ROOT / "public/assets/props/combat" / f"cb_{art}_idle.png").convert("RGBA")).astype(np.int16)


def find_eyes(a: np.ndarray, box) -> list[tuple[tuple[float, float], tuple[float, float]]]:
    x0, y0, x1, y1 = box
    lum = a[..., :3].mean(axis=2)
    dark = ((lum < 75) & (a[..., 3] > 200)).astype(np.uint8)
    # Pupils are filled with a white glint: close it, then open so outline strokes fall away.
    dark = cv2.morphologyEx(dark, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    dark = cv2.morphologyEx(dark, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    n, lab, stats, cent = cv2.connectedComponentsWithStats(dark)
    blobs = []
    for i in range(1, n):
        x, y, w, h, area = stats[i]
        cx, cy = cent[i]
        fill = area / max(1, w * h)
        if 120 < area < 6000 and 0.5 < w / h < 1.8 and fill > 0.5 and cy < y0 + 0.72 * (y1 - y0) and cx > x0 + 0.35 * (x1 - x0):
            blobs.append((area, (cx, cy), (w / 2, h / 2)))
    best, score = None, -1e9
    for i in range(len(blobs)):
        for j in range(len(blobs)):
            if i == j:
                continue
            (an, cn, rn), (af, cf, rf) = blobs[i], blobs[j]
            dx, dy = cf[0] - cn[0], cf[1] - cn[1]
            # The near eye is left and bigger; the far one right, a little higher, 50–150 px away.
            if not (40 < dx < 160 and -60 < dy < 25):
                continue
            s = an + af - abs(dy) * 20 - abs(dx - 95) * 8 + (an - af) * 0.3
            if s > score:
                best, score = (blobs[i], blobs[j]), s
    if not best:
        return []
    # The visible eye is the dark blob plus its white rim and outline: a little bigger.
    return [((round(c[0]), round(c[1])), (round(r[0] * 1.32 + 3), round(r[1] * 1.22 + 3))) for _, c, r in best]


def find_mouth(a: np.ndarray, near, snout_c, rx, ry, d) -> tuple[int, int, int, int]:
    """The resting mouth: the longest thin dark stroke under the snout (outside the snout disc), else a box where pigs have it."""
    lum = a[..., :3].mean(axis=2)
    h, w = lum.shape
    yy, xx = np.mgrid[0:h, 0:w]
    disc = ((xx - snout_c[0]) / (rx * 1.08)) ** 2 + ((yy - snout_c[1]) / (ry * 1.08)) ** 2 <= 1
    zone = (xx > near[0] - 0.1 * d) & (xx < snout_c[0] + rx) & (yy > snout_c[1] - 0.1 * d) & (yy < snout_c[1] + 0.9 * d)
    ink = ((lum < 125) & (a[..., 3] > 200) & zone & ~disc).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(ink)
    best, score = None, 0
    for i in range(1, n):
        x, y, bw, bh, area = stats[i]
        # A mouth is wide and thin, not touching the silhouette's outline far away.
        if bw >= 0.25 * d and bw > 1.8 * bh and area > 25 and bw * area > score:
            best, score = (x, y, x + bw, y + bh), bw * area
    if best:
        x0, y0, x1, y1 = best
        return (int(x0) - 3, int(y0) - 3, int(x1) + 3, int(y1) + 3)
    c = (snout_c[0] - 0.28 * d, snout_c[1] + 0.32 * d)
    return (round(c[0] - 0.33 * d), round(c[1] - 0.12 * d), round(c[0] + 0.33 * d), round(c[1] + 0.14 * d))


def runs(mask_row: np.ndarray, gap: int = 4) -> list[tuple[int, int]]:
    xs = np.flatnonzero(mask_row)
    if len(xs) == 0:
        return []
    out = [[xs[0], xs[0]]]
    for x in xs[1:]:
        if x - out[-1][1] <= gap:
            out[-1][1] = x
        else:
            out.append([x, x])
    return [(a, b) for a, b in out if b - a >= 10]


def find_legs(a: np.ndarray, box) -> list[tuple[int, int]]:
    """The hooves: runs of the silhouette a few px above the feet line, left to right."""
    x0, y0, x1, y1 = box
    al = a[..., 3] > 128
    # The bottom profile: the lowest ink of each column. Hooves reach the feet line, the belly between them stays higher; a far
    # hoof ends a little higher than the near one, so a step in the profile splits two hooves that touch.
    H = y1 - y0
    low = np.where(al.any(axis=0), al.shape[0] - 1 - np.argmax(al[::-1], axis=0), -1)
    legcols = low > y1 - 0.1 * H
    hoof = 0.12 * (x1 - x0)
    found = [r for r in runs(legcols, gap=2) if r[1] - r[0] >= 0.5 * hoof]  # a spear shaft is not a leg
    total = sum(max(1, round((r1 - r0) / hoof)) for r0, r1 in found)
    out = []
    for r0, r1 in found:
        k = max(1, round((r1 - r0) / hoof)) if (r1 - r0) > 1.55 * hoof else 1
        if total > 4:
            k = max(1, k - (total - 4))
            total = 4
        # Cut where the profile steps (one hoof ends higher than the next), else evenly.
        seg = low[r0:r1 + 1].astype(float)
        jumps = np.abs(np.diff(seg))
        cuts = []
        for i in range(1, k):
            lo, hi = int((i - 0.35) / k * len(jumps)), int((i + 0.35) / k * len(jumps))
            part = jumps[lo:hi]
            cuts.append(r0 + lo + int(np.argmax(part)) + 1 if len(part) and part.max() >= 3 else r0 + round(i * (r1 - r0) / k))
        edges = [r0, *cuts, r1 + 1]
        out += [(edges[i], edges[i + 1] - 1) for i in range(k)]
    return out[:4]


def similarity(src: tuple, dst: tuple):
    """Maps the template's eye pair onto the found one (scale + turn + shift)."""
    (ax, ay), (bx, by) = src
    (cx, cy), (dx, dy) = dst
    s = complex(dx - cx, dy - cy) / complex(bx - ax, by - ay)
    return lambda p: (lambda z: (round(z.real, 1), round(z.imag, 1)))(complex(cx, cy) + s * complex(p[0] - ax, p[1] - ay))


def draft(art: str, fix: dict) -> dict:
    a = picture(art)
    al = a[..., 3] > 128
    ys, xs = np.nonzero(al)
    box = (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))
    x0, y0, x1, y1 = box
    W, H = x1 - x0, y1 - y0
    fe = fix.get("face", {}).get("eyes")
    eyes = [(tuple(e["c"]), tuple(e["r"])) for e in fe] if fe else find_eyes(a, box)
    if len(eyes) != 2:
        raise SystemExit(f"{art}: eyes not found — add them to the spec's fix block")
    (n_c, n_r), (f_c, f_r) = eyes
    m = similarity((T_NEAR, T_FAR), (n_c, f_c))
    d = np.hypot(f_c[0] - n_c[0], f_c[1] - n_c[1])
    snout_c = (f_c[0] - 0.1 * d, f_c[1] + 0.5 * d)
    rx, ry = 0.42 * d, 0.33 * d
    snout = [(round(snout_c[0] + rx * np.cos(t), 1), round(snout_c[1] + ry * np.sin(t), 1)) for t in np.linspace(0, 2 * np.pi, 12, endpoint=False)]
    mouth = find_mouth(a, n_c, snout_c, rx, ry, d)
    mouth_c = ((mouth[0] + mouth[2]) / 2, (mouth[1] + mouth[3]) / 2)
    legs = [tuple(r) for r in fix["legs"]] if "legs" in fix else find_legs(a, box)
    top = y1 - 0.16 * H
    names = {4: ["leg_br", "leg_bl", "leg_fr", "leg_fl"], 3: ["leg_br", "leg_fr", "leg_fl"], 2: ["leg_br", "leg_fr"], 1: ["leg_fr"]}.get(len(legs))
    if not names:
        raise SystemExit(f"{art}: {len(legs)} leg runs — fix by hand")
    leg_regions, joints = [], {}
    for name, (lx0, lx1) in zip(names, legs):
        far = name in ("leg_bl", "leg_fl")
        t = top + (0.04 * H if far else 0)
        leg_regions.append((name, [(lx0 - 2, t), (lx1 + 2, t), (lx1 + 2, 512), (lx0 - 2, 512)]))
        joints[name] = ((lx0 + lx1) / 2, t)
    # The tail: the leftmost point of the silhouette between a quarter and 70 % of its height; its root a little inside.
    band = al[int(y0 + 0.25 * H):int(y0 + 0.7 * H)]
    bys, bxs = np.nonzero(band)
    lx = bxs.min()
    tail_tip = (float(lx), float(y0 + 0.25 * H + bys[bxs <= lx + 3].mean()))
    tail_root = (tail_tip[0] + 0.13 * W, tail_tip[1] + 0.03 * H)
    tdir = float(np.degrees(np.arctan2(tail_tip[1] - tail_root[1], tail_tip[0] - tail_root[0]))) % 360
    tlen = float(np.hypot(tail_tip[0] - tail_root[0], tail_tip[1] - tail_root[1]))
    hips = (x0 + 0.42 * W, y1 - 0.2 * H)
    joints.update({"hips": hips, "body": hips, "mouth": mouth_c, "snout": snout_c, "eyes": ((n_c[0] + f_c[0]) / 2, (n_c[1] + f_c[1]) / 2)})
    joints.update({k: m(v) for k, v in T_JOINTS.items()})
    regions = [("body", [(0, 0), (512, 0), (512, 512), (0, 512)])] + leg_regions
    ty = tail_tip[1]
    regions.append(("tail", [(0, ty - 0.13 * H), (tail_root[0] + 6, ty - 0.13 * H), (tail_root[0] + 6, ty + 0.11 * H), (0, ty + 0.11 * H)]))
    regions.append(("head", [m(p) for p in T_HEAD]))
    regions.append(("ear_near", [m(p) for p in T_EAR_NEAR], 18))
    regions.append(("ear_far", [m(p) for p in T_EAR_FAR]))
    regions.append(("snout", snout))
    rnd = lambda p: [round(float(p[0]), 1), round(float(p[1]), 1)]  # noqa: E731
    return {
        "face": {
            "look": f"public/assets/props/combat/cb_{art}_idle.png", "feet": y1,
            "eyes": [{"c": list(n_c), "r": list(n_r), "brow": [n_c[0] - n_r[0], n_c[1] - n_r[1] - 14, n_c[0] + n_r[0], n_c[1] - n_r[1] + 2]},
                     {"c": list(f_c), "r": list(f_r), "brow": [f_c[0] - f_r[0], f_c[1] - f_r[1] - 12, f_c[0] + f_r[0], f_c[1] - f_r[1] + 2]}],
            "mouth": {"box": list(mouth), "max": [round(0.75 * d), round(0.5 * d)]},
            "overlays": {"snout": [rnd(p) for p in snout]},
            "tight": True,
        },
        "rig": {
            "feet": y1, "grid": [32, 28], "soft": 10, "keep_parts": ["snout"],
            "bones": {k: rnd(v) for k, v in joints.items()},
            "chains": {"tail": {"at": rnd(tail_root), "dir": round(tdir), "len": round(max(30, tlen))}},
            "regions": [[g[0], [rnd(p) for p in g[1]], *g[2:]] for g in regions],
        },
    }


def overlay(art: str, spec: dict) -> None:
    img = Image.open(ROOT / spec["face"]["look"]).convert("RGBA")
    k = 2
    bg = Image.new("RGBA", img.size, (150, 190, 150, 255))
    bg.alpha_composite(img)
    bg = bg.resize((512 * k, 512 * k))
    d = ImageDraw.Draw(bg)
    colors = {"head": (255, 0, 0), "ear_near": (255, 140, 0), "ear_far": (255, 200, 0), "snout": (255, 0, 200), "tail": (0, 0, 255)}
    for g in spec["rig"]["regions"][1:]:
        c = colors.get(g[0], (0, 120, 255) if g[0].startswith("leg") else (80, 80, 80))
        d.line([(x * k, y * k) for x, y in g[1]] + [(g[1][0][0] * k, g[1][0][1] * k)], fill=c, width=3)
    for name, (x, y) in spec["rig"]["bones"].items():
        d.ellipse([x * k - 6, y * k - 6, x * k + 6, y * k + 6], fill=(255, 255, 255), outline=(0, 0, 0))
        d.text((x * k + 8, y * k - 6), name, fill=(0, 0, 0))
    for e in spec["face"]["eyes"]:
        (cx, cy), (rx, ry) = e["c"], e["r"]
        d.ellipse([(cx - rx) * k, (cy - ry) * k, (cx + rx) * k, (cy + ry) * k], outline=(0, 255, 255), width=3)
    mx0, my0, mx1, my1 = spec["face"]["mouth"]["box"]
    d.rectangle([mx0 * k, my0 * k, mx1 * k, my1 * k], outline=(255, 255, 255), width=3)
    t = spec["rig"]["chains"]["tail"]
    tx, ty = t["at"]
    ex, ey = tx + t["len"] * np.cos(np.radians(t["dir"])), ty + t["len"] * np.sin(np.radians(t["dir"]))
    d.line([(tx * k, ty * k), (ex * k, ey * k)], fill=(0, 0, 255), width=4)
    out = ROOT / "art_inbox/.qa" / f"autoskin_{art}.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    bg.convert("RGB").resize((512, 512)).save(out)


def merge_fix(spec: dict, fix: dict) -> dict:
    """The hand fixes win: `fix.face.*`, `fix.rig.bones.<id>`, `fix.rig.chains.<id>`, `fix.rig.regions` (replaces by bind id)."""
    for key in ("eyes", "mouth", "overlays", "feet", "nomouth"):
        if key in fix.get("face", {}):
            spec["face"][key] = fix["face"][key]
    r = fix.get("rig", {})
    spec["rig"]["bones"].update(r.get("bones", {}))
    for cid, c in r.get("chains", {}).items():
        spec["rig"]["chains"].setdefault(cid, {}).update(c)
    for g in r.get("regions", []):
        spec["rig"]["regions"] = [x for x in spec["rig"]["regions"] if x[0] != g[0]]
        spec["rig"]["regions"].insert(len(spec["rig"]["regions"]) if g[0] in ("snout", "ear_far", "ear_near") else 1, g)
    return spec


def main() -> None:
    art = sys.argv[1]
    template = sys.argv[sys.argv.index("--from") + 1] if "--from" in sys.argv else "pig_boar"
    path = ROOT / "asset/rigs" / art / "skin_spec.json"
    old = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    spec = merge_fix(draft(art, old.get("fix", {})), old.get("fix", {}))
    spec["fix"] = old.get("fix", {})
    spec["face"]["sheet"] = old.get("face", {}).get("sheet")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(spec, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")
    rig = ROOT / "content/anim/rigs" / f"{art}.json"
    if not rig.exists():
        data = json.loads((ROOT / "content/anim/rigs" / f"{template}.json").read_text(encoding="utf-8"))
        data["id"] = art
        rig.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8", newline="\n")
    overlay(art, spec)
    print(f"{art}: eyes {spec['face']['eyes'][0]['c']} / {spec['face']['eyes'][1]['c']}, legs {[g[0] for g in spec['rig']['regions'] if g[0].startswith('leg')]}")


if __name__ == "__main__":
    main()
