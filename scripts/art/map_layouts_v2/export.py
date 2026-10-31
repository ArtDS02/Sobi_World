# Writes every map layout v2 (decision 045) as data, for the maps.json import (scripts/content/importMapsV2.ts):
# docs/maps/v2/layouts.json = { code: { key, name, zone, w, h, corruption, grid: [rows], covers: [...], objects: [...] } }.
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import coast  # noqa: E402
import forest  # noqa: E402
import mountain  # noqa: E402
import ruins  # noqa: E402

OUT = Path(__file__).resolve().parents[3] / "docs" / "maps" / "v2" / "layouts.json"


def main():
    data = {}
    for make in forest.LAYOUTS + mountain.LAYOUTS + ruins.LAYOUTS + coast.LAYOUTS:
        L = make()
        data[L.code] = dict(key=L.key, name=L.name, zone=L.zone, w=L.w, h=L.h, corruption=L.corruption,
                            grid=["".join(r) for r in L.g], covers=L.covers, objects=L.objects)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    print(f"{len(data)} layouts -> {OUT}")


if __name__ == "__main__":
    main()
