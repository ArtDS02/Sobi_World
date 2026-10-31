# Imports the map layouts v2 (decision 045, docs/maps/v2/layouts.json from export.py) into the game's content: the main areas
# M1-M9 are laid out again and the side areas N1-N6 are added (content/adventure/maps.json), the zones get their side areas and the
# chest tables by kind (zones.json), each landmark becomes a prop (props.json), and the English texts follow (content/i18n/en.json).
# What an area already had is kept by id (enemy pools, gifts, boss tables, chest tables, lore texts, traveller events, the Guardian
# shrine), so a save keeps its opened chests, gates, lore and beaten guardians. Each puzzle holds the gate of its element. The coast
# (N7-N9) waits for its own zone and enemies; decorative crystals wait for the kit's art. Run `npm run content:fmt` after it, then `npm run check`.
import json
import re
import sys
from collections import deque
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
CONTENT = ROOT / "content" / "adventure"
SKIP = {"N7", "N8", "N9"}
COAST = {"map_coast_beach", "map_coast_reef", "map_coast_cove"}
WALK = set(".,=^sc")
ZONE_OF = {"zone_forest": "forest", "zone_mountain": "mountain", "zone_ruins": "ruins"}
COVER_LOOK = {"forest": "canopy", "mountain": "rock", "ruins": "roof"}
BRANCHES = {"zone_forest": ["map_forest_hollow", "map_forest_falls", "map_forest_marsh"],
            "zone_mountain": ["map_mountain_pass", "map_mountain_tunnels"], "zone_ruins": ["map_ruins_crypt"]}
# A mimic is an enemy of its zone dressed as a chest (its own art waits for GĐ14).
MIMIC_ENEMY = {"forest": "enemy_bramble_boar", "mountain": "enemy_ore_golem", "ruins": "enemy_stone_sentinel"}
NODE_TABLE = {("herb", "forest"): "herbs", ("herb", "mountain"): "herbs", ("herb", "ruins"): "herbs",
              ("ore", "forest"): "ore_vein", ("ore", "mountain"): "ore_vein", ("ore", "ruins"): "cache_ancient"}
GIFT = {"elite": {"item_adv_exp_small": 3, "item_potion_healing": 2}, "subboss": {"item_adv_exp_small": 5, "item_skill_scroll": 1}}
NEW_EVENTS = ["event_herbalist", "event_shrine", "event_hot_spring", "event_miner", "event_cliff_shrine", "event_rune_altar", "event_ancient_cache"]
# Landmark art by a word of its description (else the zone's own), until the kit's art.
LANDMARK_ART = [("mushroom", "prop_adv_forest_mushroom"), ("stump", "prop_adv_forest_stump"), ("hut", "prop_adv_forest_hut"),
                ("cabin", "prop_adv_mountain_cabin"), ("tower", "prop_adv_mountain_cart"), ("skull", "prop_adv_mountain_boulder"),
                ("eagle", "prop_adv_ruins_statue"), ("statue", "prop_adv_ruins_statue"), ("door", "prop_adv_ruins_wall"),
                ("mural", "prop_adv_ruins_wall"), ("ossuary", "prop_adv_ruins_wall"), ("seal", "prop_adv_ruins_broken"),
                ("withered", "prop_adv_ruins_deadtree"), ("stones", "prop_adv_forest_boulder"), ("oak", "prop_adv_forest_oak")]
ZONE_ART = {"forest": "prop_adv_forest_oak", "mountain": "prop_adv_mountain_boulder", "ruins": "prop_adv_ruins_statue"}
LANDMARK_NAME = {"prop_adv_forest_mushroom": ("Nấm khổng lồ", "Giant mushroom"), "prop_adv_forest_stump": ("Gốc cây cổ", "Ancient stump"),
                 "prop_adv_forest_hut": ("Chòi đổ nát", "Ruined hut"), "prop_adv_mountain_cabin": ("Lán thợ mỏ", "Miners' cabin"),
                 "prop_adv_mountain_cart": ("Tháp nâng mỏ", "Mine lift tower"), "prop_adv_mountain_boulder": ("Sọ rồng cổ", "Ancient dragon skull"),
                 "prop_adv_ruins_statue": ("Tượng cổ", "Ancient statue"), "prop_adv_ruins_wall": ("Bức tường cổ", "Ancient wall"),
                 "prop_adv_ruins_broken": ("Đại phong ấn", "The great seal"), "prop_adv_ruins_deadtree": ("Cây khô khổng lồ", "Giant withered tree"),
                 "prop_adv_forest_boulder": ("Vòng đá rêu", "Mossy stone ring"), "prop_adv_forest_oak": ("Sồi cổ thụ", "Ancient oak")}
