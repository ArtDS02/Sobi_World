"""Make the map kit's ground tiles seamless (decision 045).

Gemini draws a tile as a square picture, not a wrapping texture: laid edge to edge its borders show
as a grid. Each tile the game lays (the `_tile_` ids of src/areas/adventure/scene/mapKit.ts) is
blended with itself shifted by half a tile: the borders come from the shifted copy (whose edges
meet across the wrap), the middle stays the original. Reads the cut candidate
(art_inbox/.candidates/<id>_a.png), writes the approved file (art_inbox/<id>.png), so running it
again gives the same result.

Usage: python scripts/art/map_layouts_v2/seam_tiles.py   then   npm run art:process
"""
from __future__ import annotations

import re
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
KIT_TS = ROOT / "src" / "areas" / "adventure" / "scene" / "mapKit.ts"
ART = ROOT / "art_inbox"


def seamless(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    rolled = np.roll(np.roll(img, h // 2, axis=0), w // 2, axis=1)
    wx = 1 - np.abs(np.linspace(-1, 1, w))
    wy = 1 - np.abs(np.linspace(-1, 1, h))
    k = np.minimum(wy[:, None], wx[None, :])
    k = np.clip(k * 2.2, 0, 1)
    k = k * k * (3 - 2 * k)  # smoothstep: the original in the middle, the shifted copy at the borders
    return (img * k[..., None] + rolled * (1 - k[..., None])).round().astype(np.uint8)


def main() -> None:
    ids = sorted(set(re.findall(r"'(adv_map_[a-z0-9_]*_tile_[a-z0-9_]+)'", KIT_TS.read_text(encoding="utf-8"))))
    for i in ids:
        src = ART / ".candidates" / f"{i}_a.png"
        img = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
        Image.fromarray(seamless(img)).save(ART / f"{i}.png")
        print(f"OK  {i}")


if __name__ == "__main__":
    main()
