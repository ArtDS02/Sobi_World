"""Cut the map v2 kit sheets (batch adventure-14-map-v2, or its smooth redraw adventure-14b-map-v2-redo with --batch) into candidates.

art.py cut splits on empty bands and falls back to an even grid when a sheet has
uneven cells, white grid lines or a different grey per cell - most kit sheets do.
This cutter instead:
  1. removes the Gemini sparkle mark (bottom-right) by inpainting,
  2. finds sprites as connected blobs of non-background pixels,
  3. groups blobs into the manifest's rows (by vertical gaps), then into each row's
     cells (by horizontal gaps), so wide and narrow cells both work,
  4. keeps texture tiles (`_tile_` assets that fill their box) opaque and square,
     everything else gets its outer background made transparent.

Usage:
  python scripts/art/map_layouts_v2/cut_kit.py [--sheet FT --sheet FE ...] [--variant a] [--qa]
Writes art_inbox/.candidates/<asset>_<variant>.png (overwrites), and with --qa a
contact sheet per sheet in art_inbox/.qa/map-v2/.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[3]
ART = ROOT / "art_inbox"
BATCH = ART / ".batch" / "adventure-14-map-v2"
CAND = ART / ".candidates"
QA = ART / ".qa" / "map-v2"

MIN_BLOB = 260          # px; smaller blobs are speckle
BRIDGE = 11             # closing kernel that joins the parts of one object
TILE_FILL = 0.86        # a tile cell must fill this much of its box to stay opaque

# Sheets whose layout grouping cannot work out (touching tiles, overlapping columns,
# an extra row): one source box (x0, y0, x1, y1) per asset, in manifest order.
MANUAL: dict[str, list[tuple[int, int, int, int]]] = {
    # rubble and water tiles touch each other
    "RT": [(21, 46, 346, 375), (358, 46, 682, 375), (694, 46, 1018, 375), (1030, 46, 1355, 375),
           (21, 393, 346, 725), (357, 392, 688, 725), (689, 392, 1019, 725), (1029, 393, 1356, 725)],
    # an extra row: the two broken walls sit on a third row; the second is unused
    "RE": [(60, 68, 625, 184), (754, 64, 943, 187), (1119, 64, 1305, 187),
           (206, 296, 457, 475), (749, 325, 1317, 443), (137, 562, 545, 722)],
    # door and tree overlap in x; the tree reaches the top edge
    "RL": [(23, 81, 470, 732), (473, 81, 870, 725), (873, 0, 1376, 730)],
    # an extra row: the plain surf strip (bottom-left) is unused
    "CE": [(83, 71, 655, 273), (752, 76, 960, 271), (1071, 81, 1294, 269),
           (84, 317, 411, 515), (708, 317, 1292, 515), (708, 550, 1293, 710)],
}

# The same for the smooth redraw (batch adventure-14b-map-v2-redo), whose sheets have their own layout.
MANUAL_REDO: dict[str, list[tuple[int, int, int, int]]] = {
    # an extra third row (a second stairs, a bank corner): the waterfall sits on it
    "FE": [(30, 55, 660, 215), (730, 55, 995, 215), (1075, 55, 1340, 215),
           (112, 308, 402, 462), (533, 308, 1300, 462), (1093, 543, 1315, 732)],
    # three rows; the left end (rounded on its left) is drawn right of the right end; the bank with ground on top is used
    "ME": [(45, 58, 662, 236), (1058, 58, 1330, 236), (712, 58, 984, 236),
           (186, 298, 500, 476), (45, 532, 662, 711), (712, 532, 1330, 711)],
    "RE": [(45, 58, 662, 252), (740, 55, 1000, 285), (1045, 55, 1300, 285),
           (45, 333, 665, 720), (712, 333, 1330, 482), (710, 525, 1332, 728)],
    # two extra fallen columns and an extra rubble pile in between are unused
    "RP": [(64, 27, 281, 472), (392, 37, 562, 440), (747, 53, 949, 207), (1516, 53, 1728, 201),
           (996, 292, 1145, 440), (1325, 307, 1420, 419), (1606, 254, 1723, 440), (1866, 281, 2078, 461)],
    # captions above / below each tile: the tile squares only
    "MT": [(52, 62, 323, 340), (386, 62, 657, 340), (719, 62, 990, 340), (1053, 62, 1324, 340),
           (52, 428, 323, 706), (386, 428, 657, 706), (719, 428, 990, 706), (1053, 428, 1324, 706)],
    # drawn twice (two rows): the top row
    "S1": [(40, 80, 340, 318), (378, 38, 668, 346), (712, 72, 1004, 312), (1072, 98, 1332, 346)],    # second drawing: opaque panels with the sea in them; the cliff strip stops where the water starts
    "CE": [(50, 59, 659, 268), (717, 59, 993, 342), (1049, 59, 1326, 343),
           (50, 425, 327, 709), (383, 426, 659, 709), (717, 426, 1326, 709)],
    # drawn twice (two rows), sheet saved as I.png and copied to I1.png: the top row
    "I1": [(70, 117, 279, 327), (318, 119, 525, 324), (564, 118, 774, 325), (813, 119, 1020, 324), (1058, 117, 1269, 326), (1306, 118, 1515, 325)],
}
# Tiles whose light details read as background (kept whole), sprites whose grey middle is not a hole,
# and springs standing on a cut-off patch of sand (the sand is removed).
FORCE_TILE = {"adv_map_ruins_tile_path"}
KEEP_HOLES = {"adv_map_puzzle_mirror", "ui_icon_foe_elite", "ui_icon_foe_subboss"}
NO_SAND = {"adv_map_spring_mountain", "adv_map_spring_ruins"}


def remove_sparkle(img: np.ndarray) -> np.ndarray:
    """Inpaint the semi-transparent four-point star Gemini stamps on every sheet.

    It is always centred 120 px from the right and bottom edges, about 48 px wide.
    """
    h, w = img.shape[:2]
    cx, cy, r = w - 120, h - 120, 34
    # a white overlay lifts the darkest channel, whatever the colour underneath
    lo = img.min(2)
    lift = lo.astype(np.int16) - cv2.medianBlur(lo, 41).astype(np.int16)
    mask = np.zeros((h, w), np.uint8)
    win = (lift[cy - r:cy + r, cx - r:cx + r] > 5).astype(np.uint8)
    if win.sum() < 40:
        print("    (no sparkle found)")
        return img
    mask[cy - r:cy + r, cx - r:cx + r] = win * 255
    mask = cv2.dilate(mask, np.ones((5, 5), np.uint8))
    near_bg = background_mask(img[cy - 2 * r:cy + 2 * r, cx - 2 * r:cx + 2 * r]).mean()
    if near_bg > 0.03:
        return cv2.inpaint(img, mask, 6, cv2.INPAINT_TELEA)
    # inside a texture tile inpainting smears: copy the texture from just left (or above)
    out = img.copy()
    soft = cv2.GaussianBlur(mask, (9, 9), 0).astype(np.float32)[..., None] / 255
    for dx, dy in ((-2 * r - 8, 0), (0, -2 * r - 8), (2 * r + 8, 0)):
        if cx + dx - r >= 0 and cy + dy - r >= 0 and cx + dx + r < w:
            src = np.roll(np.roll(img, -dy, axis=0), -dx, axis=1)
            out = (src * soft + img * (1 - soft)).astype(np.uint8)
            break
    return out


def background_mask(img: np.ndarray) -> np.ndarray:
    """Flat, light, unsaturated pixels: the sheet grey, per-cell greys, grid lines."""
    sat = img.max(2).astype(np.int16) - img.min(2)
    lum = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    mean = cv2.blur(lum, (5, 5))
    sq = cv2.blur(lum * lum, (5, 5))
    std = np.sqrt(np.maximum(sq - mean * mean, 0))
    return (sat <= 14) & (lum >= 165) & (std < 5)


def split_groups(intervals: list[tuple[int, int]], k: int) -> list[list[int]] | None:
    """Split items (by their [a, b) interval) into k groups at the k-1 widest gaps."""
    order = sorted(range(len(intervals)), key=lambda i: intervals[i][0])
    merged: list[list[int]] = []          # runs of overlapping items
    end = None
    for i in order:
        a, b = intervals[i]
        if merged and a < end:
            merged[-1].append(i)
            end = max(end, b)
        else:
            merged.append([i])
            end = b
    if len(merged) < k:
        return None
    ends = [max(intervals[i][1] for i in run) for run in merged]
    starts = [min(intervals[i][0] for i in run) for run in merged]
    gaps = sorted(range(len(merged) - 1), key=lambda j: starts[j + 1] - ends[j], reverse=True)[:k - 1]
    cuts = sorted(gaps)
    groups, cur = [], []
    for j, run in enumerate(merged):
        cur.extend(run)
        if j in cuts:
            groups.append(cur)
            cur = []
    groups.append(cur)
    return groups


def cut_sheet(sheet: dict, variant: str) -> list[tuple[str, np.ndarray | None]]:
    sid = sheet["id"]
    img = cv2.imread(str(BATCH / f"{sid}.png"), cv2.IMREAD_COLOR)
    img = remove_sparkle(img)
    bg = background_mask(img)
    # looser grey test for the transparency flood (catches line rims and soft edges)
    loose = ((img.max(2).astype(np.int16) - img.min(2)) <= 14) & (cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) >= 165)
    content = (~bg).astype(np.uint8)
    content = cv2.morphologyEx(content, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    # white grid lines (and their anti-aliased rims): bright runs across most of the sheet
    h, w = img.shape[:2]
    sat = img.max(2).astype(np.int16) - img.min(2)
    bright = ((cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) >= 215) & (sat <= 20)).astype(np.uint8)
    lines = (cv2.morphologyEx(bright, cv2.MORPH_OPEN, np.ones((1, int(w * 0.6)), np.uint8))
             | cv2.morphologyEx(bright, cv2.MORPH_OPEN, np.ones((int(h * 0.6), 1), np.uint8)))
    lines = cv2.dilate(lines, np.ones((7, 7), np.uint8))
    content &= 1 - lines
    joined = cv2.morphologyEx(content, cv2.MORPH_CLOSE, np.ones((BRIDGE, BRIDGE), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(joined)
    blobs = [i for i in range(1, n) if st[i][4] >= MIN_BLOB]

    # cell-border lines: sparse blobs (a few px of rim over a big box) or thin strips
    blobs = [i for i in blobs
             if st[i][4] / float(st[i][2] * st[i][3]) >= 0.06 and min(st[i][2], st[i][3]) >= 8]
    names = sheet["assets"]
    cells: list[tuple[tuple[int, int, int, int], np.ndarray]] = []
    # The hand-drawn boxes fit the first drawing of those sheets only (batch adventure-14-map-v2).
    manual = MANUAL if BATCH.name == "adventure-14-map-v2" else MANUAL_REDO
    if sid in manual:
        for x0, y0, x1, y1 in manual[sid]:
            member = np.zeros_like(joined)
            member[y0:y1, x0:x1] = joined[y0:y1, x0:x1]
            ys, xs = np.nonzero(member)
            cells.append(((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1), member))
    else:
        counts = [len(r) for r in sheet["rows"]]
        rows = split_groups([(st[i][1], st[i][1] + st[i][3]) for i in blobs], len(counts))
        if rows is None:
            print(f"!!  {sid}: found fewer row bands than {len(counts)}")
            return [(nm, None) for nm in names]
        rows.sort(key=lambda g: min(st[blobs[i]][1] for i in g))
        for r, (grp, k) in enumerate(zip(rows, counts)):
            sub = [blobs[i] for i in grp]
            cols = split_groups([(st[i][0], st[i][0] + st[i][2]) for i in sub], k)
            if cols is None:
                print(f"!!  {sid}: row {r + 1} has fewer column bands than {k}")
                return [(nm, None) for nm in names]
            cols.sort(key=lambda g: min(st[sub[i]][0] for i in g))
            for g in cols:
                ids = [sub[i] for i in g]
                box = (min(st[i][0] for i in ids), min(st[i][1] for i in ids),
                       max(st[i][0] + st[i][2] for i in ids), max(st[i][1] + st[i][3] for i in ids))
                cells.append((box, np.isin(lab, ids).astype(np.uint8)))

    out = []
    for name, ((x0, y0, x1, y1), member) in zip(names, cells):
        crop = img[y0:y1, x0:x1]
        fill = content[y0:y1, x0:x1].mean()
        if ("_tile_" in name and fill >= TILE_FILL) or name in FORCE_TILE:
            inset = 8
            t = crop[inset:-inset, inset:-inset]
            s = min(t.shape[:2])
            oy, ox = (t.shape[0] - s) // 2, (t.shape[1] - s) // 2
            t = t[oy:oy + s, ox:ox + s]
            rgba = cv2.cvtColor(t, cv2.COLOR_BGR2BGRA)
        else:
            # transparent = background pixels connected to this cell's border
            region = member[y0:y1, x0:x1]
            outer = (loose[y0:y1, x0:x1] | (region == 0) | (lines[y0:y1, x0:x1] > 0)).astype(np.uint8)
            outer = np.pad(outer, 1, constant_values=1)
            ff = outer.copy()
            m = np.zeros((ff.shape[0] + 2, ff.shape[1] + 2), np.uint8)
            cv2.floodFill(ff, m, (0, 0), 2)
            transparent = (ff == 2)[1:-1, 1:-1] | (lines[y0:y1, x0:x1] > 0)
            # enclosed holes of sheet grey (inside a fence, under an arch)
            if transparent.any() and name not in KEEP_HOLES:
                ref = np.median(crop[transparent & bg[y0:y1, x0:x1]], axis=0) if (transparent & bg[y0:y1, x0:x1]).any() else None
                if ref is not None:
                    near = (np.abs(crop.astype(np.int16) - ref.astype(np.int16)).max(2) <= 10) & bg[y0:y1, x0:x1] & ~transparent
                    hn, hl, hs, _ = cv2.connectedComponentsWithStats(near.astype(np.uint8))
                    for i in range(1, hn):
                        if hs[i][4] >= 250:
                            transparent |= hl == i
            if name in NO_SAND:
                c = crop.astype(np.int16)  # BGR
                sand = (c[..., 2] > 190) & (c[..., 1] > 150) & (c[..., 2] - c[..., 0] > 55) & (c[..., 0] < 170)
                # only the big patch the cell edge cut off, not the small light faces of the rocks
                sn, sl, ss, _ = cv2.connectedComponentsWithStats(sand.astype(np.uint8))
                sand = np.isin(sl, [i for i in range(1, sn) if ss[i][4] >= 1500])
                transparent |= cv2.dilate(sand.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
                # drop what the sand cut loose (crumbs of its rim)
                n2, l2, s2, _ = cv2.connectedComponentsWithStats((~transparent).astype(np.uint8))
                if n2 > 1:
                    keep = 1 + int(np.argmax(s2[1:, 4]))
                    transparent |= (l2 != keep) & (l2 > 0)
            alpha = np.where(transparent, 0, 255).astype(np.uint8)
            alpha = cv2.medianBlur(alpha, 3)
            rgba = cv2.cvtColor(crop, cv2.COLOR_BGR2BGRA)
            rgba[..., 3] = alpha
            ys, xs = np.nonzero(alpha)
            rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        cv2.imwrite(str(CAND / f"{name}_{variant}.png"), rgba)
        out.append((name, rgba))
        print(f"OK  {sid}/{name}: {rgba.shape[1]}x{rgba.shape[0]}")
    return out


def contact(sid: str, cuts: list[tuple[str, np.ndarray | None]]) -> None:
    cell, cols = 220, 4
    rows = (len(cuts) + cols - 1) // cols
    sheet = np.full((rows * (cell + 18), cols * cell, 3), 60, np.uint8)
    yy, xx = np.mgrid[0:cell - 6, 0:cell - 6]
    check = np.where(((yy // 16 + xx // 16) % 2)[..., None] == 1, [210, 200, 200], [255, 255, 255]).astype(np.uint8)
    for k, (name, im) in enumerate(cuts):
        x, y = (k % cols) * cell, (k // cols) * (cell + 18)
        bgc = check.copy()
        if im is not None:
            s = (cell - 6) / max(im.shape[:2])
            t = cv2.resize(im, (max(1, int(im.shape[1] * s)), max(1, int(im.shape[0] * s))), interpolation=cv2.INTER_AREA)
            oy, ox = (cell - 6 - t.shape[0]) // 2, (cell - 6 - t.shape[1]) // 2
            a = t[..., 3:4].astype(np.float32) / 255
            roi = bgc[oy:oy + t.shape[0], ox:ox + t.shape[1]]
            roi[:] = (t[..., :3] * a + roi * (1 - a)).astype(np.uint8)
        sheet[y:y + cell - 6, x + 3:x + cell - 3] = bgc
        cv2.putText(sheet, name.replace("adv_map_", "")[:32], (x + 4, y + cell + 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.36, (0, 255, 255), 1)
    cv2.imwrite(str(QA / f"{sid}.png"), sheet)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--sheet", action="append")
    ap.add_argument("--variant", default="a")
    ap.add_argument("--qa", action="store_true")
    ap.add_argument("--batch", default="adventure-14-map-v2", help="the batch folder (adventure-14b-map-v2-redo for the smooth redraw)")
    args = ap.parse_args()
    global BATCH
    BATCH = ART / ".batch" / args.batch
    data = json.loads((BATCH / "batch.json").read_text(encoding="utf-8"))
    QA.mkdir(parents=True, exist_ok=True)
    for sheet in data["sheets"]:
        if sheet.get("mode", "sheet") != "sheet" or not sheet.get("rows"):
            continue
        if args.sheet and sheet["id"] not in args.sheet:
            continue
        if not (BATCH / f"{sheet['id']}.png").exists():
            print(f"--  {sheet['id']}: not generated")
            continue
        cuts = cut_sheet(sheet, args.variant)
        if args.qa:
            contact(sheet["id"], cuts)


if __name__ == "__main__":
    main()