# The lore of the new side areas (Vietnamese, English).
NEW_LORE = {
    "lore_n1": ("Nấm ở thung lũng này phát sáng theo nhịp thở. Người hái nấm kể có một con heo con ngủ dưới cây nấm lớn nhất.",
                "The mushrooms in this hollow glow in time with a breath. Pickers say a piglet sleeps under the biggest one."),
    "lore_n2": ("Thác Rêu chưa bao giờ ngừng chảy. Sau làn nước có khắc chín con thú canh giữ, một con đã bị vết nứt tím che mất.",
                "Moss Falls has never stopped. Behind the water nine guardian beasts are carved; one is hidden by a violet crack."),
    "lore_n3": ("Đầm sương từng là làng chài. Khi Umbraflux tràn tới, dân làng bỏ đi, chỉ để lại những chiếc chòi trên cọc.",
                "The misty marsh was once a fishing village. When the Umbraflux came the villagers left, leaving only huts on stilts."),
    "lore_n4": ("Con đại bàng đá trên vách đèo nhìn về Tàn Tích. Người ta bảo nó đang chờ người thắp lại ngọn lửa trên đỉnh núi.",
                "The stone eagle on the pass looks toward the Ruins. They say it waits for someone to light the summit fire again."),
    "lore_n5": ("Cánh cửa đá trong đường hầm cổ chỉ mở được một nửa. Phía sau vẫn còn tiếng bánh răng quay rất khẽ.",
                "The stone door in the old tunnels only half opens. Behind it gears still turn, very softly."),
    "lore_n6": ("Tường hầm mộ xếp đầy bia nhỏ, mỗi bia khắc một con heo. Những bia gần phong ấn đã nứt đen.",
                "The crypt walls are lined with small stones, each carved with a pig. The ones near the seal have cracked black."),
}
NEW_NAMES_EN = {"map_forest_hollow": "Mushroom Hollow", "map_forest_falls": "Moss Falls", "map_forest_marsh": "Misty Marsh",
                "map_mountain_pass": "Windy Pass", "map_mountain_tunnels": "Ancient Tunnels", "map_ruins_crypt": "Rune Crypt"}


def load(name):
    return json.loads((CONTENT / name).read_text(encoding="utf-8"))


def corruption(kind: str, pct: int):
    """A group's corruption from its area's (decision 045); None = the class's own level."""
    normal = 1 if pct < 30 else 2 if pct < 90 else 3
    if kind == "normal":
        return normal if normal != 1 else None
    if kind == "elite":
        return normal + 1 if normal + 1 != 2 else None
    if kind == "mutant":
        return 4 if pct >= 75 else None
    if kind == "subboss":
        return 4 if pct >= 50 else None
    if kind == "special":
        return 5 if pct >= 75 else None
    if kind == "boss":
        return 5 if pct >= 75 else None
    return None


