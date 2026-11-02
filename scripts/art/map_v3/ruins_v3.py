# Layout v3 of the ruins zone (decision 046, docs/maps/v3/M2_PLAN.md §4b): M7 Cổng Tàn Tích, M8 Hành Lang Rune, M9 Điện Phong Ấn,
# N6 Hầm Mộ Rune, each a fresh layout with every gameplay id, count, kind and behaviour kept. Exits stay on the same edge as before;
# the ways from the mountain (M6, N4, N5) keep their tiles there, so the arrivals here follow them. Element gates sit on the narrowest
# neck before their pocket (`gate_in`). Writes the drafts, hints, guides and the PROMPT of batch adventure-18-ruins-3q (layout_v3.py).
# Usage: python scripts/art/map_v3/ruins_v3.py   then   npx tsx scripts/art/map_v3/check_draft.ts M7 M8 M9 N6
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from layout_v3 import build_all  # noqa: E402

RUINS_ZONE = {
    "vi": "vùng Tàn Tích",
    "key": """- grey stone blocks = SOLID MASONRY, impassable: {inside}; it fills its whole footprint, edge to edge, with no floor, no plants and no gap anywhere inside it;
- the dark band along the lower (south-facing) edges of the masonry = its tall front face seen in 3/4: a vertical wall of big dressed stone blocks with carved runes and old relief panels, about one and a half squares tall, casting soft shade onto the floor below it;
- light stone = open walkable floor: worn flagstones of halls, rooms and courtyards, thin moss in the joints, a little scattered small rubble;
- pale cream = paved avenues and corridors of big old slabs, 2 to 3 squares wide; they run off the picture's edges exactly where the plan shows;
- blue = still dark water (pools, channels{water_extra}) in square-cut stone basins; brown planks = old wooden plank bridges""",
    "inside": "the flat tops of massive, thick ancient walls and buried temple foundations built of big grey stone blocks laid in courses, with cracked capstones, a few missing blocks, carved rune slabs and broken column stumps set into it",
    "rules": """STRUCTURE (the most important rule): this map is a rune temple-crypt, a maze of stone halls, rooms and corridors cut through solid masonry, like an old dungeon seen from above. The masonry IS the walls: every walkable area (light stone, pale cream) is fully enclosed by it, and its borders follow the plan's outline exactly, so the stone alone shows where a character can go. Build the borders as straight wall runs with crisp corners and angles (short straight steps where the plan curves), never as soft round kerbs or thin garden walls. The only openings are where the walkable floor itself continues in the plan; never a breach, a gap or a shortcut through the masonry. Nothing in the picture is empty background: no flat dark colour, no void, no forest, no grass field, no bushes and no trees anywhere; every part of the image is walkable floor, water or solid stone. Image 2 is a forest map: take only its finish, view and scale from it, nothing green. Vegetation is minimal: thin moss in joints and a few small ivy strands on the wall faces only.""",
    "ridge": "light khaki area ringed in brown = a raised stone platform (a dais): flat paved top about two storeys up, a carved stone retaining wall (seen from the front, two squares tall) on its south side, the pale striped patch = a wide flight of stone steps up that wall, broken stone edges on its other sides",
}

RUINS_MOOD = "an ancient rune temple, quiet and solemn: warm late-afternoon light on grey and sand-coloured stone, deep carvings of runes on the wall faces, cool soft shade in the corners; mysterious but readable, not dark. Do not paint any purple or corruption (it is added by the game)."

