"""Draws the frames written by `npm run rig:snap <rig> <clip>` into a strip (art_inbox/.qa/rig_<rig>_<clip>.png), full resolution.

  python scripts/rig/snap.py <rig> <clip> [scale]

The skin grid is warped triangle by triangle (cv2.warpAffine per cell half); parts and chains are laid on top in the frame's depth
order, each picture turned around its bone's joint like ui/puppet does. For review only (decision 050).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
QA = ROOT / "art_inbox/.qa"
MANIFEST = json.loads((ROOT / "public/assets/manifest/assets.json").read_text(encoding="utf-8"))
ASSET = {r["id"]: r.get("asset") for rows in MANIFEST.values() if isinstance(rows, list) for r in rows if isinstance(r, dict) and "id" in r}
CELL = 520  # canvas px per frame cell (the 512 canvas plus a margin)


def picture(img_id: str) -> np.ndarray:
    return np.array(Image.open(ROOT / "public/assets" / ASSET[img_id]).convert("RGBA")).astype(np.float32)


def over(dst: np.ndarray, src: np.ndarray) -> None:
    a = src[..., 3:4] / 255.0
    dst[..., :3] = src[..., :3] * a + dst[..., :3] * (1 - a)
    dst[..., 3:4] = np.maximum(dst[..., 3:4], src[..., 3:4])


def warp_tri(tex: np.ndarray, src: np.ndarray, dst: np.ndarray, out: np.ndarray) -> None:
    x, y, w, h = cv2.boundingRect(dst.astype(np.float32))
    if w <= 0 or h <= 0:
        return
    x0, y0 = max(x, 0), max(y, 0)
    x1, y1 = min(x + w + 1, out.shape[1]), min(y + h + 1, out.shape[0])
    if x1 <= x0 or y1 <= y0:
        return
    m = cv2.getAffineTransform(src.astype(np.float32), (dst - [x0, y0]).astype(np.float32))
    patch = cv2.warpAffine(tex, m, (x1 - x0, y1 - y0), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    mask = np.zeros((y1 - y0, x1 - x0), np.float32)
    cv2.fillConvexPoly(mask, np.round((dst - [x0, y0]) * 4).astype(np.int32), 1.0, cv2.LINE_AA, 2)
    patch[..., 3] *= mask
    over(out[y0:y1, x0:x1], patch)


def draw_frame(data: dict, fr: dict, k: float, textures: dict) -> np.ndarray:
    size = int(CELL * k)
    out = np.zeros((size, size, 4), np.float32)
    ox, oy = size / 2, size - 30 * k  # canvas (0, 0) = the feet
    to = lambda x, y: ((x * k) + ox, (y * k) + oy)  # noqa: E731
    res = data["res"]
    skin = data["skin"]
    layers = list(fr["drawn"])
    skin_z = skin["z"] if skin else 0
    def draw_skin():
        part = data["parts"][fr.get("part") or skin["part"]]
        tex = textures.setdefault(part["img"], picture(part["img"]))
        cols, rows = data["grid"]
        pos = np.array(fr["skin"], np.float32).reshape(-1, 2)
        th, tw = tex.shape[:2]
        for r in range(rows):
            for c in range(cols):
                ids = [r * (cols + 1) + c, r * (cols + 1) + c + 1, (r + 1) * (cols + 1) + c, (r + 1) * (cols + 1) + c + 1]
                uv = np.array([[(i % (cols + 1)) / cols * tw, (i // (cols + 1)) / rows * th] for i in ids], np.float32)
                p = np.array([to(*pos[i]) for i in ids], np.float32)
                for tri in ((0, 1, 2), (1, 3, 2)):
                    warp_tri(tex, uv[list(tri)], p[list(tri)], out)
    placed = not skin
    for d in layers:
        if not placed and d["z"] > skin_z:
            draw_skin()
            placed = True
        if d["kind"] != "part":
            continue  # cut-part chains are not drawn by this review tool
        part = data["parts"][d["part"]]
        tex = textures.setdefault(part["img"], picture(part["img"]))
        bx, by, bw, bh = part["box"]
        bone = next(b for b in RIG[data["rig"]]["bones"] if b["id"] == d["bone"])
        ax, ay = bone["at"]
        # The picture's corners around the joint, scaled and turned like ui/puppet.
        cs, sn = np.cos(d["rot"]), np.sin(d["rot"])
        def world(px, py):
            lx, ly = (px - ax) * d["sx"], (py - ay) * d["sy"]
            return to(d["x"] + lx * cs - ly * sn, d["y"] + lx * sn + ly * cs)
        th, tw = tex.shape[:2]
        src = np.array([[0, 0], [tw, 0], [0, th]], np.float32)
        dst = np.array([world(bx, by), world(bx + bw, by), world(bx, by + bh)], np.float32)
        m = cv2.getAffineTransform(src, dst)
        patch = cv2.warpAffine(tex, m, (size, size), flags=cv2.INTER_LINEAR, borderValue=(0, 0, 0, 0))
        over(out, patch)
    if not placed:
        draw_skin()
    return out


RIG: dict = {}


def main() -> None:
    rig, clip = sys.argv[1], sys.argv[2]
    k = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
    data = json.loads((QA / f"rig_{rig}_{clip}.json").read_text(encoding="utf-8"))
    RIG[rig] = json.loads((ROOT / "content/anim/rigs" / f"{rig}.json").read_text(encoding="utf-8"))
    textures: dict = {}
    frames = [draw_frame(data, fr, k, textures) for fr in data["frames"]]
    cols = 4
    size = frames[0].shape[0]
    rows = (len(frames) + cols - 1) // cols
    sheet = np.zeros((rows * size, cols * size, 4), np.float32)
    sheet[..., :3] = (150, 190, 150)
    sheet[..., 3] = 255
    for i, f in enumerate(frames):
        over(sheet[(i // cols) * size:(i // cols + 1) * size, (i % cols) * size:(i % cols + 1) * size], f)
    out = QA / f"rig_{rig}_{clip}.png"
    Image.fromarray(np.clip(sheet, 0, 255).astype(np.uint8)).convert("RGB").save(out)
    print(out)


if __name__ == "__main__":
    main()
