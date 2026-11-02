# Turns the owner's painted background of a v3 map (docs/maps/v3/M2_PLAN.md §7) into the game's chunks: removes the image AI's corner
# mark, scales the ONE source picture to 64 px per tile (cols x 64 by rows x 64, a slight stretch when the AI's frame is not exactly the
# map's ratio), sharpens a little, keeps that master in the batch folder, and cuts it into chunks of at most 2048 px a side (edges meet
# pixel for pixel; no chunk is drawn on its own). Writes public/assets/environment/adventure_v3/<art>_c<col><row>.png and their
# manifest rows (environment, production). Tooling only.
# Usage: python scripts/art/map_v3/bg_prepare.py [--batch adventure-15-m2-3q] [--map map_forest_deep] [--art bg_adv_v3_forest_deep]
import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

REPO = Path(__file__).resolve().parents[3]
PX = 64
MAX_CHUNK = 2048
OUT_DIR = REPO / "public" / "assets" / "environment" / "adventure_v3"
MANIFEST = REPO / "public" / "assets" / "manifest" / "assets.json"
# The image AI's sparkle mark: its centre and radius in the source picture's px, and where clean ground of the same kind is taken from.
MARKS = {"adventure-15-m2-3q": [((1256, 647), 26, (0, -46))]}
# Elsewhere the mark sits at the same place from the bottom-right corner (Gemini web, 2026-11).
AUTO_MARK = (121, 121, 26, (0, -46))


def unmark(img, marks):
    """Covers each mark with a soft-edged patch of nearby ground."""
    for (cx, cy), r, (dx, dy) in marks:
        box = (cx - r, cy - r, cx + r, cy + r)
        patch = img.crop((box[0] + dx, box[1] + dy, box[2] + dx, box[3] + dy))
        mask = Image.new("L", patch.size, 0)
        ImageDraw.Draw(mask).ellipse((4, 4, 2 * r - 4, 2 * r - 4), fill=255)
        img.paste(patch, box[:2], mask.filter(ImageFilter.GaussianBlur(4)))
    return img


def chunk_grid(w, h):
    """The fewest columns and rows whose chunks are at most MAX_CHUNK a side, cut on whole tiles."""
    cols = math.ceil(w / MAX_CHUNK)
    rows = math.ceil(h / MAX_CHUNK)
    return cols, rows


def edges(total, n):
    """Chunk edges on whole tiles (each chunk as even as the tiles allow)."""
    tiles = total // PX
    return [round(tiles * i / n) * PX for i in range(n + 1)]


def write_manifest(rows):
    """Adds (or keeps) the environment rows of the chunks, keeping the file's own layout."""
    text = MANIFEST.read_text(encoding="utf8")
    data = json.loads(text)
    have = {r["id"] for r in data["environment"]}
    new = [r for r in rows if r["id"] not in have]
    if not new:
        return 0
    anchor = '  "environment": [\n'
    at = text.index(anchor) + len(anchor)
    block = "".join(
        "    {\n" f'      "id": "{r["id"]}",\n' '      "status": "production",\n' f'      "asset": "{r["asset"]}"\n' "    },\n" for r in new
    )
    MANIFEST.write_text(text[:at] + block + text[at:], encoding="utf8", newline="\n")
    return len(new)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--batch", default="adventure-15-m2-3q")
    ap.add_argument("--map", default="map_forest_deep")
    ap.add_argument("--art", default="bg_adv_v3_forest_deep")
    ap.add_argument("--source", default="BG.png")
    a = ap.parse_args()
    maps = json.loads((REPO / "content" / "adventure" / "maps.json").read_text(encoding="utf8"))["maps"]
    m = next(x for x in maps if x["id"] == a.map)
    batch = REPO / "art_inbox" / ".batch" / a.batch
    src = Image.open(batch / a.source).convert("RGB")
    dx, dy, r, off = AUTO_MARK
    src = unmark(src, MARKS.get(a.batch, [((src.size[0] - dx, src.size[1] - dy), r, off)]))
    W, H = m["cols"] * PX, m["rows"] * PX
    master = src.resize((W, H), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.6, percent=45, threshold=2))
    master.save(batch / f"{a.art}_master.png")
    cols, rows = chunk_grid(W, H)
    xs, ys = edges(W, cols), edges(H, rows)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = []
    for j in range(rows):
        for i in range(cols):
            piece = master.crop((xs[i], ys[j], xs[i + 1], ys[j + 1])).convert("RGBA")
            name = f"{a.art}_c{i}{j}"
            piece.save(OUT_DIR / f"{name}.png", optimize=True)
            out.append({"id": name, "asset": f"environment/adventure_v3/{name}.png"})
            print(f"  {name}: {xs[i]},{ys[j]} {piece.size[0]}x{piece.size[1]}")
    added = write_manifest(out)
    print(f"{a.map}: source {src.size[0]}x{src.size[1]} -> {W}x{H}, {cols}x{rows} chunks, {added} manifest rows added")


if __name__ == "__main__":
    main()