M7 = {
    "code": "M7",
    "map": "map_ruins_gate",
    "seed": 301,
    "idea": "the gate of the ruins: a broad paved avenue climbs from the bottom-left corner up to a great gateway in the wall at the top edge; walled courtyards on both sides of the avenue, each with a small reflecting pool; a small walled crypt room in the west behind a narrow passage; a quiet walled nook in the south-east; a plaza before the gate; trails leave through the left edge (to the mountain), the bottom edge (to the windy pass) and the right edge (to the crypt).",
    "mood": RUINS_MOOD,
    "ground": [
        ("glade", 6, 29, 5, 4),
        ("glade", 18, 15, 7, 5),
        ("glade", 46, 15, 8, 5),
        ("glade", 32, 7, 7, 3.5),
        ("glade", 6, 12, 3.5, 2.5),
        ("glade", 57, 29, 4.5, 3),
        ("glade", 30, 22, 6, 3.5),
        ("pond", 16, 16, 2.5, 1.8),
        ("pond", 49, 16, 2.5, 1.8),
        ("trail", [(0, 30.5), (10, 30), (20, 27), (30, 22), (32, 12), (32.5, 0.5)], 3),
        ("trail", [(20, 27), (26, 31), (26.5, 35.5)], 2.5),
        ("trail", [(32, 16), (46, 17), (54, 18), (63.5, 18.5)], 3),
        ("trail", [(30, 17), (20, 15)], 2.5),
        ("trail", [(18, 14), (11, 13), (7, 12)], 2),
        ("trail", [(54, 19), (56, 25), (57, 29)], 2),
    ],
    "exits": {"exit_r1_back": (0, 30, 1, 2), "exit_r1_east": (32, 0, 2, 1), "exit_r1_side": (63, 18, 1, 2), "exit_r1_pass": (26, 35, 2, 1)},
    "spawn": (2, 30),
    "portal": (4, 27),
    "areas": [
        ("start", "Way in from the mountain", (2, 25, 12, 33), "start"),
        ("west", "West courtyard", (12, 11, 25, 20), "combat"),
        ("east", "East courtyard", (40, 11, 54, 20), "combat"),
        ("plaza", "Plaza before the great gate", (27, 4, 38, 11), "landmark"),
        ("crypt", "Crypt room (light seal)", (3, 10, 9, 14), "reward"),
        ("corner", "Corner under a fallen roof", (52, 26, 62, 33), "secret"),
        ("avenue", "Lower avenue", (14, 20, 36, 30), "combat"),
    ],
    "fixed": {"g_r1_elite": (32, 5), "cover_r1_a": (52, 26, 9, 7)},
    "gate_in": {"gate_r1_light": "crypt"},
    "place": {
        "prop_adv_lm_r1": "plaza",
        "chest_r1_crypt": "crypt", "chest_r1_hidden": "corner", "chest_r1_court": "west", "chest_r1_corner": "east",
        "spring_r1": "start", "npc_r1_altar": "plaza", "lore_r1_lamp": "avenue",
        "g_r1_a": "west", "g_r1_b": "west", "g_r1_c": "east", "g_r1_d": "east", "g_r1_e": "avenue", "g_r1_f": "avenue",
        "g_r1_g": "plaza", "g_r1_h": "start", "g_r1_i": "east", "g_r1_j": "avenue",
    },
}

M8 = {
    "code": "M8",
    "map": "map_ruins_hall",
    "seed": 302,
    "idea": "the rune hall: a long paved corridor runs from the left edge to the right edge between two long stone walls with broken pillars built into them; small walled chambers open on both sides of it, four above and four below, each joined to it by a short passage through the wall; one passage climbs to the top edge (an old tunnel to the mountain), one leaves through the bottom edge (stairs down to the crypt).",
    "mood": RUINS_MOOD + " Faintly glowing rune carvings along the corridor.",
    "ground": [
        ("glade", 4, 18, 3.5, 3),
        ("glade", 12, 9, 4, 3),
        ("glade", 26, 9, 5, 3.5),
        ("glade", 40, 9, 4, 3),
        ("glade", 52, 9, 4, 3),
        ("glade", 12, 28, 4, 3),
        ("glade", 26, 28, 5, 3.5),
        ("glade", 40, 28, 4, 3),
        ("glade", 52, 28, 4, 3),
        ("trail", [(0, 18.5), (20, 18.5), (40, 18.5), (63.5, 18.5)], 3),
        ("trail", [(12, 17), (12, 10)], 2),
        ("trail", [(26, 17), (26, 9), (26.5, 0.5)], 2.5),
        ("trail", [(40, 17), (40, 10)], 2),
        ("trail", [(52, 17), (52, 10)], 2),
        ("trail", [(12, 20), (12, 27)], 2),
        ("trail", [(26, 20), (26, 27)], 2),
        ("trail", [(40, 20), (40, 27)], 2),
        ("trail", [(52, 20), (54, 28), (56.5, 35.5)], 2.5),
    ],
    "exits": {"exit_r2_west": (0, 18, 1, 2), "exit_r2_east": (63, 18, 1, 2), "exit_r2_south": (56, 35, 2, 1), "exit_r2_tunnels": (26, 0, 2, 1)},
    "spawn": (2, 18),
    "portal": (4, 15),
    "areas": [
        ("start", "Way in", (1, 15, 8, 22), "start"),
        ("n1", "North chamber 1", (8, 6, 16, 12), "combat"),
        ("n2", "North chamber 2 (old tunnel)", (21, 5, 31, 13), "combat"),
        ("n3", "North chamber 3 (lightning seal)", (36, 6, 44, 12), "reward"),
        ("n4", "North chamber 4 (old wall)", (48, 6, 56, 12), "landmark"),
        ("s1", "South chamber 1 (shadow seal)", (8, 25, 16, 31), "reward"),
        ("s2", "South chamber 2 (fallen roof)", (21, 24, 31, 32), "secret"),
        ("s3", "South chamber 3", (36, 25, 44, 31), "combat"),
        ("s4", "South chamber 4", (48, 25, 56, 31), "combat"),
        ("hall", "Corridor", (8, 16, 56, 21), "combat"),
    ],
    "fixed": {"g_r2_elite": (59, 18), "cover_r2_a": (20, 22, 12, 13)},
    "gate_in": {"gate_r2_lightning": "n3", "gate_r2_dark": "s1"},
    "place": {
        "prop_adv_lm_r2": "n4",
        "chest_r2_lightning": "n3", "chest_r2_dark": "s1", "chest_r2_hidden": "s2", "chest_r2_vault": "s3",
        "spring_r2": "start", "npc_r2_vault": "n2", "lore_r2_threads": "n1",
        "g_r2_a": "n1", "g_r2_b": "n2", "g_r2_c": "n4", "g_r2_d": "s3", "g_r2_e": "s4", "g_r2_f": "hall", "g_r2_g": "hall",
        "g_r2_h": "hall", "g_r2_i": "s4", "g_r2_j": "n2", "g_r2_k": "s3",
    },
}

