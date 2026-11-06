"""Draft skin spec for a creature that is not a pig (decision 050, R3): beasts seen from the side, front-facing bodies, floaters.

  python scripts/rig/autoskin_generic.py <art> <beast|front|float> [--flip]

  beast  side view on legs (wolf, fox, goat, newt, drake, birds, beetle) -> clips of pig_boar: head, legs, tail
  front  a front-facing body on legs (golem, guardian, treant, idol)     -> clips of pig_turtle (heavy): head, legs
  float  no legs (wisp, wraith, priest, mossling, sprout)                 -> clips of octopus: the whole body squashes and floats
  --flip the picture looks left: the skin is the mirror image (every rig looks right; the battle mirrors enemies)

Same outputs and `fix` block as autoskin.py. A mouth is only swapped when one is found for sure; else the faces change the eyes only.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps

sys.path.insert(0, str(Path(__file__).parent))
from autoskin import find_legs, merge_fix, overlay  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
TEMPLATE = {"beast": "pig_boar", "front": "pig_turtle", "float": "octopus"}


def look_of(art: str, flip: bool) -> tuple[str, np.ndarray]:
    src = ROOT / "public/assets/props/combat" / f"cb_{art}_idle.png"
    if not flip:
        return f"public/assets/props/combat/cb_{art}_idle.png", np.array(Image.open(src).convert("RGBA")).astype(np.int16)
    out = ROOT / "asset/rigs" / art / "look.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    ImageOps.mirror(Image.open(src).convert("RGBA")).save(out)
    return f"asset/rigs/{art}/look.png", np.array(Image.open(out)).astype(np.int16)


def eyes_of(a: np.ndarray, box, kind: str) -> list:
    """Dark compact blobs in the upper body: a pair side by side, or one eye (a bird or a newt seen from the side)."""
    x0, y0, x1, y1 = box
    lum = a[..., :3].mean(axis=2)
    dark = ((lum < 80) & (a[..., 3] > 200)).astype(np.uint8)
    dark = cv2.morphologyEx(dark, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    dark = cv2.morphologyEx(dark, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    n, _, stats, cent = cv2.connectedComponentsWithStats(dark)
    blobs = []
    for i in range(1, n):
        x, y, w, h, area = stats[i]
        if 60 < area < 5000 and 0.55 < w / h < 1.8 and area / max(1, w * h) > 0.55 and cent[i][1] < y0 + 0.75 * (y1 - y0):
            blobs.append((area, (float(cent[i][0]), float(cent[i][1])), (w / 2, h / 2)))
    pairs = [(b1, b2) for b1 in blobs for b2 in blobs if 18 < b2[1][0] - b1[1][0] < 170 and abs(b2[1][1] - b1[1][1]) < 40
             and 0.4 < b1[0] / b2[0] < 2.5]
    if pairs:
        b1, b2 = max(pairs, key=lambda p: p[0][0] + p[1][0] - 15 * abs(p[0][1][1] - p[1][1][1]))
        pick = [b1, b2]
    elif blobs:
        pick = [max(blobs, key=lambda b: b[0])]
    else:
        return []
    return [((round(c[0]), round(c[1])), (round(r[0] * 1.3 + 3), round(r[1] * 1.22 + 3))) for _, c, r in pick]


def mouth_of(a: np.ndarray, eyes, R: float):
    """A thin dark stroke under the eyes, about as wide as the gap between them; None when there is no clear one."""
    lum = a[..., :3].mean(axis=2)
    cx = np.mean([e[0][0] for e in eyes])
    cy = max(e[0][1] + e[1][1] for e in eyes)
    h, w = lum.shape
    yy, xx = np.mgrid[0:h, 0:w]
    zone = (np.abs(xx - cx) < 0.9 * R) & (yy > cy) & (yy < cy + 0.9 * R)
    for (ex, ey), (rx, ry) in eyes:
        zone &= ((xx - ex) / (rx + 4)) ** 2 + ((yy - ey) / (ry + 4)) ** 2 > 1
    ink = ((lum < 110) & (a[..., 3] > 200) & zone).astype(np.uint8)
    n, _, stats, _ = cv2.connectedComponentsWithStats(ink)
    best = None
    for i in range(1, n):
        x, y, bw, bh, area = stats[i]
        if 0.2 * R <= bw <= 1.2 * R and bw > 1.8 * bh and area > 15 and (best is None or bw > best[2] - best[0]):
            best = (int(x) - 3, int(y) - 3, int(x + bw) + 3, int(y + bh) + 3)
    return best


def draft(art: str, kind: str, flip: bool, fix: dict) -> dict:
    look, a = look_of(art, flip)
    al = a[..., 3] > 128
    ys, xs = np.nonzero(al)
    box = (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))
    x0, y0, x1, y1 = box
    W, H = x1 - x0, y1 - y0
    fe = fix.get("face", {}).get("eyes")
    eyes = [(tuple(e["c"]), tuple(e["r"])) for e in fe] if fe else eyes_of(a, box, kind)
    if not eyes:
        raise SystemExit(f"{art}: no eyes found — add face.eyes to the fix block")
    mid = (float(np.mean([e[0][0] for e in eyes])), float(np.mean([e[0][1] for e in eyes])))
    R = float(np.hypot(eyes[1][0][0] - eyes[0][0][0], eyes[1][0][1] - eyes[0][0][1])) if len(eyes) == 2 else 3.0 * max(eyes[0][1])
    R = max(R, 0.16 * W)
    rnd = lambda p: [round(float(p[0]), 1), round(float(p[1]), 1)]  # noqa: E731
    hc = (mid[0] - (0.15 * R if kind == "beast" else 0), mid[1] + 0.25 * R)
    rx, ry = (1.5 if kind != "beast" else 1.25) * R, 1.25 * R
    head = [(hc[0] + rx * np.cos(t), hc[1] + ry * np.sin(t)) for t in np.linspace(0, 2 * np.pi, 16, endpoint=False)]
    if kind == "beast":  # the face side borders nothing: empty grid there follows the head
        head = [p if p[0] < hc[0] else (512.0, p[1]) for p in head]
    mouth = None if fix.get("face", {}).get("nomouth") else (tuple(fix["face"]["mouth"]["box"]) if "mouth" in fix.get("face", {}) else mouth_of(a, eyes, R))
    bones = {"eyes": mid}
    regions: list = []
    chains = {}
    if kind == "float":
        bones.update({"float": (x0 + W / 2, y1 - 0.3 * H), "mantle": (x0 + W / 2, y1 - 0.1 * H)})
        regions = [("float", [(0, 0), (512, 0), (512, 512), (0, 512)]), ("mantle", [(0, 0), (512, 0), (512, y1 - 0.05 * H), (0, y1 - 0.05 * H)], 30)]
    else:
        hips = (x0 + 0.45 * W, y1 - 0.22 * H)
        bones.update({"hips": hips, "body": hips, "head": (hc[0] - (0.4 * R if kind == "beast" else 0), hc[1] + 0.9 * ry)})
        regions = [("body", [(0, 0), (512, 0), (512, 512), (0, 512)])]
        legs = [tuple(r) for r in fix["legs"]] if "legs" in fix else find_legs(a, box)
        names = {4: ["leg_br", "leg_bl", "leg_fr", "leg_fl"], 3: ["leg_br", "leg_fr", "leg_fl"], 2: ["leg_br", "leg_fr"], 1: ["leg_fr"]}.get(len(legs), [])
        top = y1 - 0.16 * H
        for name, (lx0, lx1) in zip(names, legs):
            regions.append((name, [(lx0 - 2, top), (lx1 + 2, top), (lx1 + 2, 512), (lx0 - 2, 512)]))
            bones[name] = ((lx0 + lx1) / 2, top)
        if kind == "beast" and "notail" not in fix:
            band = al[int(y0 + 0.2 * H):int(y0 + 0.75 * H)]
            bys, bxs = np.nonzero(band)
            lx = bxs.min()
            tip = (float(lx), float(y0 + 0.2 * H + bys[bxs <= lx + 3].mean()))
            root = (tip[0] + 0.15 * W, tip[1] + 0.04 * H)
            chains["tail"] = {"at": rnd(root), "dir": round(float(np.degrees(np.arctan2(tip[1] - root[1], tip[0] - root[0]))) % 360),
                              "len": round(max(30.0, float(np.hypot(tip[0] - root[0], tip[1] - root[1]))))}
            regions.append(("tail", [(0, tip[1] - 0.15 * H), (root[0] + 6, tip[1] - 0.15 * H), (root[0] + 6, tip[1] + 0.13 * H), (0, tip[1] + 0.13 * H)], 16))
        regions.append(("head", head, 16))
    if mouth:
        bones["mouth"] = ((mouth[0] + mouth[2]) / 2, (mouth[1] + mouth[3]) / 2)
    else:
        bones["mouth"] = (mid[0], mid[1] + 0.6 * R)
    face_eyes = []
    for (c, r) in eyes:
        face_eyes.append({"c": list(c), "r": list(r)})
    mbox = list(mouth) if mouth else [round(bones["mouth"][0] - 8), round(bones["mouth"][1] - 4), round(bones["mouth"][0] + 8), round(bones["mouth"][1] + 4)]
    return {
        "face": {"look": look, "feet": y1, "eyes": face_eyes, "mouth": {"box": mbox, "max": [round(0.8 * R), round(0.55 * R)]},
                 "overlays": {}, "tight": True, "nomouth": mouth is None},
        "rig": {"feet": y1, "grid": [32, 28], "soft": 12, "keep_parts": [],
                "bones": {k: rnd(v) for k, v in bones.items()}, "chains": chains,
                "regions": [[g[0], [rnd(p) for p in g[1]], *g[2:]] for g in regions]},
    }


def main() -> None:
    art, kind = sys.argv[1], sys.argv[2]
    flip = "--flip" in sys.argv
    path = ROOT / "asset/rigs" / art / "skin_spec.json"
    old = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    fix = old.get("fix", {})
    spec = merge_fix(draft(art, kind, flip, fix), fix)
    spec["fix"], spec["kind"], spec["flip"] = fix, kind, flip
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(spec, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")
    rig = ROOT / "content/anim/rigs" / f"{art}.json"
    if not rig.exists():
        data = json.loads((ROOT / "content/anim/rigs" / f"{TEMPLATE[kind]}.json").read_text(encoding="utf-8"))
        data["id"] = art
        rig.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8", newline="\n")
    overlay(art, spec)
    print(f"{art} ({kind}{', flipped' if flip else ''}): eyes {[e['c'] for e in spec['face']['eyes']]}, mouth {'yes' if not spec['face']['nomouth'] else 'kept'}, "
          f"legs {[g[0] for g in spec['rig']['regions'] if g[0].startswith('leg')]}")


if __name__ == "__main__":
    main()
