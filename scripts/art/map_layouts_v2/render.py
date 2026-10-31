# Renders the v2 map layouts (decision 045) the way scripts/capture/adventureMaps.ts photographs the game: the zone's placeholder tiles,
# props and the game's own sprites at 1 tile = 40 px, edge to edge. The pictures are the "before" images an image AI repaints.
# Usage: python scripts/art/map_layouts_v2/render.py   (from the repo root)
# Writes docs/maps/v2/<code>_<key>.txt (grid + objects), art_inbox/.hints/adventure-14-map-v2/before/<code>_<key>.png and
# art_inbox/.hints/adventure-14-map-v2/before/layouts.json (objects with percent positions, read by the batch script).
import json
import random
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance

sys.path.insert(0, str(Path(__file__).parent))
import coast  # noqa: E402
import forest  # noqa: E402
import mountain  # noqa: E402
import ruins  # noqa: E402

REPO = Path(__file__).resolve().parents[3]
ASSETS = REPO / "public" / "assets"
DOCS = REPO / "docs" / "maps" / "v2"
OUT = REPO / "art_inbox" / ".hints" / "adventure-14-map-v2" / "before"
T = 40
ZONE = {"zone_forest": "forest", "zone_mountain": "mountain", "zone_ruins": "ruins", "zone_coast": "coast"}
# Per zone: trees / masses along the edge of dense ground, and small decals on open ground. The coast has no tiles yet (see zone_tiles).
TREES = {"forest": ["prop_adv_forest_oak", "prop_adv_forest_round", "prop_adv_forest_bush"],
         "mountain": ["prop_adv_mountain_pine", "prop_adv_mountain_rock", "prop_adv_mountain_boulder"],
         "ruins": ["prop_adv_ruins_pillar", "prop_adv_ruins_broken", "prop_adv_ruins_deadtree", "prop_adv_ruins_wall"],
         "coast": ["prop_adv_forest_round", "prop_adv_forest_bush", "prop_adv_forest_rock"]}
DECALS = {"forest": ["grass", "daisy", "buttercup", "pinkflower", "pebbles", "fern", "leaves"],
          "mountain": ["drygrass", "gravel", "rockchips", "pebbles"],
          "ruins": ["rubble", "ivy", "moss", "rockchips", "violet"],
          "coast": ["pebbles", "drygrass", "grass", "leaves"]}
SIZE = {"normal": 2.0, "elite": 2.6, "mutant": 2.4, "subboss": 3.2, "special": 3.0, "boss": 4.0}
CHEST_TINT = {"wood": None, "silver": (200, 210, 235), "gold": (255, 215, 80), "hidden": (165, 110, 235), "mimic": (230, 150, 150)}
_cache: dict = {}


def img(path: Path) -> Image.Image:
    if path not in _cache:
        _cache[path] = Image.open(path).convert("RGBA")
    return _cache[path]


def tile(name: str) -> Image.Image:
    return img(ASSETS / "environment" / f"{name}.png").resize((T, T), Image.LANCZOS)


def sprite(name: str, height_tiles: float, folder="props") -> Image.Image:
    im = img(ASSETS / folder / f"{name}.png")
    box = im.getbbox()
    im = im.crop(box) if box else im
    h = int(height_tiles * T)
    return im.resize((max(1, int(im.width * h / im.height)), h), Image.LANCZOS)


def tint(im: Image.Image, rgb) -> Image.Image:
    if not rgb:
        return im
    col = ImageChops.multiply(im.convert("RGB"), Image.new("RGB", im.size, rgb))
    return Image.merge("RGBA", (*col.split(), im.getchannel("A")))


