"""Skin layers for a puppet (decision 050, 2026-11-06): the creature's accepted picture, bent by the rig, instead of cut parts.

  python scripts/rig/skin.py <rig>   -> asset/rigs/<rig>/layers/{skin,<overlay>,eyes_*,mouth_*}.png (then: npm run rig:parts <rig>)

Why: parts painted apart (batch rig-01-layers) never add up to the picture that was approved: the head, body and mane of the
finished art are one mass with shared light and overlaps. So the finished picture itself is the body (`skin`): the rig's bones and
chains bend it (systems/animation/skin.ts). Only what must change shape is a layer of its own:
  - the eyes and the resting mouth are cut out of the picture (`eyes_open`, `mouth_neutral`) and painted over in the skin (inpaint);
  - the other faces come from the Gemini face sheets, each eye moved and scaled onto the picture's own eye (near / far apart);
  - parts that cover a moving mouth (a snout) are cut out of the picture as overlays, so the mouth can open under them.
Coordinates in SPEC are px of the accepted picture (512²); the rig canvas puts its (256, FEET) at the feet origin.
"""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).parent))
from sheetcut import MANUAL, keyed, label  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
SHEETS = ROOT / "art_inbox/.batch/rig-01-layers"
RES = 2
FACES = ["eyes_open", "eyes_half", "eyes_closed", "eyes_angry", "eyes_hurt", "eyes_dizzy", "eyes_happy", "mouth_neutral"]
MOUTHS = ["mouth_open", "mouth_grit", "mouth_smile", "mouth_cry"]

# Per rig: the accepted picture, its feet line, the eyes (centre, radii, brow box), the mouth, overlays cut from the picture.
SPEC: dict[str, dict] = {
    "pig_boar": {
        "look": "public/assets/props/combat/cb_pig_boar_idle.png",
        "feet": 492,
        "sheet": ("B2", "B3"),
        "eyes": [  # near (left on the sheet) first
            {"c": (329, 271), "r": (38, 41), "brow": (300, 203, 336, 230)},
            {"c": (431, 240), "r": (21, 30), "brow": (408, 189, 428, 203)},
        ],
        "mouth": {"box": (386, 324, 442, 337), "max": (62, 48)},
        "overlays": {
            "snout": [(332, 318), (345, 302), (366, 288), (378, 262), (420, 249), (470, 260), (494, 290), (491, 340), (466, 354), (420, 349), (386, 357), (337, 354)],
        },
    },
    "pig_turtle": {
        "look": "public/assets/props/combat/cb_pig_turtle_idle.png",
        "feet": 492,
        "sheet": ("T2", "T3"),
        "eyes": [
            {"c": (334, 271), "r": (35, 36), "brow": (311, 210, 343, 230)},
            {"c": (427, 248), "r": (20, 28), "brow": (407, 197, 431, 213)},
        ],
        "mouth": {"box": (360, 308, 422, 332), "max": (60, 40)},
        "overlays": {
            "snout": [(378, 280), (395, 265), (425, 261), (449, 268), (453, 295), (441, 319), (410, 323), (385, 314)],
        },
    },
    "fish_betta": {
        "look": "public/assets/props/combat/cb_fish_betta_idle.png",
        "feet": 492,
        "sheet": ("F2", "F3"),
        "eyes": [{"c": (416, 311), "r": (16, 16)}],
        "mouth": {"box": (440, 305, 461, 322), "max": (24, 20)},
        "overlays": {},
    },
    "octopus": {
        # The in-game picture is 192 px wide; its 354 px source (same drawing), ×1.3 on the 512 canvas (scripts/rig: asset/rigs/octopus/look.png).
        "look": "asset/rigs/octopus/look.png",
        "feet": 492,
        "sheet": ("O2", "O3"),
        "eyes": [{"c": (242, 265), "r": (20, 21)}, {"c": (336, 252), "r": (18, 21)}],
        "mouth": {"box": (276, 263, 314, 287), "max": (44, 34)},
        "overlays": {},
    },
}


def to_canvas(img: Image.Image, feet: int) -> Image.Image:
    """The picture (512²) on the rig's 1024 canvas: ×2, its feet on the canvas ground (y 940)."""
    big = img.resize((img.width * RES, img.height * RES), Image.LANCZOS)
    can = Image.new("RGBA", (512 * RES, 512 * RES), (0, 0, 0, 0))
    can.alpha_composite(big, (0, 470 * RES - feet * RES)) if feet * RES <= 470 * RES else can.paste(big, (0, 470 * RES - feet * RES), big)
    return can