def main():
    layouts = json.loads((ROOT / "docs" / "maps" / "v2" / "layouts.json").read_text(encoding="utf-8"))
    maps_file = load("maps.json")
    props_file = load("props.json")
    zones_file = load("zones.json")
    en = json.loads((ROOT / "content" / "i18n" / "en.json").read_text(encoding="utf-8"))
    old = {m["id"]: m for m in maps_file["maps"]}
    prop_defs = {p["id"]: p for p in props_file["props"]}
    keys = {L["key"] for c, L in layouts.items() if c not in SKIP}
    built = {}
    problems = []

    for code, L in layouts.items():
        if code in SKIP:
            continue
        mid, zone = L["key"], ZONE_OF[L["zone"]]
        o = old.get(mid)
        W, H, grid = L["w"], L["h"], L["grid"]
        walk = lambda x, y: 0 <= x < W and 0 <= y < H and grid[y][x] in WALK  # noqa: E731
        taken = set()
        objs = L["objects"]
        prefix = next((re.match(r"g_([a-z0-9]+)_", ob["id"]).group(1) for ob in objs if ob["kind"] == "group"), code.lower())
        for ob in objs:
            if ob["kind"] in ("group", "chest", "gate", "spring", "lore", "npc", "herb", "ore", "puzzle"):
                taken.add((ob["x"], ob["y"]))

        # Exit tiles and their first step inside stay clear.
        for ob in objs:
            if ob["kind"] == "exit":
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        taken.add((ob["x"] + dx, ob["y"] + dy))

        def free2x2(x, y):
            for dx, dy in ((0, 0), (-1, 0), (0, -1), (-1, -1)):
                cells = [(x + dx + i, y + dy + j) for i in (0, 1) for j in (0, 1)]
                if all(1 <= cx < W - 1 and 1 <= cy < H - 1 and walk(cx, cy) and (cx, cy) not in taken for cx, cy in cells):
                    taken.update(cells)
                    return {"x": x + dx, "y": y + dy}
            return None

        sp = next(ob for ob in objs if ob["kind"] == "spawn")
        m = {"id": mid, "zoneId": L["zone"], "nameVi": L["name"], "corruption": L["corruption"], "tile": 40, "cols": W, "rows": H, "terrain": grid,
             "spawn": {"x": sp["x"], "y": sp["y"]}}
        taken.add((sp["x"], sp["y"]))
        po = next((ob for ob in objs if ob["kind"] == "portal"), None)
        # An area without its own portal stone keeps one beside the way in (the game needs one on every area).
        m["portal"] = free2x2(po["x"], po["y"]) if po else None
        if not m["portal"]:
            for r in range(1, 8):
                m["portal"] = next((p for p in (free2x2(sp["x"] + dx, sp["y"] + dy) for dx in range(-r, r + 1) for dy in range(-r, r + 1) if abs(dx) == r or abs(dy) == r) if p), None)
                if m["portal"]:
                    break
        if not m["portal"]:
            problems.append(f"{code}: no room for the portal")

        exits = []
        for ob in objs:
            if ob["kind"] != "exit" or ob["to"] in COAST or ob["to"] not in keys:
                continue
            x, y, w, h = ob["x"], ob["y"], 1, 1
            if y in (0, H - 1):
                if walk(x + 1, y):
                    w = 2
                elif walk(x - 1, y):
                    x, w = x - 1, 2
            else:
                if walk(x, y + 1):
                    h = 2
                elif walk(x, y - 1):
                    y, h = y - 1, 2
            e = {"id": ob["id"], "x": x, "y": y, "w": w, "h": h, "to": ob["to"], "arriveX": 0, "arriveY": 0}
            if ob.get("lock"):
                e["lock"] = ob["lock"]
            if ob.get("via") and ob["via"] != "gate":
                e["kind"] = ob["via"]
            exits.append(e)
        m["exits"] = exits

        props = []
        for i, ob in enumerate(ob for ob in objs if ob["kind"] == "landmark"):
            art = next((a for word, a in LANDMARK_ART if word in ob["what"]), ZONE_ART[zone])
            pid = f"prop_adv_lm_{prefix}"
            prop_defs[pid] = {"id": pid, "nameVi": LANDMARK_NAME[art][0], "art": art, "w": ob["w"], "h": ob["h"], "scale": 1}
            en.setdefault("adventure/props.json", {})[f"props/{pid}/nameVi"] = LANDMARK_NAME[art][1]
            props.append({"prop": pid, "x": ob["x"], "y": ob["y"], "_w": ob["w"], "_h": ob["h"]})
        m["props"] = props

        groups, chests, nodes, gates, springs, npcs, lore = [], [], [], [], [], [], []
        shrine = None
        old_groups = {g["id"]: g for g in (o or {}).get("groups", [])}
        old_chests = {c["id"]: c for c in (o or {}).get("chests", [])}
        old_lore = list((o or {}).get("lore", []))
        old_npcs = list((o or {}).get("npcs", []))
        layout_lore = {ob["id"] for ob in objs if ob["kind"] == "lore"}
        spare_lore = [l for l in old_lore if l["id"] not in layout_lore]
        layout_npcs = {ob["id"] for ob in objs if ob["kind"] == "npc"}
        spare_npcs = [n for n in old_npcs if n["id"] not in layout_npcs]
        for ob in objs:
            k = ob["kind"]
            if k == "group" or (k == "chest" and ob.get("type") == "mimic"):
                gid = ob["id"] if k == "group" else "g_" + ob["id"][len("chest_"):]
                kind = ob.get("cls", "normal") if k == "group" else "special"
                prev = old_groups.get(gid)
                enemy = ob.get("enemy") or MIMIC_ENEMY[zone]
                g = {"id": gid, "x": ob["x"], "y": ob["y"], "kind": kind}
                c = corruption(kind, L["corruption"])
                if c:
                    g["corruption"] = c
                if ob.get("sleep"):
                    g["sleep"] = True
                if ob.get("when"):
                    g["when"] = ob["when"]
                if k == "chest":
                    g["disguise"] = "chest"
                if prev:
                    g["pool"] = prev["pool"]
                    for f in ("table", "gift"):
                        if f in prev:
                            g[f] = prev[f]
                else:
                    g["pool"] = [{"weight": 3, "enemies": [enemy]}, {"weight": 1, "enemies": [enemy, enemy]}] if kind == "normal" else [{"weight": 1, "enemies": [enemy]}]
                    if kind in GIFT:
                        g["gift"] = GIFT[kind]
                    if kind == "boss":
                        g["table"] = f"boss_{zone}"
                groups.append(g)
            elif k == "chest":
                t = ob.get("type", "wood")
                prev = old_chests.get(ob["id"])
                table = prev["table"] if prev else (f"chest_wood_{zone}" if t == "wood" else f"chest_gold_{zone}" if t == "gold" else f"treasure_{zone}")
                chests.append({"id": ob["id"], "x": ob["x"], "y": ob["y"], "table": table, "type": t})
            elif k == "gate":
                g = {"id": ob["id"], "x": ob["x"], "y": ob["y"], "w": 1, "h": 1, "element": ob["element"]}
                if re.search(r"boulder|rock|wall", ob["id"]):
                    g["look"] = "crack"
                gates.append(g)
            elif k == "spring":
                springs.append({"id": ob["id"], "x": ob["x"], "y": ob["y"]})
            elif k in ("herb", "ore"):
                nid = ob["id"] if ob["id"].startswith(("herb_", "ore_")) else f"{k}_{prefix}_{len(nodes)}"
                nodes.append({"id": nid, "x": ob["x"], "y": ob["y"], "kind": k, "table": NODE_TABLE[(k, zone)]})
            elif k == "lore":
                lid = ob["id"]
                prev = next((l for l in old_lore if l["id"] == lid), None) or (spare_lore.pop(0) if spare_lore else None)
                if prev:
                    lore.append({"id": prev["id"], "x": ob["x"], "y": ob["y"], "textVi": prev["textVi"]})
                else:
                    vi, eng = NEW_LORE[lid]
                    lore.append({"id": lid, "x": ob["x"], "y": ob["y"], "textVi": vi})
                    en.setdefault("adventure/maps.json", {})[f"maps/{mid}/lore/{lid}/textVi"] = eng
            elif k == "npc":
                if "shrine" in ob["id"] and o and o.get("shrine") and not any(n["id"] == ob["id"] for n in old_npcs):
                    s = next((p for r in range(0, 5) for p in (free2x2(ob["x"] + dx, ob["y"] + dy) for dx in range(-r, r + 1) for dy in range(-r, r + 1) if max(abs(dx), abs(dy)) == r) if p), None)
                    if s:
                        shrine = {**o["shrine"], **s}
                        continue
                prev = next((n for n in old_npcs if n["id"] == ob["id"]), None) or (spare_npcs.pop(0) if spare_npcs else None)
                event = prev["event"] if prev else NEW_EVENTS[len(built) % len(NEW_EVENTS)]
                npcs.append({"id": ob["id"], "x": ob["x"], "y": ob["y"], "event": event})
        covers = [{"id": f"cover_{prefix}_{chr(97 + i)}", "x": c["x0"], "y": c["y0"], "w": c["x1"] - c["x0"] + 1, "h": c["y1"] - c["y0"] + 1, "look": COVER_LOOK[zone]}
                  for i, c in enumerate(L["covers"])]
        puzzles = []
        for ob in (ob for ob in objs if ob["kind"] == "puzzle"):
            gate = next((g for g in gates if g["element"] == ob["element"]), gates[0] if gates else None)
            if gate:
                puzzles.append({"id": ob["id"], "x": ob["x"], "y": ob["y"], "element": ob["element"], "gate": gate["id"]})
        m.update({"groups": groups, "chests": chests, "nodes": nodes, "gates": gates, "covers": covers, "puzzles": puzzles, "springs": springs, "npcs": npcs, "lore": lore})
        if shrine:
            m["shrine"] = shrine
        built[mid] = m

    # An exit whose area has no way back is left out until the layouts give it one (decision 043: every exit has a way back).
    for mid, m in built.items():
        for e in [e for e in m["exits"] if not any(b["to"] == mid for b in built[e["to"]]["exits"])]:
            problems.append(f"{mid}: exit {e['id']} left out ({e['to']} has no way back)")
            m["exits"].remove(e)
    # Arrivals: one step inside the exit that leads back, facing inward.
    for mid, m in built.items():
        for e in m["exits"]:
            dest = built[e["to"]]
            back = next((b for b in dest["exits"] if b["to"] == mid), None)
            if not back:
                e["arriveX"], e["arriveY"], e["facing"] = dest["spawn"]["x"], dest["spawn"]["y"], "down"
                continue
            W, H = dest["cols"], dest["rows"]
            if back["x"] == 0:
                d, face = (1, 0), "right"
            elif back["x"] + back["w"] >= W:
                d, face = (-1, 0), "left"
            elif back["y"] == 0:
                d, face = (0, 1), "down"
            else:
                d, face = (0, -1), "up"
            occupied = {(g["x"], g["y"]) for g in dest["groups"]} | {(t["x"], t["y"]) for k in ("chests", "nodes", "gates", "springs", "npcs", "lore") for t in dest[k]}
            spot = None
            for step in range(1, 5):
                x, y = back["x"] + d[0] * step, back["y"] + d[1] * step
                if dest["terrain"][y][x] in WALK and (x, y) not in occupied:
                    spot = (x, y)
                    break
            if not spot:
                problems.append(f"{mid} {e['id']}: no arrival tile in {e['to']}")
                spot = (dest["spawn"]["x"], dest["spawn"]["y"])
            e["arriveX"], e["arriveY"], e["facing"] = spot[0], spot[1], face

    # A landmark that would cut a way or sit on a thing is left out (the kit's art draws it later).
    for mid, m in built.items():
        keep = []
        for p in m["props"]:
            if landmark_ok(m, p, keep):
                keep.append(p)
            else:
                problems.append(f"{mid}: landmark {p['prop']} left out (it would block the way or stand on a thing)")
        m["props"] = [{"prop": p["prop"], "x": p["x"], "y": p["y"]} for p in keep]
        for pid in {p["prop"] for p in m["props"]}:
            pass
    used_lm = {p["prop"] for m in built.values() for p in m["props"]}
    for pid in [p for p in list(prop_defs) if p.startswith("prop_adv_lm_") and p not in used_lm]:
        del prop_defs[pid]
        en.get("adventure/props.json", {}).pop(f"props/{pid}/nameVi", None)

    maps_file["maps"] = [built.get(m["id"], m) for m in maps_file["maps"]] + [m for k, m in built.items() if k not in old]
    props_file["props"] = list(prop_defs.values())
    for z in zones_file["zones"]:
        if z["id"] in BRANCHES:
            z["branches"] = BRANCHES[z["id"]]
    add_tables(zones_file["tables"])
    for mid, name in NEW_NAMES_EN.items():
        en.setdefault("adventure/maps.json", {})[f"maps/{mid}/nameVi"] = name

    (CONTENT / "maps.json").write_text(json.dumps(maps_file, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    (CONTENT / "props.json").write_text(json.dumps(props_file, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    (CONTENT / "zones.json").write_text(json.dumps(zones_file, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    (ROOT / "content" / "i18n" / "en.json").write_text(json.dumps(en, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    for p in problems:
        print("note:", p)
    print(f"imported {len(built)} areas")


def landmark_ok(m, p, placed) -> bool:
    W, H = m["cols"], m["rows"]
    cells = {(p["x"] + i, p["y"] + j) for i in range(p["_w"]) for j in range(p["_h"])}
    if any(not (0 <= x < W and 0 <= y < H) or m["terrain"][y][x] not in WALK for x, y in cells):
        return False
    things = [(t["x"], t["y"], 1, 1) for k in ("groups", "chests", "nodes", "puzzles", "springs", "npcs", "lore") for t in m[k]]
    things += [(g["x"], g["y"], g["w"], g["h"]) for g in m["gates"]] + [(e["x"], e["y"], e["w"], e["h"]) for e in m["exits"]]
    things += [(m["portal"]["x"], m["portal"]["y"], 2, 2), (m["spawn"]["x"], m["spawn"]["y"], 1, 1)]
    if m.get("shrine"):
        things.append((m["shrine"]["x"], m["shrine"]["y"], 2, 2))
    for q in placed:
        things.append((q["x"], q["y"], q["_w"], q["_h"]))
    if any(x < tx + tw and x >= tx and y < ty + th and y >= ty for (x, y) in cells for tx, ty, tw, th in things):
        return False
    blocked = {(x, y) for y in range(H) for x in range(W) if m["terrain"][y][x] not in WALK}
    blocked |= cells | {(q["x"] + i, q["y"] + j) for q in placed for i in range(q["_w"]) for j in range(q["_h"])}
    return reach_all(m, blocked)


def reach_all(m, blocked) -> bool:
    """Everything usable still reachable from the spawn with every gate open (the game's own check runs in the tests)."""
    W, H = m["cols"], m["rows"]
    start = (m["spawn"]["x"], m["spawn"]["y"])
    seen = {start}
    q = deque([start])
    while q:
        x, y = q.popleft()
        for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if n not in seen and 0 <= n[0] < W and 0 <= n[1] < H and n not in blocked:
                seen.add(n)
                q.append(n)
    near = lambda x, y, w=1, h=1: any((x + i + dx, y + j + dy) in seen for i in range(w) for j in range(h) for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)))  # noqa: E731
    ok = all(near(t["x"], t["y"]) for k in ("groups", "chests", "nodes", "puzzles", "springs", "npcs", "lore") for t in m[k])
    ok &= all(near(e["x"], e["y"], e["w"], e["h"]) for e in m["exits"])
    return ok and near(m["portal"]["x"], m["portal"]["y"], 2, 2)


def add_tables(tables):
    """Lighter wooden chests and richer gold ones per zone (decision 045: more chests on bigger areas)."""
    mats = {"forest": ["item_forest_herb", "item_beast_fang"], "mountain": ["item_mountain_ore", "item_ancient_cog"],
            "ruins": ["item_ancient_cog", "item_ancient_rune"]}
    coins = {"forest": [30, 60], "mountain": [45, 80], "ruins": [60, 110]}
    for zone in ("forest", "mountain", "ruins"):
        a, b = mats[zone]
        tables[f"chest_wood_{zone}"] = {"rolls": 1, "coins": coins[zone], "gemChance": 0.05, "gems": [1, 1],
                                        "entries": [{"itemId": a, "weight": 3, "min": 1, "max": 3}, {"itemId": b, "weight": 1, "min": 1, "max": 1},
                                                    {"itemId": "item_potion_healing", "weight": 2, "min": 1, "max": 1}, {"itemId": "item_adv_exp_small", "weight": 2, "min": 1, "max": 2}]}
        gold = json.loads(json.dumps(tables[f"treasure_{zone}"]))
        gold["rolls"] = 3
        gold["gemChance"] = 0.6
        gold["coins"] = [c * 2 for c in gold["coins"]]
        tables[f"chest_gold_{zone}"] = gold


if __name__ == "__main__":
    sys.exit(main())