def stand(canvas: Image.Image, sp: Image.Image, x: float, y: float):
    """Bottom-centre of the sprite on the bottom-centre of tile (x, y), with a soft contact shadow."""
    cx, by = int((x + 0.5) * T), int((y + 1) * T)
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([cx - sp.width * 0.32, by - 7, cx + sp.width * 0.32, by + 5], fill=(0, 0, 0, 60))
    canvas.alpha_composite(sh)
    canvas.paste(sp, (cx - sp.width // 2, by - sp.height), sp)


def zone_tiles(z: str) -> dict:
    names = {".": "ground", ",": "path", "~": "water", "=": "bridge", "#": "wall"}
    if z != "coast":
        return {c: tile(f"adv_tile_{z}_{n}") for c, n in names.items()}
    # Stand-in coast: sand from the forest path, gravel boardwalk path, turquoise sea, palm jungle from the forest wall.
    sand = ImageEnhance.Brightness(tile("adv_tile_forest_path")).enhance(1.12)
    return {".": sand, ",": tile("adv_tile_mountain_path"), "~": tint(tile("adv_tile_forest_water"), (150, 255, 235)),
            "=": tile("adv_tile_forest_bridge"), "#": tile("adv_tile_forest_wall")}


def render(L) -> Image.Image:
    z = ZONE[L.zone]
    rnd = random.Random(L.seed)
    tiles = zone_tiles(z)
    tiles["^"] = ImageEnhance.Brightness(tiles["."]).enhance(1.12)
    tiles["s"] = tiles[","].copy()
    d = ImageDraw.Draw(tiles["s"])
    for k in range(1, 5):
        d.line([0, k * T // 5, T, k * T // 5], fill=(120, 95, 70, 255), width=3)
    tiles["F"] = tint(tile("adv_tile_mountain_wall"), (205, 175, 140))
    tiles["c"] = Image.blend(tiles["."], Image.new("RGBA", (T, T), (150, 95, 190, 255)), 0.55)
    tiles["w"] = Image.blend(tiles["~"], Image.new("RGBA", (T, T), (255, 255, 255, 255)), 0.45)
    canvas = Image.new("RGBA", (L.w * T, L.h * T))
    for y, row in enumerate(L.g):
        for x, c in enumerate(row):
            canvas.paste(tiles[c], (x * T, y * T))
    d = ImageDraw.Draw(canvas)
    # The rim of raised ground and the line where a cliff face meets the ground below.
    for y, row in enumerate(L.g):
        for x, c in enumerate(row):
            if c == "F" and L.get(x, y - 1) in "^":
                d.line([x * T, y * T, x * T + T, y * T], fill=(70, 50, 35, 255), width=3)
            if c == "F" and L.get(x, y + 1) not in "F#":
                d.line([x * T, y * T + T - 2, x * T + T, y * T + T - 2], fill=(60, 45, 30, 255), width=4)
    # Decals on open ground, trees along the inner edge of dense masses.
    decals = [f"prop_adv_decal_{n}" for n in DECALS[z]]
    trees = TREES[z]
    stands = []
    for y, row in enumerate(L.g):
        for x, c in enumerate(row):
            if c in ".^" and rnd.random() < 0.07:
                sp = sprite(rnd.choice(decals), 0.45)
                canvas.paste(sp, (x * T + rnd.randrange(0, 12), y * T + rnd.randrange(0, 14)), sp)
            if c == "#" and any(L.get(x + dx, y + dy) in ".^,c" for dx, dy in ((0, 1), (1, 0), (-1, 0), (0, -1))) and rnd.random() < 0.45:
                stands.append((y, x, rnd.choice(trees)))
    for y, x, name in sorted(stands):
        small = name.endswith(("bush", "rock", "boulder", "broken", "wall"))
        stand(canvas, sprite(name, 1.2 if small else 2.3), x, y)
    # Overhead covers: the dense-mass tile, see-through, with a dashed outline so the hidden ground still shows.
    for cv in L.covers:
        x0, y0, x1, y1 = cv["x0"] * T, cv["y0"] * T, (cv["x1"] + 1) * T, (cv["y1"] + 1) * T
        layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        for yy in range(cv["y0"], cv["y1"] + 1):
            for xx in range(cv["x0"], cv["x1"] + 1):
                layer.paste(tiles["#"], (xx * T, yy * T))
        mask = Image.new("L", canvas.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle([x0, y0, x1, y1], radius=30, fill=150)
        canvas.paste(layer, (0, 0), mask)
        dd = ImageDraw.Draw(canvas)
        for k in range(x0, x1, 24):
            dd.line([k, y0, min(k + 12, x1), y0], fill=(255, 255, 255, 230), width=4)
            dd.line([k, y1, min(k + 12, x1), y1], fill=(255, 255, 255, 230), width=4)
        for k in range(y0, y1, 24):
            dd.line([x0, k, x0, min(k + 12, y1)], fill=(255, 255, 255, 230), width=4)
            dd.line([x1, k, x1, min(k + 12, y1)], fill=(255, 255, 255, 230), width=4)
    # Objects, back to front.
    for o in sorted(L.objects, key=lambda o: o["y"]):
        k, x, y = o["kind"], o["x"], o["y"]
        if k == "group":
            sp = sprite(o["enemy"], SIZE[o["cls"]])
            if o["cls"] == "mutant":
                sp = tint(sp, (215, 160, 235))
            if o.get("sleep"):
                sp = sp.rotate(-75, expand=True)
                y += 0.3
            stand(canvas, sp, x, y)
        elif k == "chest":
            stand(canvas, tint(sprite("adv_chest_closed", 0.9), CHEST_TINT[o["type"]]), x, y)
        elif k == "gate":
            stand(canvas, sprite(f"adv_gate_{o['element'].lower()}", 1.3), x, y)
        elif k == "puzzle":
            stand(canvas, sprite({"FIRE": "prop_adv_ruins_brazier", "LIGHT": "prop_adv_ruins_urn"}.get(o["element"], "prop_adv_mountain_vent"), 1.2), x, y)
        elif k == "spring":
            stand(canvas, sprite("adv_spring", 1.1), x, y)
        elif k == "lore":
            stand(canvas, sprite("adv_lore_stone", 1.2), x, y)
        elif k == "npc":
            stand(canvas, sprite("adv_shrine" if "shrine" in o.get("id", "") else "adv_npc_traveler", 1.6), x, y)
        elif k in ("herb", "ore"):
            stand(canvas, sprite(f"adv_node_{k}", 0.9), x, y)
        elif k == "portal":
            stand(canvas, sprite("adv_portal_on", 1.6), x, y)
        elif k == "crystal":
            stand(canvas, tint(sprite("prop_adv_mountain_crystal", 1.2), (190, 120, 255)), x, y)
        elif k == "landmark":
            name = o.get("sprite") or ("prop_adv_ruins_deadtree" if "withered" in o["what"] else "prop_adv_forest_mushroom" if "mushroom tree" in o["what"] \
                else "prop_adv_forest_hut" if "hut" in o["what"] or "stump" in o["what"] else "prop_adv_forest_boulder" if "stones" in o["what"] \
                else "prop_adv_forest_oak")
            stand(canvas, sprite(name, o["h"] * 1.6), x + o["w"] / 2 - 0.5, y + o["h"] - 1)
        elif k == "spawn":
            stand(canvas, sprite("pig_classic", 0.9, "pigs/base"), x, y)
        elif k == "exit" and o.get("via") in ("cave", "tunnel") and 0 < x < L.w - 1 and 0 < y < L.h - 1:
            ImageDraw.Draw(canvas).ellipse([x * T - 20, y * T - 10, x * T + 60, y * T + 40], fill=(30, 22, 18, 255))
    return canvas


def describe(L, o) -> str:
    k = o["kind"]
    if k == "group":
        what = {"normal": "a monster", "elite": "a bigger elite monster", "mutant": "a mutated monster", "subboss": "a big sub-boss monster",
                "special": "a rare special monster", "boss": "the huge zone boss"}[o["cls"]]
        return what + (" asleep" if o.get("sleep") else " standing guard")
    if k == "chest":
        return {"wood": "a wooden treasure chest", "silver": "a silver treasure chest", "gold": "a gold treasure chest",
                "hidden": "a small violet crystal chest hidden under the cover", "mimic": "a treasure chest (a disguised mimic)"}[o["type"]]
    if k == "gate":
        return {"FIRE": "a thorny bramble blocking a narrow gap", "NATURE": "a wall of thick vines blocking a narrow gap", "EARTH": "a big boulder blocking a narrow gap",
                "DARK": "a curtain of dark shadow mist blocking a narrow gap", "WATER": "a dry stone channel blocking the way",
                "METAL": "a rusty iron gate with a gear lock", "LIGHTNING": "a sealed door with a dull crystal lock",
                "LIGHT": "a stone door sealed with a dark rune"}[o["element"]] if not o.get("note", "").startswith("a wall of hard coral")             else "a wall of hard coral blocking a narrow gap"
    if k == "puzzle":
        return {"FIRE": "an iron brazier, unlit", "WATER": "a small wooden water wheel, dry" if o.get("id", "").find("clam") < 0 else "a giant closed clam",
                "LIGHTNING": "a metal rod with a dull pale-blue crystal", "METAL": "a round bronze gear lock", "LIGHT": "a round rune floor plate, dull"}[o["element"]]
    if k == "exit":
        return {"trail": "the path leaves the map here through an opening", "tunnel": "a tunnel mouth where the path leaves the map",
                "shore": "the boardwalk leaves the map here along the shore", "cave": "a cave mouth", "stairs": "stone stairs where the way leaves the map"}[o["via"]]
    if k == "landmark":
        return "the landmark: " + o["what"]
    return {"spawn": "the pig hero", "portal": "the zone portal (a round stone ring with a violet swirl)", "spring": "a small healing spring",
            "lore": "a small carved lore stone", "npc": "a small old shrine" if "shrine" in o.get("id", "") else "a traveller's little camp",
            "herb": "a patch of glowing herbs", "ore": "a rock with shiny ore veins", "crystal": "a cluster of dark-violet crystals"}[k]


def main():
    DOCS.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {}
    bad = False
    for make in forest.LAYOUTS + mountain.LAYOUTS + ruins.LAYOUTS + coast.LAYOUTS:
        L = make()
        probs = L.problems()
        for p in probs:
            print(f"{L.code}: {p}")
        bad |= bool(probs)
        name = f"{L.code}_{L.key}"
        (DOCS / f"{name}.txt").write_text(L.text(), encoding="utf-8", newline="\n")
        render(L).convert("RGB").save(OUT / f"{name}.png")
        meta[L.code] = dict(key=L.key, name=L.name, zone=L.zone, w=L.w, h=L.h, theme=L.theme, corruption=L.corruption, file=f"{name}.png",
                            covers=L.covers, objects=[dict(what=describe(L, o), x=round((o["x"] + 0.5) / L.w * 100), y=round((o["y"] + 0.5) / L.h * 100))
                                                      for o in L.objects if o["kind"] != "crystal"])
        groups = sum(1 for o in L.objects if o["kind"] == "group")
        print(f"{L.code} {L.key}: {L.w}x{L.h}, {groups} groups, {sum(1 for o in L.objects if o['kind'] == 'chest')} chests")
    (OUT / "layouts.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
