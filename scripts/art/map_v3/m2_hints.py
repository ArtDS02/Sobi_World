# Hint and guide pictures for the M2 (map_forest_deep) pilot, drawn from its v3 plan (m2_layout.py) of the new map direction (docs/maps/SOBI_ADVENTURE_NEW_MAP_DIRECTION.md,
# plan docs/maps/v3/M2_PLAN.md). Reads the area from content/adventure/maps.json and writes into art_inbox/.batch/adventure-15-m2-3q/:
#   2_layout_hint.png          2048 x 1152 (32 px / tile), no text: the area's ground plan with organic edges, for Gemini to repaint.
#   3_scale_hint.png           the leader's height against the tile grid, a big tree, a boulder and a cliff, no text (props batches).
#   guide/M2_guide_annotated.png  2560 x 1440 (40 px / tile): the plan + the 40 px grid + areas, routes, every gameplay id (owner only).
#   guide/M2_before_grid.png      the "before" capture with the same grid and ids (owner only).
# Tooling only: nothing here is read by the game. Usage: python scripts/art/map_v3/m2_hints.py   (from the repo root)
import json
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

REPO = Path(__file__).resolve().parents[3]
BATCH = REPO / "art_inbox" / ".batch" / "adventure-15-m2-3q"
GUIDE = BATCH / "guide"
MAP_ID = "map_forest_deep"
FONT = "C:/Windows/Fonts/arial.ttf"
FONT_BOLD = "C:/Windows/Fonts/arialbd.ttf"
sys.path.insert(0, str(Path(__file__).parent))

# Ground classes of the plan, drawn in this order (later wins where the blurred masks tie).
CLASSES = ["forest", "ground", "path", "water", "plateau", "cliff"]
COLOUR = {
    "forest": (62, 107, 53),
    "ground": (156, 203, 99),
    "path": (217, 183, 126),
    "water": (79, 169, 222),
    "plateau": (185, 210, 122),
    "cliff": (138, 106, 71),
}
FRONT = (40, 74, 38)  # the south-facing front of a forest mass (3/4: its face is seen)
CLIFF_DARK = (96, 72, 48)
STAIRS = (201, 180, 142)
BRIDGE = (154, 107, 60)
# How much each class pulls when blurred masks compete (paths and water keep their width).
WEIGHT = {"forest": 1.0, "ground": 1.0, "path": 1.15, "water": 1.2, "plateau": 1.05, "cliff": 1.3}


def load_map():
    maps = json.loads((REPO / "content" / "adventure" / "maps.json").read_text(encoding="utf8"))["maps"]
    by_id = {m["id"]: m for m in maps}
    return by_id[MAP_ID], by_id


def classify(c):
    return {
        "#": "forest", ".": "ground", "c": "ground", ",": "path", "s": "path", "=": "path",
        "~": "water", "w": "water", "^": "plateau", "F": "cliff",
    }.get(c, "forest")


# The mountain's own plan colours: rock masses, gravel ground, lava for its `~`.
PALETTES = {
    "zone_ruins": {
        "forest": (128, 120, 110), "ground": (200, 194, 176), "path": (228, 220, 198), "water": (64, 120, 160), "plateau": (178, 172, 152),
        "cliff": (122, 114, 106), "front": (78, 70, 64), "mortar": (92, 86, 80), "front_h": 1.3,
    },
    "zone_coast": {
        "forest": (104, 112, 86), "ground": (242, 224, 172), "path": (226, 200, 150), "water": (62, 164, 214), "plateau": (222, 208, 152),
        "cliff": (164, 132, 96), "front": (86, 90, 70),
    },
    "zone_mountain": {
        "forest": (92, 80, 70), "ground": (196, 178, 142), "path": (226, 206, 160), "water": (236, 112, 40), "plateau": (170, 160, 128),
        "cliff": (128, 100, 74), "front": (66, 56, 50),
    },
}


