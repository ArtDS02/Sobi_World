# The review picture of a painted area's walk mask (docs/maps/v3/M2_PLAN.md §9): the area's master picture at 40 px per tile, each
# tile tinted by what the game will do there (red = blocked, blue = water, yellow = raised ground, orange = cliff, pink = stairs / bridge,
# violet outline = overhead cover, nothing = open ground), the 40 px grid and every gameplay id. Reads the live content/adventure/maps.json.
# Writes art_inbox/.batch/<batch>/guide/<code>_mask_overlay.png (and _mask_only.png without the ids). Tooling only.
# Usage: python scripts/art/map_v3/overlay.py [--code M2] [--batch adventure-15-m2-3q]
import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).parent))
from m2_hints import grid_over, objects_over  # noqa: E402

REPO = Path(__file__).resolve().parents[3]
TINT = {"#": (220, 40, 40, 110), "~": (40, 110, 230, 90), "^": (255, 220, 60, 70), "F": (255, 140, 0, 120), "s": (255, 120, 220, 120), "=": (255, 120, 220, 90), "c": (150, 60, 200, 90)}
MAPS = {"M1": "map_forest_edge", "M2": "map_forest_deep", "M3": "map_forest_heart", "N1": "map_forest_hollow", "N2": "map_forest_falls", "N3": "map_forest_marsh",
        "M4": "map_mountain_foot", "M5": "map_mountain_mine", "M6": "map_mountain_peak", "N4": "map_mountain_pass", "N5": "map_mountain_tunnels",
        "M7": "map_ruins_gate", "M8": "map_ruins_hall", "M9": "map_ruins_sanctum", "N6": "map_ruins_crypt",
        "N7": "map_coast_beach", "N8": "map_coast_reef", "N9": "map_coast_cove"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--code", default="M2")
    ap.add_argument("--batch", default="adventure-15-m2-3q")
    a = ap.parse_args()
    maps = json.loads((REPO / "content" / "adventure" / "maps.json").read_text(encoding="utf8"))["maps"]
    by_id = {m["id"]: m for m in maps}
    m = by_id[MAPS[a.code]]
    t = m["tile"]
    batch = REPO / "art_inbox" / ".batch" / a.batch
    base = Image.open(batch / f"{m['scene']['art']}_master.png").convert("RGBA").resize((m["cols"] * t, m["rows"] * t), Image.LANCZOS)
    over = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(over)
    for y, row in enumerate(m["terrain"]):
        for x, c in enumerate(row):
            if c in TINT:
                d.rectangle([x * t, y * t, (x + 1) * t - 1, (y + 1) * t - 1], fill=TINT[c])
    tinted = grid_over(Image.alpha_composite(base, over), t, m["cols"], m["rows"])
    (batch / "guide").mkdir(exist_ok=True)
    tinted.convert("RGB").save(batch / "guide" / f"{a.code}_mask_only.png")
    objects_over(tinted, m, by_id, t).convert("RGB").save(batch / "guide" / f"{a.code}_mask_overlay.png")
    print(f"overlay -> {batch / 'guide'}")


if __name__ == "__main__":
    main()