M9 = {
    "code": "M9",
    "map": "map_ruins_sanctum",
    "seed": 303,
    "idea": "the sealed sanctum, the end of the ruins: a wide paved outer yard in the west with two dark square pools; to the east a great raised stone platform (a dais) holding the seal, reached by a wide flight of steps from the south, where the zone's boss waits; a small shrine room in the north-west behind a narrow passage; a little walled room in the south-west; the trail comes in from the left edge and stairs leave through the bottom edge.",
    "mood": RUINS_MOOD + " Solemn, with soft shafts of light on the dais.",
    "ground": [
        ("glade", 12, 13, 9, 8),
        ("glade", 5, 4, 3, 2),
        ("glade", 5, 22, 3, 2),
        ("glade", 30, 23, 8, 2.5),
        ("pond", 12, 7, 3, 1.8),
        ("pond", 12, 19, 3, 1.8),
        ("ridge", 35, 12, 9, 6, [34, 35]),
        ("trail", [(0, 13.5), (10, 13.5), (20, 16), (26, 22), (34.5, 22)], 3),
        ("trail", [(24, 22), (24.5, 26.5)], 2.5),
        ("trail", [(8, 10), (5, 5)], 2),
        ("trail", [(8, 17), (5, 21)], 2),
    ],
    "exits": {"exit_r3_west": (0, 13, 1, 2), "exit_r3_south": (24, 26, 2, 1)},
    "spawn": (2, 13),
    "portal": (3, 15),
    "areas": [
        ("start", "Way in", (1, 10, 8, 17), "start"),
        ("yard", "Outer yard", (6, 6, 21, 21), "combat"),
        ("shrine", "Shrine room (metal seal)", (2, 2, 8, 6), "reward"),
        ("room", "Room under a fallen roof", (2, 20, 8, 25), "secret"),
        ("steps", "Before the steps", (24, 20, 40, 25), "combat"),
        ("dais", "The seal (boss)", (28, 7, 42, 17), "boss"),
    ],
    "fixed": {"g_r3_boss": (35, 10), "cover_r3_a": (2, 20, 6, 5)},
    "gate_in": {"gate_r3_metal": "shrine"},
    "place": {
        "prop_adv_lm_r3": "dais", "shrine_r3": "steps",
        "chest_r3_metal": "shrine", "chest_r3_hidden": "room", "chest_r3_boss": "dais",
        "spring_r3": "steps", "lore_r3_seal": "yard",
        "g_r3_a": "yard", "g_r3_b": "yard", "g_r3_c": "yard", "g_r3_d": "steps", "g_r3_e": "steps", "g_r3_f": "yard",
        "g_r3_g": "start", "g_r3_h": "steps",
    },
}

