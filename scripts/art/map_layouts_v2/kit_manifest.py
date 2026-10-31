"""Register the map kit pictures the game draws (decision 045) in the asset manifest.

The ids are the ones `src/areas/adventure/scene/mapKit.ts` names plus the kit landmarks of
`content/adventure/props.json`. Each row's canvas is the approved picture's own size
(`scripts/assets/mapKitSizes.json`), so `npm run art:process` copies it untouched: tiles stay
seamless squares, sprites keep the scale they were cut at (a lit brazier as tall as drawn).

Usage: python scripts/art/map_layouts_v2/kit_manifest.py   then   npm run art:process
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
KIT_TS = ROOT / "src" / "areas" / "adventure" / "scene" / "mapKit.ts"
PROPS = ROOT / "content" / "adventure" / "props.json"
MANIFEST = ROOT / "public" / "assets" / "manifest" / "assets.json"
SIZES = ROOT / "scripts" / "assets" / "mapKitSizes.json"
ART = ROOT / "art_inbox"


def kit_ids() -> list[str]:
    ids = set(re.findall(r"'(adv_map_[a-z0-9_]+)'", KIT_TS.read_text(encoding="utf-8")))
    ids |= {f"adv_map_chest_{t}{s}" for t in ("wood", "silver", "gold", "hidden") for s in ("", "_open")}
    ids |= {p["art"] for p in json.loads(PROPS.read_text(encoding="utf-8"))["props"] if p["art"].startswith("adv_map_")}
    return sorted(ids)


def main() -> None:
    ids = kit_ids()
    sizes = {}
    for i in ids:
        src = ART / f"{i}.png"
        if not src.exists():
            raise SystemExit(f"missing approved art: {src}")
        w, h = Image.open(src).size
        sizes[i] = [w, h]
    SIZES.write_text(json.dumps(sizes, indent=2) + "\n", encoding="utf-8", newline="\n")
    text = MANIFEST.read_text(encoding="utf-8")
    have = set(re.findall(r'"id": "(adv_map_[a-z0-9_]+)"', text))
    rows = "".join(f',\n    {{\n      "id": "{i}",\n      "status": "production",\n      "asset": "props/adventure_map/{i}.png"\n    }}'
                   for i in ids if i not in have)
    # At the end of the props: the first rows are the farm's, which tests pick by position.
    anchor = '    }\n  ],\n  "buildings": ['
    assert text.count(anchor) == 1
    MANIFEST.write_text(text.replace(anchor, "    }" + rows + '\n  ],\n  "buildings": ['), encoding="utf-8", newline="\n")
    print(f"{len(ids)} kit pictures, {len(ids) - len(have & set(ids))} new manifest rows")


if __name__ == "__main__":
    main()