def poly_mask(size: tuple[int, int], polys: list[list[tuple[float, float]]], ellipses=(), boxes=(), k: float = 1.0, dy: float = 0) -> Image.Image:
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    for p in polys:
        d.polygon([(x * k, y * k + dy) for x, y in p], fill=255)
    for (cx, cy), (rx, ry) in ellipses:
        d.ellipse([(cx - rx) * k, (cy - ry) * k + dy, (cx + rx) * k, (cy + ry) * k + dy], fill=255)
    for x0, y0, x1, y1 in boxes:
        d.rectangle([x0 * k, y0 * k + dy, x1 * k, y1 * k + dy], fill=255)
    return m


def cut(can: Image.Image, mask: Image.Image, feather: float = 1.2) -> Image.Image:
    out = can.copy()
    a = np.minimum(np.array(can.getchannel("A")), np.array(mask.filter(ImageFilter.GaussianBlur(feather))))
    out.putalpha(Image.fromarray(a))
    return out


def sheet_cells(sid: str, n: int, cols: int) -> list[Image.Image]:
    """The cells of a face sheet (even grid; the fish's irregular sheets use sheetcut.MANUAL)."""
    sheet = Image.open(SHEETS / f"{sid}.png").convert("RGBA")
    if sid in MANUAL:
        w, h = sheet.size
        return [sheet.crop((round(b[0] * w), round(b[1] * h), round(b[2] * w), round(b[3] * h))) for b in MANUAL[sid].values()]
    rows = (n + cols - 1) // cols
    cw, ch = sheet.width / cols, sheet.height / rows
    return [sheet.crop((round((i % cols) * cw), round((i // cols) * ch), round((i % cols + 1) * cw), round((i // cols + 1) * ch))) for i in range(n)]


def clean(cell: Image.Image) -> Image.Image:
    arr = np.array(cell)
    keep = keyed(arr[..., :3], arr[..., 3])
    arr[..., 3] = np.where(keep, arr[..., 3], 0)
    return Image.fromarray(arr)


def blobs(img: Image.Image) -> list[tuple[int, tuple[int, int, int, int]]]:
    """Connected shapes of a cut cell, biggest first: (area, bbox)."""
    a = np.array(img.getchannel("A")) > 40
    lab, n = label(a)
    out = []
    for i in range(1, n + 1):
        ys, xs = np.nonzero(lab == i)
        out.append((len(xs), (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)))
    return sorted(out, reverse=True)


def place_eyes(rig: str, spec: dict, can_size: tuple[int, int]) -> dict[str, Image.Image]:
    """Every eye expression of the sheet moved onto the picture's eyes: each side scaled by its own eye's width."""
    sid = spec["sheet"][0]
    cells = [clean(c) for c in sheet_cells(sid, 8, 4)]
    eyes = spec["eyes"]
    open_ = cells[0]
    found = [b for _, b in blobs(open_)[: len(eyes) + 2]]
    # The eyes are the biggest blobs; brows are thin and above them.
    found = sorted(sorted(found, key=lambda b: (b[2] - b[0]) * (b[3] - b[1]), reverse=True)[: len(eyes)], key=lambda b: b[0])
    split = (found[0][2] + found[1][0]) / 2 if len(found) > 1 else open_.width
    sides = []
    for k, e in enumerate(eyes):
        gx0, gy0, gx1, gy1 = found[k]
        s = (2 * e["r"][0] * 0.94) / (gx1 - gx0)
        sides.append((s, ((gx0 + gx1) / 2, (gy0 + gy1) / 2), e["c"], (0, split) if k == 0 else (split, open_.width)))
    out: dict[str, Image.Image] = {}
    for name, cell in zip(FACES[1:7], cells[1:7]):
        can = Image.new("RGBA", can_size, (0, 0, 0, 0))
        for s, (gx, gy), (ox, oy), (xa, xb) in sides:
            half = cell.crop((round(xa), 0, round(xb), cell.height))
            k = s * RES
            hw = half.resize((max(1, round(half.width * k)), max(1, round(half.height * k))), Image.LANCZOS)
            px = round(ox * RES - (gx - xa) * k)
            py = round(oy * RES + spec["dy"] - gy * k)
            can.alpha_composite(hw, (px, py)) if px >= 0 and py >= 0 else can.paste(hw, (px, py), hw)
        out[name] = can
    return out


def place_mouths(spec: dict, can_size: tuple[int, int]) -> dict[str, Image.Image]:
    """The other mouths hang from the line of the picture's own resting mouth, scaled like it, capped to the room under the snout."""
    m = spec["mouth"]
    x0, y0, x1, y1 = m["box"]
    out = {}
    for name, cell in zip(MOUTHS, sheet_cells(spec["sheet"][1], 4, 4)):
        c = clean(cell)
        c = c.crop(c.getbbox())
        # A shout or a grin is bigger than the resting line: it fills the room the rig has for it.
        k = min(m["max"][0] / c.width, m["max"][1] / c.height) * RES
        c = c.resize((max(1, round(c.width * k)), max(1, round(c.height * k))), Image.LANCZOS)
        can = Image.new("RGBA", can_size, (0, 0, 0, 0))
        can.alpha_composite(c, (round((x0 + x1) / 2 * RES - c.width / 2), round(y0 * RES + spec["dy"] - 2)))
        out[name] = can
    return out


def fill(arr: np.ndarray, hole: np.ndarray) -> np.ndarray:
    """Paints a hole with the skin around it: a normalised blur of the neighbours that are skin (not outline ink, not outside),
    the finest scale that reaches each pixel. Smooth, and no dark smear from a tusk or an outline next to the hole."""
    rgb = arr[..., :3].astype(np.float32)
    lum = rgb.mean(axis=2)
    valid = (~hole & (arr[..., 3] > 200) & (lum > 120)).astype(np.float32)
    out = rgb.copy()
    todo = hole.copy()
    for sigma in (4, 8, 16, 32, 64):
        w = cv2.GaussianBlur(valid, (0, 0), sigma)
        est = cv2.GaussianBlur(rgb * valid[..., None], (0, 0), sigma) / np.maximum(w, 1e-6)[..., None]
        ok = todo & (w > 0.15)
        out[ok] = est[ok]
        todo &= ~ok
    return np.clip(out, 0, 255).astype(np.uint8)


def build(rig: str) -> None:
    spec = SPEC[rig]
    look = Image.open(ROOT / spec["look"]).convert("RGBA")
    can = to_canvas(look, spec["feet"])
    size = can.size
    spec["dy"] = 470 * RES - spec["feet"] * RES
    k, dy = RES, spec["dy"]
    snout = [p for p in spec["overlays"].values()]
    eye_mask = poly_mask(size, [], [(e["c"], e["r"]) for e in spec["eyes"]], [e["brow"] for e in spec["eyes"] if "brow" in e], k, dy)
    # An eye the snout covers in part: the snout stays the snout.
    if snout:
        eye_mask = Image.fromarray(np.where(np.array(poly_mask(size, snout, k=k, dy=dy)) > 0, 0, np.array(eye_mask)).astype(np.uint8))
    mouth_mask = poly_mask(size, [], [], [spec["mouth"]["box"]], k, dy)
    face = Image.fromarray(np.maximum(np.array(eye_mask), np.array(mouth_mask)))
    out_dir = ROOT / "asset/rigs" / rig / "layers"
    keep = ROOT / "asset/rigs" / rig / "layers_cutout"
    if out_dir.exists() and not keep.exists():
        shutil.move(str(out_dir), str(keep))  # the painted cut-out parts stay as the fallback set
    out_dir.mkdir(parents=True, exist_ok=True)
    for f in out_dir.glob("*.png"):
        f.unlink()
    # The skin: the picture with its eyes, brows and resting mouth painted over from the skin around them.
    arr = np.array(can)
    hole = cv2.dilate(np.array(face), np.ones((9, 9), np.uint8)) > 0
    rgb = fill(arr, hole)
    skin = np.dstack([rgb, arr[..., 3]])
    Image.fromarray(skin).save(out_dir / "skin.png")
    cut(can, eye_mask).save(out_dir / "eyes_open.png")
    cut(can, mouth_mask).save(out_dir / "mouth_neutral.png")
    for name, poly in spec["overlays"].items():
        cut(can, poly_mask(size, [poly], k=k, dy=dy), 1.0).save(out_dir / f"{name}.png")
    for name, img in {**place_eyes(rig, spec, size), **place_mouths(spec, size)}.items():
        img.save(out_dir / f"{name}.png")
    print(f"{rig}: skin + {len(list(out_dir.glob('*.png'))) - 1} overlays -> {out_dir.relative_to(ROOT)}")


if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in SPEC:
        print(__doc__)
        sys.exit(1)
    build(sys.argv[1])