def plan(m, px):
    """The ground plan at `px` per tile: blurred class masks (organic edges), 3/4 fronts on forest masses, the cliff band, stairs, bridges."""
    cols, rows = m["cols"], m["rows"]
    W, H = cols * px, rows * px
    grid = [[classify(c) for c in row] for row in m["terrain"]]
    # Exits continue the way out to the edge so the painting opens there.
    for e in m["exits"]:
        for y in range(e["y"], e["y"] + e["h"]):
            for x in range(e["x"], e["x"] + e["w"]):
                grid[y][x] = "path"
    fields = []
    for k in CLASSES:
        mask = Image.new("L", (cols, rows), 0)
        mask.putdata([255 if grid[y][x] == k else 0 for y in range(rows) for x in range(cols)])
        big = mask.resize((W, H), Image.NEAREST).filter(ImageFilter.GaussianBlur(px * 0.42))
        fields.append(np.asarray(big, dtype=np.float32) * WEIGHT[k])
    winner = np.argmax(np.stack(fields), axis=0)
    rgb = np.zeros((H, W, 3), dtype=np.uint8)
    for i, k in enumerate(CLASSES):
        rgb[winner == i] = PALETTES.get(m.get("zoneId", ""), {}).get(k, COLOUR[k])
    forest = winner == CLASSES.index("forest")
    open_ground = ~forest & (winner != CLASSES.index("cliff"))
    pal = PALETTES.get(m.get("zoneId", ""), {})
    # A forest mass seen in 3/4: the strip just above open ground is its front face (darker), about 0.8 tile high.
    face = np.zeros_like(forest)
    for d in range(1, int(px * pal.get("front_h", 0.8)) + 1):
        below = np.zeros_like(forest)
        below[:-d] = open_ground[d:]
        face |= forest & below
    rgb[face] = pal.get("front", FRONT)
    # Masonry zones: the mass is drawn as courses of big stone blocks (running bond, one tile by half a tile), so the plan reads as
    # solid built stone filling its whole footprint rather than a flat colour the image AI keeps as background.
    if "mortar" in pal:
        yy, xx = np.mgrid[0:H, 0:W]
        course = yy // (px // 2)
        joint = ((yy % (px // 2)) < 2) | (((xx + (course % 2) * (px // 2)) % px) < 2)
        rgb[forest & ~face & joint] = pal["mortar"]
        rgb[face & ((xx % px) < 2)] = pal["mortar"]
    # The cliff band: darker toward its foot, like a face lit from above.
    cliff = winner == CLASSES.index("cliff")
    ys = np.arange(H)[:, None].repeat(W, axis=1)
    dark = cliff & ((ys % px) > px * 0.55)
    rgb[dark] = CLIFF_DARK
    img = Image.fromarray(rgb, "RGB")
    d = ImageDraw.Draw(img)
    for y, row in enumerate(m["terrain"]):
        for x, c in enumerate(row):
            if c == "s":
                d.rectangle([x * px, y * px, (x + 1) * px - 1, (y + 1) * px - 1], fill=STAIRS)
                for k in range(4):
                    yy = y * px + k * px // 4
                    d.line([x * px, yy, (x + 1) * px, yy], fill=CLIFF_DARK, width=max(1, px // 16))
            if c == "=":
                d.rectangle([x * px, y * px, (x + 1) * px - 1, (y + 1) * px - 1], fill=BRIDGE)
                for k in range(1, 4):
                    xx = x * px + k * px // 4
                    d.line([xx, y * px, xx, (y + 1) * px], fill=(110, 74, 40), width=max(1, px // 20))
    return img.filter(ImageFilter.SMOOTH_MORE)


from m2_layout import ARRIVALS, AREAS, HIDDEN, MAIN, SECONDARY, draft  # noqa: E402  (the v3 plan of M2)


def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT, size)


def grid_over(img, px, cols, rows):
    over = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(over)
    for x in range(cols + 1):
        d.line([x * px, 0, x * px, rows * px], fill=(0, 0, 0, 110 if x % 4 == 0 else 45), width=2 if x % 4 == 0 else 1)
    for y in range(rows + 1):
        d.line([0, y * px, cols * px, y * px], fill=(0, 0, 0, 110 if y % 4 == 0 else 45), width=2 if y % 4 == 0 else 1)
    f = font(12)
    for x in range(0, cols, 4):
        d.text((x * px + 2, 1), str(x), fill=(255, 255, 255, 230), font=f, stroke_width=2, stroke_fill=(0, 0, 0, 230))
    for y in range(0, rows, 4):
        d.text((2, y * px + 2), str(y), fill=(255, 255, 255, 230), font=f, stroke_width=2, stroke_fill=(0, 0, 0, 230))
    return Image.alpha_composite(img.convert("RGBA"), over)


def objects_over(img, m, by_id, px, arrivals=None):
    """Every gameplay id at its tile, the exits with where they lead and where one arrives."""
    over = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(over)
    f = font(13, True)

    def mark(x, y, w, h, label, colour):
        d.rectangle([x * px, y * px, (x + w) * px - 1, (y + h) * px - 1], outline=colour + (255,), width=3, fill=colour + (70,))
        d.text((x * px + 2, (y + h) * px + 1), label, fill=(255, 255, 255, 255), font=f, stroke_width=3, stroke_fill=(0, 0, 0, 255))

    mark(m["spawn"]["x"], m["spawn"]["y"], 1, 1, "spawn", (90, 200, 255))
    mark(m["portal"]["x"], m["portal"]["y"], 2, 2, "portal", (90, 200, 255))
    for g in m["groups"]:
        mark(g["x"], g["y"], 1, 1, f"{g['id']} ({g['kind']}{', sleep' if g.get('sleep') else ''})", (255, 70, 70) if g["kind"] == "normal" else (255, 140, 0))
    for c in m["chests"]:
        mark(c["x"], c["y"], 1, 1, f"{c['id']} ({c.get('type', 'wood')})", (255, 215, 0))
    for g in m["gates"]:
        mark(g["x"], g["y"], g["w"], g["h"], f"{g['id']} ({g['element']}{', false wall' if g.get('look') == 'crack' else ''})", (255, 120, 220))
    for c in m["covers"]:
        d.rectangle([c["x"] * px, c["y"] * px, (c["x"] + c["w"]) * px - 1, (c["y"] + c["h"]) * px - 1], outline=(190, 120, 255, 255), width=4)
        d.text((c["x"] * px + 4, c["y"] * px + 4), f"{c['id']} ({c['look']})", fill=(255, 255, 255, 255), font=f, stroke_width=3, stroke_fill=(60, 0, 90, 255))
    for s in m["springs"]:
        mark(s["x"], s["y"], 1, 1, s["id"], (80, 220, 255))
    for n in m["npcs"]:
        mark(n["x"], n["y"], 1, 1, n["id"], (120, 255, 160))
    for l in m["lore"]:
        mark(l["x"], l["y"], 1, 1, l["id"], (220, 220, 220))
    for p in m["props"]:
        mark(p["x"], p["y"], 3, 2, p["prop"], (255, 210, 60))
    for e in m["exits"]:
        back = next((x for o in by_id.values() for x in o["exits"] if x["to"] == MAP_ID and o["id"] == e["to"]), None)
        label = f"{e['id']} -> {e['to']} ({e['kind']}{', ' + e['lock'] if e.get('lock') else ''}); lands there at {e['arriveX']},{e['arriveY']}"
        if back:
            land = (arrivals or {}).get(f"{e['to']}/{back['id']}", (back["arriveX"], back["arriveY"]))
            label += f"; from there ({back['id']}) lands here at {land[0]},{land[1]}"
        d.rectangle([e["x"] * px, e["y"] * px, (e["x"] + e["w"]) * px - 1, (e["y"] + e["h"]) * px - 1], outline=(255, 255, 255, 255), width=4, fill=(255, 255, 255, 120))
        tx = min(max(e["x"] * px - 40, 4), img.size[0] - 8 - int(d.textlength(label, font=font(14, True))))
        ty = e["y"] * px - 22 if e["y"] > 2 else (e["y"] + e["h"]) * px + 4
        if e["y"] >= m["rows"] - 1:
            ty = e["y"] * px - 24
        d.text((tx, ty), label, fill=(255, 255, 255, 255), font=font(14, True), stroke_width=3, stroke_fill=(0, 0, 0, 255))
    return Image.alpha_composite(img.convert("RGBA"), over)


def routes_and_areas(img, px):
    over = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(over)
    for tag, name, (x0, y0, x1, y1), colour in AREAS:
        d.rounded_rectangle([x0 * px, y0 * px, x1 * px, y1 * px], radius=px, outline=colour + (230,), width=3)
        d.text((x0 * px + 8, y0 * px + 6), f"{tag}: {name}", fill=colour + (255,), font=font(18, True), stroke_width=3, stroke_fill=(0, 0, 0, 255))

    def line(points, colour, width, dash=0):
        pts = [((x + 0.5) * px if x < 63.5 else x * px, (y + 0.5) * px if y < 35.5 else y * px) for x, y in points]
        for a, b in zip(pts, pts[1:]):
            if not dash:
                d.line([a, b], fill=colour, width=width)
                continue
            n = max(1, int(np.hypot(b[0] - a[0], b[1] - a[1]) // dash))
            for i in range(0, n, 2):
                p = (a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n)
                q = (a[0] + (b[0] - a[0]) * min(n, i + 1) / n, a[1] + (b[1] - a[1]) * min(n, i + 1) / n)
                d.line([p, q], fill=colour, width=width)

    for r in MAIN:
        line(r, (230, 30, 30, 230), 7)
    for r in SECONDARY:
        line(r, (255, 150, 0, 230), 5, dash=14)
    for r in HIDDEN:
        line(r, (170, 60, 255, 230), 5, dash=8)
    return Image.alpha_composite(img.convert("RGBA"), over)


def scale_hint():
    """The leader (So) 3 tiles tall on a 64 px / tile grid, beside a big tree (7.5 tiles), a fir (8), a boulder (1.5) and a 2-tile cliff."""
    px = 64
    cols, rows = 24, 10
    img = Image.new("RGB", (cols * px, rows * px), (156, 203, 99))
    d = ImageDraw.Draw(img)
    for x in range(cols + 1):
        d.line([x * px, 0, x * px, rows * px], fill=(120, 165, 80), width=1)
    for y in range(rows + 1):
        d.line([0, y * px, cols * px, y * px], fill=(120, 165, 80), width=1)
    floor = 9 * px
    so = Image.open(REPO / "public" / "assets" / "props" / "chr_so_down_idle.png").convert("RGBA")
    so = so.crop(so.getbbox())
    h = 3 * px
    so = so.resize((round(so.width * h / so.height), h), Image.LANCZOS)
    img.paste(so, (2 * px, floor - h), so)

    def silhouette(x, w_tiles, h_tiles, colour, trunk=None):
        if trunk:
            d.rectangle([x + (w_tiles - 1) * px / 2, floor - trunk * px, x + (w_tiles + 1) * px / 2, floor], fill=(110, 78, 46))
            d.ellipse([x, floor - h_tiles * px, x + w_tiles * px, floor - trunk * px * 0.6], fill=colour)
        else:
            d.ellipse([x, floor - h_tiles * px, x + w_tiles * px, floor], fill=colour)
        d.ellipse([x + px * 0.2, floor - px * 0.35, x + w_tiles * px + px * 0.6, floor + px * 0.25], outline=(60, 90, 50), width=2)

    silhouette(5 * px, 6, 7.5, (70, 130, 60), trunk=2.2)  # big oak: 2.5 x the leader
    d.polygon([(13.5 * px, floor - 8 * px), (11.5 * px, floor - 0.8 * px), (15.5 * px, floor - 0.8 * px)], fill=(46, 100, 60))  # fir
    d.rectangle([13.3 * px, floor - 0.8 * px, 13.7 * px, floor], fill=(110, 78, 46))
    silhouette(16 * px, 2, 1.5, (140, 140, 130))  # boulder: half the leader
    d.rectangle([19 * px, floor - 4 * px, 24 * px, floor - 2 * px], fill=(185, 210, 122))  # plateau top
    d.rectangle([19 * px, floor - 2 * px, 24 * px, floor], fill=(138, 106, 71))  # 2-tile cliff face
    return img


def main():
    live, by_id = load_map()
    m = draft()
    BATCH.mkdir(parents=True, exist_ok=True)
    GUIDE.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(REPO / "art_inbox" / ".batch" / "adventure-14b-map-v2-redo" / "1_style_map.png", BATCH / "1_style.png")
    plan(m, 32).save(BATCH / "2_layout_hint.png")
    scale_hint().save(BATCH / "3_scale_hint.png")
    big = plan(m, 40)
    annotated = objects_over(routes_and_areas(grid_over(big, 40, m["cols"], m["rows"]), 40), m, by_id, 40, ARRIVALS)
    annotated.convert("RGB").save(GUIDE / "M2_guide_annotated.png")
    before = BATCH / "before" / f"M2_{MAP_ID}.png"
    if before.exists():
        objects_over(grid_over(Image.open(before), 40, live["cols"], live["rows"]), live, by_id, 40).convert("RGB").save(GUIDE / "M2_before_grid.png")
    print(f"hints -> {BATCH}")


if __name__ == "__main__":
    main()
