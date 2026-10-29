"""Component-based cutter for sheets that `art.py cut` splits badly.

`art.py cut` finds cells by projecting ink onto the axes, so grid lines, ground lines, text labels and the
generator's corner watermark break it (it falls back to an even grid and cuts the lines in). This tool works on
connected blobs instead:

1. background = light, unsaturated pixels reachable from the border (thin grid / ground lines are treated as
   background first, so a cell fenced by lines still floods);
2. every blob is assigned to the cell of an even grid (rows x cols over the whole sheet) holding its centre;
3. per cell, by mode:
   - pose:  the largest blob plus the pieces touching its box (tears, a weapon), never anything below its feet
            (labels, ground lines); every pose of a sheet gets ONE scale and lands on a square canvas with its
            feet at the bottom centre (COMBAT_ART_GUIDE.md: 512 px, body ~80 %, ~4 % under the feet);
   - frames: every blob of the cell; the frames of a row are cropped with the same box (union of their
            ink, relative to the cell) so they keep one centre and one size, then squared and resized;
   - item:  every blob of the cell, trimmed tight (process-art fits it on its canvas).

Writes `.candidates/<asset>_<variant>.png` like `art.py cut`, so `art.py approve` works unchanged.
Per-sheet layout fixes (a 3x3 sheet for a 6-pose manifest, a 2x2 sheet for 2 items) live in
`.batch/<batch>/cut_overrides.json`: {"E03": {"grid": [3, 3], "pick": [0, 1, 2, 3, 7, 8]}}; also "body" (share of
the canvas the idle pose stands tall), "lines" (true: also strip ground lines touching the drawing), "tol" (background tolerance, lower for pale creatures), "clear_top" ([height, width] share of each cell's top-left corner to blank out, for printed labels), "margin" (how far from
the creature a loose piece may lie, 0 to drop labels beside it), "skip".

Usage: python cut_blobs.py <batch> [--sheet A01 ...] [--variant a] [--canvas 512] [--frame 256] [--preview]
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path("art_inbox")


def load(batch: str) -> tuple[dict, dict, Path]:
    work = ROOT / ".batch" / batch
    data = json.loads((work / "batch.json").read_text(encoding="utf8"))
    ov_path = work / "cut_overrides.json"
    overrides = json.loads(ov_path.read_text(encoding="utf8")) if ov_path.exists() else {}
    return data, overrides, work


def background(rgb: np.ndarray, tol: int = 30, lines: bool = False) -> np.ndarray:
    """True where the pixel is sheet background (flood from the border through light, unsaturated pixels)."""
    h, w = rgb.shape[:2]
    mx = rgb.max(axis=2).astype(np.int16)
    mn = rgb.min(axis=2).astype(np.int16)
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]]).astype(np.int16)
    bg = np.median(border, axis=0)
    lightish = ((mx - mn) < 26) & (mn > 150)
    near_bg = np.abs(rgb.astype(np.int16) - bg).max(axis=2) < tol
    flat = lightish | near_bg

    if lines:
        # Long straight strokes (ground lines, cell borders) even where they touch a drawing: thin runs of >= 81 px.
        # Opt-in per sheet: it also punches holes in pale flat fills.
        plain = (((mx - mn) < 40) & ~flat).astype(np.uint8)
        for k_line, k_thick in (((81, 1), (81, 9)), ((1, 81), (9, 81))):
            line = cv2.morphologyEx(plain, cv2.MORPH_OPEN, np.ones(k_line[::-1], np.uint8))
            thick = cv2.morphologyEx(plain, cv2.MORPH_OPEN, np.ones(k_thick[::-1], np.uint8))
            flat |= (line > 0) & (thick == 0)

    # Thin lines (cell borders, ground lines) become background so fenced cells still flood.
    ink = (~flat).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(ink, connectivity=8)
    for i in range(1, n):
        x, y, bw, bh, area = stats[i]
        fill = area / max(1, bw * bh)
        long_thin = min(bw, bh) <= 7 and max(bw, bh) >= 40
        sparse_big = (bw > w * 0.6 or bh > h * 0.6) and fill < 0.1
        if long_thin or sparse_big:
            flat[lab == i] = True

    reach = np.zeros((h + 2, w + 2), np.uint8)
    reach[1:-1, 1:-1] = flat.astype(np.uint8)
    n, lab = cv2.connectedComponents(reach, connectivity=4)
    edge = set(np.unique(np.concatenate([lab[1], lab[-2], lab[:, 1], lab[:, -2]]))) - {0}
    is_bg = np.isin(lab, list(edge))[1:-1, 1:-1]
    # Holes of plain sheet colour enclosed by the drawing (between legs, inside a tail curl).
    tight = (np.abs(rgb.astype(np.int16) - bg).max(axis=2) < 12) & ((mx - mn) < 14)
    holes = flat & ~is_bg & tight
    hn, hlab, hstats, _ = cv2.connectedComponentsWithStats(holes.astype(np.uint8), connectivity=4)
    for i in range(1, hn):
        if hstats[i][4] >= 150:
            is_bg[hlab == i] = True
    return is_bg


def blobs(fg: np.ndarray, sheet_w: int, sheet_h: int) -> list[dict]:
    n, lab, stats, cents = cv2.connectedComponentsWithStats(fg.astype(np.uint8), connectivity=8)
    out = []
    for i in range(1, n):
        x, y, bw, bh, area = (int(v) for v in stats[i])
        if area < 25:
            continue
        cx, cy = cents[i]
        # The generator's sparkle watermark in the bottom-right corner.
        if cx > sheet_w * 0.9 and cy > sheet_h * 0.86 and area < sheet_w * sheet_h * 0.004:
            continue
        out.append({"i": i, "box": (x, y, x + bw, y + bh), "area": area, "c": (cx, cy)})
    return out, lab


def cell_of(c: tuple[float, float], rows: int, cols: int, w: int, h: int) -> int:
    return min(rows - 1, int(c[1] * rows / h)) * cols + min(cols - 1, int(c[0] * cols / w))


def union(boxes):
    return (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))


def pose_group(cell_blobs: list[dict], margin: float = 0.08) -> list[dict]:
    """The creature of a cell: its biggest blob and the pieces touching its box, nothing under its feet."""
    main = max(cell_blobs, key=lambda b: b["area"])
    x0, y0, x1, y1 = main["box"]
    mx, my = (x1 - x0) * margin, (y1 - y0) * margin
    keep = [main]
    for b in cell_blobs:
        if b is main:
            continue
        bx0, by0, bx1, by1 = b["box"]
        if by0 >= y1 - 2 or by1 <= y0 + 2:
            continue  # below the feet or above the head: a label or a ground line
        if bx1 < x0 - mx or bx0 > x1 + mx or by1 < y0 - my or by0 > y1 + my:
            continue
        if b["area"] < main["area"] * 0.0015:
            continue
        keep.append(b)
    return keep


def cutout(rgba: np.ndarray, lab: np.ndarray, group: list[dict], box) -> np.ndarray:
    x0, y0, x1, y1 = box
    ids = [b["i"] for b in group]
    mask = np.isin(lab[y0:y1, x0:x1], ids).astype(np.uint8) * 255
    # Soften the hard flood edge by a pixel so no grey rim is left.
    mask = cv2.erode(mask, np.ones((2, 2), np.uint8))
    mask = cv2.GaussianBlur(mask, (3, 3), 0.6)
    out = rgba[y0:y1, x0:x1].copy()
    out[..., 3] = np.minimum(out[..., 3], mask)
    return out


def resize(arr: np.ndarray, s: float) -> Image.Image:
    im = Image.fromarray(arr, "RGBA")
    w, h = max(1, round(im.width * s)), max(1, round(im.height * s))
    return im.resize((w, h), Image.LANCZOS)


def cut_sheet(work: Path, sheet: dict, ov: dict, args) -> list[tuple[str, Image.Image]]:
    sid = sheet["id"]
    src = work / f"{sid}.png"
    if not src.exists():
        print(f"--  {sid}: not generated")
        return []
    img = Image.open(src).convert("RGBA")
    rgba = np.array(img)
    h, w = rgba.shape[:2]
    is_bg = background(rgba[..., :3], ov.get("tol", 30), ov.get("lines", False))
    rows, cols = ov.get("grid", sheet["grid"])
    if ov.get("clear_top"):
        # Labels printed at the top of every cell.
        top, left = ov["clear_top"]
        for r in range(rows):
            for c in range(cols):
                y, x = round(r * h / rows), round(c * w / cols)
                is_bg[y:y + round(h / rows * top), x:x + round(w / cols * left)] = True
    found, lab = blobs(~is_bg, w, h)
    names = sheet["assets"]
    pick = ov.get("pick", list(range(len(names))))
    cells: dict[int, list[dict]] = {}
    for b in found:
        cells.setdefault(cell_of(b["c"], rows, cols, w, h), []).append(b)

    kind = sheet.get("kind")
    mode = "pose" if kind == "creature" else "frames" if sheet.get("trim") == "uniform" else "item"
    out: list[tuple[str, Image.Image]] = []

    if mode == "pose":
        groups = []
        for k in pick:
            if not cells.get(k):
                print(f"!!  {sid}: cell {k} is empty")
                return []
            g = pose_group(cells[k], ov.get("margin", 0.08))
            groups.append((g, union([b["box"] for b in g])))
        canvas = args.canvas
        body = ov.get("body", 0.8)
        margin = round(canvas * 0.04)
        idle_h = groups[0][1][3] - groups[0][1][1]
        s = body * canvas / idle_h
        for _, (x0, y0, x1, y1) in groups:
            s = min(s, canvas * 0.96 / (x1 - x0), (canvas - margin - 4) / (y1 - y0))
        for name, (g, box) in zip(names, groups):
            part = resize(cutout(rgba, lab, g, box), s)
            if ov.get("flip"):
                part = part.transpose(Image.FLIP_LEFT_RIGHT)
            c = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
            c.alpha_composite(part, ((canvas - part.width) // 2, canvas - margin - part.height))
            out.append((name, c))
        return out

    cw, ch = w / cols, h / rows
    if mode == "frames":
        per_row = len(names) // rows
        for r in range(rows):
            ks = pick[r * per_row:(r + 1) * per_row]
            rel = []
            for k in ks:
                cx0, cy0 = (k % cols) * cw, (k // cols) * ch
                bs = cells.get(k, [])
                if not bs:
                    rel.append(None)
                    continue
                x0, y0, x1, y1 = union([b["box"] for b in bs])
                rel.append((x0 - cx0, y0 - cy0, x1 - cx0, y1 - cy0))
            known = [r_ for r_ in rel if r_]
            u = union(known)
            side = int(np.ceil(max(u[2] - u[0], u[3] - u[1]))) + 2
            mx, my = (u[0] + u[2]) / 2, (u[1] + u[3]) / 2
            for name, k, r_ in zip(names[r * per_row:(r + 1) * per_row], ks, rel):
                c = Image.new("RGBA", (side, side), (0, 0, 0, 0))
                if r_:
                    cx0, cy0 = (k % cols) * cw, (k // cols) * ch
                    bs = cells[k]
                    box = union([b["box"] for b in bs])
                    part = Image.fromarray(cutout(rgba, lab, bs, box), "RGBA")
                    c.alpha_composite(part, (int(box[0] - cx0 - mx + side / 2), int(box[1] - cy0 - my + side / 2)))
                out.append((name, c.resize((args.frame, args.frame), Image.LANCZOS)))
        return out

    for name, k in zip(names, pick):
        bs = cells.get(k, [])
        if not bs:
            print(f"!!  {sid}/{name}: cell {k} is empty")
            continue
        main = max(bs, key=lambda b: b["area"])
        bs = [b for b in bs if b["area"] >= main["area"] * 0.002]
        box = union([b["box"] for b in bs])
        out.append((name, Image.fromarray(cutout(rgba, lab, bs, box), "RGBA")))
    return out


def preview(items: list[tuple[str, Image.Image]], dst: Path, cell: int = 192) -> None:
    cols = 6 if items and items[0][1].width == items[0][1].height else 8
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cell, rows * cell), (255, 255, 255, 255))
    tile = 12
    for y in range(0, sheet.height, tile):
        for x in range(0, sheet.width, tile):
            if (x // tile + y // tile) % 2:
                sheet.paste((225, 225, 225, 255), (x, y, x + tile, y + tile))
    for n, (_, im) in enumerate(items):
        t = im.copy()
        t.thumbnail((cell - 4, cell - 4))
        x, y = (n % cols) * cell, (n // cols) * cell
        sheet.alpha_composite(t, (x + (cell - t.width) // 2, y + cell - 2 - t.height))
    sheet.convert("RGB").save(dst)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("batch")
    p.add_argument("--sheet", nargs="*")
    p.add_argument("--variant", default="a")
    p.add_argument("--canvas", type=int, default=512)
    p.add_argument("--frame", type=int, default=256)
    p.add_argument("--preview", action="store_true", help="write .qa/<batch>_<sheet>.png contact sheets")
    args = p.parse_args()
    data, overrides, work = load(args.batch)
    cand = ROOT / ".candidates"
    cand.mkdir(parents=True, exist_ok=True)
    qa = ROOT / ".qa" / args.batch
    qa.mkdir(parents=True, exist_ok=True)
    for sheet in data["sheets"]:
        sid = sheet["id"]
        if args.sheet and sid not in args.sheet:
            continue
        ov = overrides.get(sid, {})
        if ov.get("skip"):
            print(f"--  {sid}: skipped ({ov['skip']})")
            continue
        items = cut_sheet(work, sheet, ov, args)
        for name, im in items:
            im.save(cand / f"{name}_{args.variant}.png")
        if items:
            print(f"OK  {sid}: {len(items)} cut")
            if args.preview:
                preview(items, qa / f"{sid}.png")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