N6 = {
    "code": "N6",
    "map": "map_ruins_crypt",
    "seed": 304,
    "idea": "the rune crypt under the ruins, seen from above: stone halls with flagstone floors joined by narrow corridors around a dark water channel that crosses the crypt from the top edge to the bottom edge under two plank bridges; an ossuary hall in the north-east behind a narrow passage; a sealed vault in the south-west; the corridor comes in from the left edge, stairs leave through the top edge and the right edge.",
    "mood": "an underground crypt but readable: cool grey stone lit by warm braziers and faint rune glow, dark still water, cobwebs and ivy in corners; mysterious, not frightening. Do not paint any purple or corruption (it is added by the game).",
    "water_extra": ", a dark water channel",
    "inside": "the flat tops of massive, thick crypt walls and bedrock built of big dark-grey stone blocks laid in courses, with cracked capstones, rune slabs, a few roots and cobwebs in the cracks",
    "ground": [
        ("glade", 7, 20, 5, 4),
        ("glade", 28, 19, 9, 6),
        ("glade", 29, 8, 6, 3.5),
        ("glade", 58, 29, 8, 5),
        ("glade", 61, 9, 6, 4),
        ("glade", 14, 32, 6, 4),
        ("glade", 40, 33, 6, 3.5),
        ("trail", [(0, 20.5), (12, 20), (28, 19), (46, 24), (58, 29), (71.5, 30.5)], 3),
        ("trail", [(29, 18), (29, 8), (30.5, 0.5)], 2.5),
        ("trail", [(40, 22), (50, 14), (60, 10)], 2),
        ("trail", [(12, 21), (14, 31)], 2),
        ("trail", [(38, 23), (40, 32)], 2),
        ("stream", [(47, 0), (46, 14), (44, 26), (48, 40)], 2),
    ],
    "exits": {"exit_n6_west": (0, 20, 1, 2), "exit_n6_north": (30, 0, 2, 1), "exit_n6_east": (71, 30, 1, 2)},
    "spawn": (2, 20),
    "portal": (4, 22),
    "areas": [
        ("start", "Way in from the gate", (2, 16, 12, 25), "start"),
        ("hall", "Central hall", (20, 14, 37, 25), "combat"),
        ("north", "North hall", (24, 4, 35, 12), "combat"),
        ("east", "East hall (guardian ahead)", (51, 25, 66, 34), "combat"),
        ("ossuary", "Ossuary (sub-boss, gold chest)", (55, 5, 68, 13), "boss"),
        ("vault", "Sealed vault (fallen ceiling)", (8, 28, 20, 37), "secret"),
        ("south", "South hall", (34, 30, 46, 37), "combat"),
    ],
    "fixed": {"g_n6_elite": (66, 30), "g_n6_boss": (62, 9), "cover_n6_a": (7, 27, 13, 11)},
    "gate_in": {"gate_n6_light": "ossuary"},
    "place": {
        "prop_adv_lm_n6": "hall",
        "chest_n6_ossuary": "ossuary", "chest_n6_vault": "vault", "chest_n6_hall": "south", "chest_n6_entry": "start",
        "puzzle_n6_plate_a": "hall", "puzzle_n6_plate_b": "east", "spring_n6": "north", "lore_n6": "hall",
        "g_n6_special": "hall", "g_n6_mimic": "south", "g_n6_g": "east",
        "g_n6_a": "hall", "g_n6_b": "hall", "g_n6_c": "north", "g_n6_d": "north", "g_n6_e": "east", "g_n6_f": "east",
        "g_n6_h": "south", "g_n6_i": "south", "g_n6_j": "vault", "g_n6_k": "start", "g_n6_l": "hall", "g_n6_m": "east",
        "g_n6_n": "north",
    },
}

if __name__ == "__main__":
    import json

    from import_v3 import guarded

    drafts, arrivals = build_all([M7, M8, M9, N6], "adventure-18-ruins-3q", RUINS_ZONE, "ruins_v3.py")
    for code, m in drafts.items():
        print(code, m["id"], "gates guard:", json.dumps(guarded(m)))
    print("arrivals of live areas:", arrivals)
