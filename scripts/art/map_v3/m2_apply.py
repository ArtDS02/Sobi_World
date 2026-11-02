# Puts the v3 layout of M2 Rừng Sâu into the game (docs/maps/v3/M2_PLAN.md): the walk mask proposed from the painting
# (docs/maps/v3/M2_mask_proposal.txt, propose_mask.py), every gameplay object moved onto it with its id, kind and behaviour kept, the
# exits on the painted trails' edges, the neighbours' arrivals moved to match, a corrupted patch for the veil, the ridge's elevation and
# the painted background (`scene`). Writes content/adventure/maps.json; run `npm run content:fmt` after.
# Usage: python scripts/art/map_v3/m2_apply.py
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
MAPS = REPO / "content" / "adventure" / "maps.json"
MAP_ID = "map_forest_deep"

SPAWN = (2, 21)
PORTAL = (3, 23)
EXITS = {"exit_f2_west": (0, 21, 1, 2), "exit_f2_east": (63, 7, 1, 2), "exit_f2_south": (43, 35, 2, 1)}
# Where the neighbours' exits land in M2 now.
ARRIVALS = {("map_forest_edge", "exit_f1_east"): (1, 21), ("map_forest_heart", "exit_f3_west"): (62, 7), ("map_mountain_tunnels", "exit_n5_west"): (43, 34)}
GROUPS = {
    "g_f2_elite": (58, 8),
    "g_f2_a": (14, 23),
    "g_f2_b": (19, 13),
    "g_f2_c": (33, 10),
    "g_f2_d": (34, 23),
    "g_f2_e": (56, 15),
    "g_f2_f": (49, 10),
    "g_f2_g": (19, 6),
    "g_f2_h": (57, 20),
    "g_f2_i": (26, 29),
    "g_f2_j": (37, 15),
    "g_f2_sleep": (44, 25),
}
CHESTS = {"chest_f2_hidden": (56, 30), "chest_f2_vines": (32, 5), "chest_f2_boulder": (8, 31)}
# The trails at the two necks are two tiles wide, so the gates are too (their id, element and look are kept).
GATES = {"gate_f2_vines": (30, 8, 2, 1), "gate_f2_boulder": (8, 27, 2, 1)}
COVERS = {"cover_f2_a": (51, 24, 10, 8)}
SPRINGS = {"spring_f2": (6, 25)}
NPCS = {"npc_f2_shrine": (19, 4)}
LORE = {"lore_f2_pond": (34, 16)}
PROPS = [("prop_adv_lm_f2", 13, 3)]
# Umbraflux has crept into the east of the clearing (walkable corrupted ground under the veil).
CORRUPTED = [(x, y) for y in range(24, 27) for x in range(43, 47)]
SCENE = {"art": "bg_adv_v3_forest_deep", "px": 64, "chunks": [2, 2]}


def main():
    data = json.loads(MAPS.read_text(encoding="utf8"))
    m = next(x for x in data["maps"] if x["id"] == MAP_ID)
    terrain = [list(r) for r in (REPO / "docs" / "maps" / "v3" / "M2_mask_proposal.txt").read_text(encoding="utf8").split()]
    assert len(terrain) == m["rows"] and all(len(r) == m["cols"] for r in terrain)
    for e in m["exits"]:
        x, y, w, h = EXITS[e["id"]]
        e.update(x=x, y=y, w=w, h=h)
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                terrain[yy][xx] = ","
    for x, y in CORRUPTED:
        if terrain[y][x] == ".":
            terrain[y][x] = "c"
    m["terrain"] = ["".join(r) for r in terrain]
    m["spawn"] = {"x": SPAWN[0], "y": SPAWN[1]}
    m["portal"] = {"x": PORTAL[0], "y": PORTAL[1]}
    for kind, table in (("groups", GROUPS), ("chests", CHESTS), ("springs", SPRINGS), ("npcs", NPCS), ("lore", LORE)):
        assert sorted(o["id"] for o in m[kind]) == sorted(table), kind
        for o in m[kind]:
            o["x"], o["y"] = table[o["id"]]
    for kind, table in (("gates", GATES), ("covers", COVERS)):
        assert sorted(o["id"] for o in m[kind]) == sorted(table), kind
        for o in m[kind]:
            o["x"], o["y"], o["w"], o["h"] = table[o["id"]]
    assert [p["prop"] for p in m["props"]] == [p[0] for p in PROPS]
    for p, (_, x, y) in zip(m["props"], PROPS):
        p["x"], p["y"] = x, y
    m["scene"] = {**SCENE, "elevation": ["".join("2" if c == "^" else "0" for c in row) for row in m["terrain"]]}
    for (map_id, exit_id), (x, y) in ARRIVALS.items():
        other = next(o for o in data["maps"] if o["id"] == map_id)
        e = next(e for e in other["exits"] if e["id"] == exit_id)
        assert e["to"] == MAP_ID
        e["arriveX"], e["arriveY"] = x, y
    MAPS.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf8", newline="\n")
    print(f"{MAP_ID}: layout v3 written")


if __name__ == "__main__":
    main()
