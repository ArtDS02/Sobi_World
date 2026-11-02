# Proposes the walk mask of a painted v3 area (docs/maps/v3/M2_PLAN.md §9): reads the area's master picture (bg_prepare.py), sorts each
# pixel into forest / grass / path / water / rock-and-wood by colour, takes each tile's share, and writes a terrain grid: `,` trail,
# `.` open ground, `~` water, `#` forest or rock; hand-set regions (MANUAL: the ridge's top / cliff / stairs, the plank bridges, the narrow
# necks a gate shuts) then win. Small islands of ground nobody can walk to close up, pin-holes in open ground open up.
# It is a PROPOSAL: the owner approves it on the overlay (overlay.py) before anyone treats it as final. Writes
# docs/maps/v3/<code>_mask_proposal.txt. Tooling only. Usage: python scripts/art/map_v3/propose_mask.py [M2]
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parents[3]
SAMPLES = 8  # colour samples per tile side

AREAS = {
    "M2": {
        "map": "map_forest_deep",
        "master": "art_inbox/.batch/adventure-15-m2-3q/bg_adv_v3_forest_deep_master.png",
        # (char, x0, y0, x1, y1) inclusive tile boxes; "^F" = the ridge: walkable share → ^, the rest → F.
        "manual": [
            ("^F", 7, 1, 23, 7),
            ("F", 7, 8, 23, 10),
            ("s", 15, 6, 16, 11),
            ("=", 38, 6, 41, 10),
            ("=", 23, 19, 27, 22),
            # The vine glade (x 30-33, y 4-7): shut on every side but its neck (30-31, 8), where the vine gate stands.
            ("#", 29, 8, 29, 8),
            ("#", 32, 8, 37, 8),
            ("#", 34, 4, 37, 7),
            # The boulder pocket: its neck (8-9, 27) is where the false wall stands.
            ("#", 6, 27, 7, 27),
            ("#", 10, 27, 11, 27),
        ],
    }
}


def shares(master, cols, rows):
    im = np.asarray(master.convert("RGB").resize((cols * SAMPLES, rows * SAMPLES), Image.BOX)).astype(int)
    R, G, B = im[..., 0], im[..., 1], im[..., 2]
    lum = 0.3 * R + 0.59 * G + 0.11 * B
    path = (R > 175) & (G > 145) & (B < 150) & (R >= G)
    water = (B > R + 25) & (B > 130)
    grass = (G > R + 10) & (G > B + 15) & (lum > 115) & ~water
    def per_tile(mask):
        return mask.reshape(rows, SAMPLES, cols, SAMPLES).mean(axis=(1, 3))
    return per_tile(path), per_tile(water), per_tile(grass)


def propose(code):
    a = AREAS[code]
    maps = json.loads((REPO / "content" / "adventure" / "maps.json").read_text(encoding="utf8"))["maps"]
    m = next(x for x in maps if x["id"] == a["map"])
    cols, rows = m["cols"], m["rows"]
    path, water, grass = shares(Image.open(REPO / a["master"]), cols, rows)
    g = [["#"] * cols for _ in range(rows)]
    for y in range(rows):
        for x in range(cols):
            if water[y, x] >= 0.5:
                g[y][x] = "~"
            elif path[y, x] >= 0.45:
                g[y][x] = ","
            elif path[y, x] + grass[y, x] >= 0.55:
                g[y][x] = "."
    tidy(g, cols, rows)
    for c, x0, y0, x1, y1 in a["manual"]:
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if c == "^F":
                    g[y][x] = "^" if path[y, x] + grass[y, x] >= 0.55 else "F"
                elif c == "F":
                    g[y][x] = "F"
                elif c == "s":
                    if g[y][x] in ("^", "F", "#"):
                        g[y][x] = "s"
                else:
                    g[y][x] = c
    # The frame of the area stays shut except the exits (they are put on it afterwards).
    for x in range(cols):
        g[0][x] = g[rows - 1][x] = "#"
    for y in range(rows):
        g[y][0] = g[y][cols - 1] = "#"
    return m, ["".join(r) for r in g]


def tidy(g, cols, rows):
    walk = set(".,=^s")
    for y in range(1, rows - 1):
        for x in range(1, cols - 1):
            around = [g[y + dy][x + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dx or dy]
            # A pebble or a flower read as forest in open ground opens; a lone grass speck inside forest closes.
            if g[y][x] == "#" and sum(c in walk for c in around) >= 6:
                g[y][x] = "."
            elif g[y][x] == "." and sum(c in walk for c in around) <= 1:
                g[y][x] = "#"


if __name__ == "__main__":
    code = sys.argv[1] if len(sys.argv) > 1 else "M2"
    m, terrain = propose(code)
    out = REPO / "docs" / "maps" / "v3" / f"{code}_mask_proposal.txt"
    out.write_text("\n".join(terrain) + "\n", encoding="utf8")
    print("\n".join(f"{i:2d} {r}" for i, r in enumerate(terrain)))
