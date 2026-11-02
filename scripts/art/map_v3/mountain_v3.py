# Layout v3 of the mountain zone (decision 046, docs/maps/v3/M2_PLAN.md §4b): M4 Chân Núi, M5 Mỏ Quặng Bỏ Hoang, M6 Đỉnh Dung Nham,
# N4 Đèo Gió, N5 Đường Hầm Cổ, each a fresh layout with every gameplay id, count, kind and behaviour kept. Here `~` is lava. Exits stay on
# the same edge as before; the ways into the ruins (M6 → Cổng Tàn Tích, N4 → Cổng Tàn Tích, N5 → Hành Lang Rune) keep their tiles, so
# the ruins do not change yet. Writes the drafts, hints, guides and the PROMPT of batch adventure-17-mountain-3q (layout_v3.py).
# Usage: python scripts/art/map_v3/mountain_v3.py   then   npx tsx scripts/art/map_v3/check_draft.ts M4 M5 M6 N4 N5
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from layout_v3 import build_all  # noqa: E402

MOUNTAIN_ZONE = {
    "vi": "vùng Núi",
    "key": """- dark grey-brown = solid mountain rock, impassable: craggy boulders, rock walls and outcrops seen in 3/4, their tops from above and, along their lower (south-facing) edges, a front of rock face with cracks and ledges casting soft shade onto the ground; a few hardy pines and dry shrubs on them;
- light beige = open walkable ground: gravel, packed earth, flat rock slabs, a few tufts of dry grass;
- pale tan = trails of trodden gravel, 2 to 3 squares wide; they run off the picture's edges exactly where the plan shows;
- orange = glowing molten lava (channels, pools{water_extra}) with dark cooled-crust banks, a faint warm glow and a few rising sparks; brown planks = sturdy rope-and-plank bridges over the lava""",
    "ridge": "light khaki area ringed in brown = a raised rocky terrace: flat gravel top about two storeys up, a rough rock cliff face (seen from the front, two or three squares tall) on its south side, the pale striped patch = rough stone steps cut into that face, steep rocky slopes on its other sides",
}

MOUNTAIN_MOOD = "a warm, sunny mountain in the afternoon: warm beige and grey rock, ochre gravel, a few dark pines, clear light; adventurous, not gloomy. Do not paint any purple or corruption (it is added by the game)."

M4 = {
    "code": "M4",
    "map": "map_mountain_foot",
    "seed": 201,
    "idea": "the foot of the mountain, where the forest ends: a gravel trail comes in from the left edge and climbs in wide switchbacks up the slope to the right edge, where an old mine waits beyond; an old miners' camp on the lower slope; a raised rocky terrace in the middle and a high ledge in the north-west reached by stone steps; a trail leaves north toward the windy pass; a hidden hollow under an overhang in the south.",
    "mood": MOUNTAIN_MOOD,
    "ground": [
        ("glade", 11, 27, 8, 5),
        ("glade", 30, 25, 9, 5),
        ("glade", 48, 15, 9, 5),
        ("glade", 37, 7, 7, 3.5),
        ("glade", 57, 8, 5, 3.5),
        ("glade", 28, 32, 5, 2.5),
        ("glade", 23, 21, 7, 2.5),
        ("glade", 14, 13, 6, 2.5),
        ("ridge", 23, 16, 6, 2.6, [23]),
        ("ridge", 14, 6.5, 6, 2.4, [14]),
        ("trail", [(0, 28.5), (10, 28), (20, 27), (30, 25), (40, 21), (48, 15), (56, 9), (63.5, 8.5)], 3),
        ("trail", [(40, 21), (37, 9), (36.5, 0.5)], 2.5),
        ("trail", [(20, 27), (23, 21)], 2),
        ("trail", [(37, 9), (24, 10), (14, 12)], 2),
        ("trail", [(30, 26), (29, 31)], 2),
        ("rect", 12, 11, 13, 11, "#"),
        ("rect", 15, 11, 16, 11, "#"),
    ],
    "exits": {"exit_m1_back": (0, 28, 1, 2), "exit_m1_east": (63, 8, 1, 2), "exit_m1_north": (36, 0, 2, 1)},
    "spawn": (2, 28),
    "portal": (4, 25),
    "areas": [
        ("start", "Way up from the forest", (2, 24, 18, 32), "start"),
        ("camp", "Miners' camp", (6, 23, 20, 31), "landmark"),
        ("terrace", "Rocky terrace", (18, 13, 28, 18), "reward"),
        ("ledge", "High ledge (metal gate)", (9, 4, 19, 8), "secret"),
        ("ledgefoot", "Below the ledge", (9, 12, 20, 15), "combat"),
        ("slope", "Middle slope", (22, 20, 38, 29), "combat"),
        ("saddle", "North saddle", (31, 4, 43, 11), "combat"),
        ("upper", "Upper slope (guardian ahead)", (41, 10, 56, 19), "combat"),
        ("hollow", "Hidden hollow (overhang)", (24, 29, 33, 34), "secret"),
    ],
    "fixed": {"g_m1_elite": (58, 9), "gate_m1_metal": (14, 11, 1, 1), "cover_m1_a": (25, 29, 8, 6), "prop_adv_lm_m1": (9, 25)},
    "place": {
        "chest_m1_ledge": "ledge", "chest_m1_hidden": "hollow", "chest_m1_terrace": "terrace", "chest_m1_camp": "camp",
        "ore_m1_a": "slope", "ore_m1_b": "saddle", "spring_m1": "start", "npc_m1_miner": "camp", "lore_m1_carving": "upper",
        "g_m1_a": "slope", "g_m1_b": "slope", "g_m1_c": "saddle", "g_m1_d": "saddle", "g_m1_e": "upper", "g_m1_f": "upper",
        "g_m1_g": "ledgefoot", "g_m1_h": "terrace", "g_m1_i": "camp", "g_m1_j": "slope", "g_m1_k": "upper",
    },
}

M5 = {
    "code": "M5",
    "map": "map_mountain_mine",
    "seed": 202,
    "idea": "an abandoned ore mine inside the mountain, seen from above: wide rock chambers with flat stone floors joined by timber-propped tunnels and old minecart rails; a glowing lava channel runs from the top edge to the bottom edge through the middle, crossed by plank bridges; a flooded side chamber in the south-west, a warm spring chamber in the north-east, a small niche in the south-east; the tunnels come in from the left edge and leave through the right edge and the bottom edge.",
    "mood": "inside the mountain: warm lantern light and the orange glow of lava on rough grey-brown rock, dusty timber props, a little cool light from cracks above; cozy and adventurous, not dark. Do not paint any purple or corruption (it is added by the game).",
    "water_extra": ", a lava channel",
    "ground": [
        ("glade", 6, 10, 5, 3.5),
        ("glade", 24, 18, 9, 6),
        ("glade", 11, 27, 4.5, 3),
        ("glade", 33, 6, 7, 3.5),
        ("glade", 50, 20, 7, 5),
        ("glade", 51, 7, 5, 3),
        ("glade", 58, 30, 3.5, 2.5),
        ("glade", 34, 29, 4.5, 3),
        ("trail", [(0, 10.5), (8, 10.5), (16, 14), (24, 18), (34, 20), (50, 20), (63.5, 20.5)], 3),
        ("trail", [(24, 17), (30, 10), (33, 6)], 2.5),
        ("trail", [(33, 6), (51, 7)], 2),
        ("trail", [(34, 21), (34.5, 35.5)], 2.5),
        ("trail", [(16, 14), (12, 22), (11, 26)], 2),
        ("trail", [(50, 21), (56, 27), (58, 30)], 2),
        ("stream", [(44, 0), (42, 12), (40, 24), (41, 36)], 2),
        ("rect", 10, 23, 11, 23, "#"),
        ("rect", 13, 23, 14, 23, "#"),
        ("rect", 55, 27, 55, 28, "#"),
        ("rect", 58, 27, 58, 28, "#"),
    ],
    "exits": {"exit_m2_west": (0, 10, 1, 2), "exit_m2_east": (63, 20, 1, 2), "exit_m2_south": (34, 35, 2, 1)},
    "spawn": (2, 10),
    "portal": (4, 12),
    "areas": [
        ("start", "Mine entrance", (2, 7, 12, 14), "start"),
        ("hall", "Great hall (mine lift)", (17, 13, 32, 24), "landmark"),
        ("flooded", "Flooded chamber", (8, 24, 15, 31), "reward"),
        ("north", "North chamber (overhang)", (27, 3, 39, 9), "secret"),
        ("spring", "Warm spring chamber", (46, 4, 56, 10), "combat"),
        ("east", "East chamber (guardian ahead)", (44, 15, 57, 25), "combat"),
        ("south", "South tunnel", (31, 24, 38, 33), "combat"),
        ("niche", "Niche", (56, 29, 61, 33), "reward"),
    ],
    "fixed": {"g_m2_elite": (58, 20), "gate_m2_water": (12, 23, 1, 1), "gate_m2_lightning": (56, 27, 2, 1), "cover_m2_a": (27, 3, 8, 6)},
    "place": {
        "prop_adv_lm_m2": "hall",
        "chest_m2_flooded": "flooded", "chest_m2_niche": "niche", "chest_m2_hidden": "north", "chest_m2_hall": "hall",
        "ore_m2_a": "hall", "ore_m2_b": "east", "spring_m2": "spring", "lore_m2_seal": "south",
        "g_m2_a": "hall", "g_m2_b": "hall", "g_m2_c": "spring", "g_m2_d": "north", "g_m2_e": "east", "g_m2_f": "east",
        "g_m2_g": "south", "g_m2_h": "start", "g_m2_i": "spring", "g_m2_j": "south", "g_m2_k": "hall",
    },
}

M6 = {
    "code": "M6",
    "map": "map_mountain_peak",
    "seed": 203,
    "idea": "the lava peak, the summit of the mountain: a lake of glowing lava in the middle with a small rock island, joined to the south shore by a plank bridge; a ring trail around the lake; a raised dark basalt terrace in the east where the zone's boss waits, reached by stone steps from the south; a hidden nook under an overhang in the north-west; the trail comes in from the left edge and leaves through the top edge and, past the boss, the right edge.",
    "mood": "a dramatic but readable volcanic summit: dark basalt and ash-grey ground, warm orange glow from the lava, a clear sky light; exciting, not gloomy. Do not paint any purple or corruption (it is added by the game).",
    "water_extra": ", a lava lake",
    "ground": [
        ("glade", 5, 13, 4, 3.5),
        ("glade", 22, 14, 13, 7.5),
        ("glade", 9, 5, 3.5, 2.2),
        ("glade", 35, 21, 5, 3),
        ("pond", 22, 14, 7, 4.2),
        ("island", 22, 13.5, 2.5, 1.8),
        ("ridge", 41, 12.5, 4.5, 3.6, [40, 41]),
        ("trail", [(0, 13.5), (8, 13.5)], 3),
        ("trail", [(8, 12.5), (14, 7), (30, 7), (35, 12), (35, 18), (40.5, 20)], 3),
        ("trail", [(8, 14.5), (14, 21), (30, 21), (40.5, 20)], 3),
        ("trail", [(14, 7), (14.5, 0.5)], 2.5),
        ("trail", [(14, 7), (9, 5)], 2),
        ("boardwalk", [(22, 21), (22, 15)], 2),
        ("rect", 20, 20, 20, 21, "#"),
        ("rect", 24, 20, 24, 21, "#"),
    ],
    "exits": {"exit_m3_west": (0, 13, 1, 2), "exit_m3_north": (14, 0, 2, 1), "exit_m3_next": (47, 13, 1, 2)},
    "spawn": (2, 13),
    "portal": (3, 15),
    "areas": [
        ("start", "Way in", (1, 10, 9, 17), "start"),
        ("north", "North shore", (12, 4, 34, 9), "combat"),
        ("south", "South shore", (12, 19, 34, 23), "combat"),
        ("island", "Lava island", (20, 12, 24, 15), "reward"),
        ("nook", "Hidden nook (overhang)", (6, 3, 12, 7), "secret"),
        ("approach", "Before the terrace", (31, 16, 40, 24), "combat"),
        ("terrace", "Boss terrace", (37, 9, 45, 16), "boss"),
    ],
    "fixed": {"g_m3_boss": (41, 12), "gate_m3_boulder": (21, 18, 2, 1), "cover_m3_a": (6, 2, 7, 5)},
    "place": {
        "prop_adv_lm_m3": "north", "shrine_m3": "approach",
        "chest_m3_island": "island", "chest_m3_hidden": "nook", "chest_m3_boss": "terrace",
        "spring_m3": "approach", "lore_m3_drake": "south",
        "g_m3_a": "north", "g_m3_b": "north", "g_m3_c": "south", "g_m3_d": "south", "g_m3_e": "approach", "g_m3_f": "north",
        "g_m3_g": "start", "g_m3_h": "south",
    },
}

N4 = {
    "code": "N4",
    "map": "map_mountain_pass",
    "seed": 204,
    "idea": "a windy high pass: a deep gorge of glowing lava runs from the top edge to the bottom edge, crossed by two rope-and-plank bridges; on the west a high rocky shelf (a raised terrace with stone steps) holds an old carved statue; on the east open slopes, a nook in the north-east and a hidden hollow under an overhang in the south-east; the trail comes in from the bottom edge, one leaves through the top edge, one through the right edge.",
    "mood": "high, windy and bright: pale rock, ochre gravel, a few wind-bent pines and dry grass bending in the wind, wisps of steam over the gorge, big clear sky light; adventurous, not gloomy. Do not paint any purple or corruption (it is added by the game).",
    "water_extra": ", a lava gorge",
    "ground": [
        ("glade", 20, 31, 8, 5),
        ("glade", 45, 24, 9, 6),
        ("glade", 48, 11, 7, 4),
        ("glade", 61, 10, 4, 3),
        ("glade", 63, 21, 5, 3.5),
        ("glade", 27, 22, 6, 3),
        ("glade", 16, 22, 6, 2.5),
        ("ridge", 16, 11, 10, 5, [16, 17], 3),
        ("trail", [(20.5, 39.5), (20, 31), (28, 27), (38, 25), (45, 25), (56, 28), (71.5, 30.5)], 3),
        ("trail", [(45, 24), (48, 12), (50.5, 0.5)], 2.5),
        ("trail", [(20, 30), (16.5, 21)], 2),
        ("trail", [(48, 12), (38, 11), (30, 16), (27, 22)], 2),
        ("trail", [(48, 12), (58, 11), (61, 10)], 2),
        ("trail", [(56, 28), (62, 23)], 2),
        ("stream", [(35, 0), (36, 12), (34, 26), (35, 40)], 3),
        ("rect", 57, 9, 57, 9, "#"),
        ("rect", 57, 12, 57, 13, "#"),
    ],
    "exits": {"exit_n4_south": (20, 39, 2, 1), "exit_n4_east": (71, 30, 1, 2), "exit_n4_north": (50, 0, 2, 1)},
    "spawn": (20, 37),
    "portal": (17, 34),
    "areas": [
        ("start", "Way up from the foot", (14, 28, 28, 38), "start"),
        ("shelf", "High shelf (sub-boss, gold chest, statue)", (8, 7, 24, 14), "boss"),
        ("shelffoot", "Below the shelf", (11, 19, 31, 25), "combat"),
        ("east", "East slopes", (38, 19, 56, 30), "combat"),
        ("north", "North slope", (42, 6, 54, 15), "combat"),
        ("nook", "Nook (two lightning rods)", (58, 7, 65, 13), "reward"),
        ("se", "Hidden hollow (overhang)", (59, 18, 68, 25), "secret"),
        ("west_n", "North-west rocks", (26, 9, 33, 18), "combat"),
    ],
    "fixed": {"g_n4_elite": (66, 30), "g_n4_boss": (16, 9), "gate_n4_lightning": (57, 10, 1, 2), "cover_n4_a": (59, 18, 9, 6)},
    "place": {
        "prop_adv_lm_n4": "shelf",
        "chest_n4_shelf": "shelf", "chest_n4_nook": "nook", "chest_n4_hidden": "se", "chest_n4_ledge": "west_n",
        "ore_n4_a": "east", "ore_n4_b": "shelffoot", "puzzle_n4_rod_a": "north", "puzzle_n4_rod_b": "east",
        "spring_n4": "shelffoot", "lore_n4": "east",
        "g_n4_special": "east", "g_n4_mimic": "west_n", "g_n4_f": "north",
        "g_n4_a": "shelffoot", "g_n4_b": "shelffoot", "g_n4_c": "east", "g_n4_d": "east", "g_n4_e": "north", "g_n4_g": "west_n",
        "g_n4_h": "start", "g_n4_i": "shelf", "g_n4_j": "east", "g_n4_k": "north", "g_n4_l": "shelffoot", "g_n4_m": "east",
    },
}

N5 = {
    "code": "N5",
    "map": "map_mountain_tunnels",
    "seed": 205,
    "idea": "ancient tunnels under the mountain linking the forest, the mine and the ruins: rock caverns with smooth stone floors joined by old worked tunnels; a cavern of glowing crystals in the west, a cavern with a lava pool in the middle-south, a great hall in the east, a deep cavern in the north-east, a grotto in the south-west under a low rock ceiling; the tunnel comes in from the left edge and leaves through the top edge and the right edge.",
    "mood": "deep underground but readable: cool grey-blue stone, soft glowing blue and pink crystals, warm orange light from the lava pool, faint daylight from shafts above; mysterious and cozy, not dark. Do not paint any purple or corruption (it is added by the game).",
    "water_extra": ", a lava pool",
    "ground": [
        ("glade", 6, 20, 5, 4),
        ("glade", 22, 12, 8, 5),
        ("glade", 37, 27, 8, 5),
        ("glade", 52, 18, 9, 6),
        ("glade", 36, 7, 6, 3.5),
        ("glade", 15, 32, 7, 4.5),
        ("glade", 61, 7, 6, 4),
        ("glade", 56, 31, 3.5, 2.5),
        ("pond", 37, 29, 4, 2.2),
        ("trail", [(0, 20.5), (10, 20), (22, 14), (36, 16), (52, 18), (64, 23), (71.5, 24.5)], 3),
        ("trail", [(36, 16), (36, 7), (36.5, 0.5)], 2.5),
        ("trail", [(22, 15), (18, 26), (15, 31)], 2),
        ("trail", [(36, 17), (38, 24)], 2),
        ("trail", [(52, 18), (57, 12), (61, 8)], 2),
        ("trail", [(55, 22), (55.5, 28), (56, 31)], 2),
        ("rect", 52, 12, 54, 12, "#"),
        ("rect", 52, 27, 54, 27, "#"),
        ("rect", 57, 27, 59, 27, "#"),
    ],
    "exits": {"exit_n5_west": (0, 20, 1, 2), "exit_n5_north": (36, 0, 2, 1), "exit_n5_east": (71, 24, 1, 2)},
    "spawn": (2, 20),
    "portal": (4, 22),
    "areas": [
        ("start", "Way in from the forest", (2, 16, 11, 24), "start"),
        ("crystal", "Crystal cavern", (15, 8, 29, 16), "combat"),
        ("lava", "Lava pool cavern", (30, 23, 45, 32), "combat"),
        ("hall", "Great hall (rune door)", (44, 13, 61, 23), "landmark"),
        ("north", "North cavern", (31, 4, 41, 11), "combat"),
        ("grotto", "Grotto (low rock ceiling)", (9, 27, 22, 37), "secret"),
        ("deep", "Deep cavern (sub-boss, gold chest)", (56, 3, 67, 11), "boss"),
        ("pocket", "Earth-sealed pocket", (52, 28, 60, 34), "reward"),
    ],
    "fixed": {
        "g_n5_elite": (66, 24), "g_n5_boss": (62, 7), "gate_n5_metal": (55, 12, 3, 1), "gate_n5_earth": (55, 27, 2, 1),
        "cover_n5_a": (8, 26, 14, 11),
    },
    "place": {
        "prop_adv_lm_n5": "hall",
        "chest_n5_cavern": "deep", "chest_n5_grotto": "grotto", "chest_n5_hall": "pocket", "chest_n5_entry": "start",
        "ore_n5_a": "crystal", "ore_n5_b": "lava", "puzzle_n5_gear": "hall", "spring_n5": "hall", "lore_n5": "crystal",
        "g_n5_special": "lava", "g_n5_mimic": "north", "g_n5_e": "hall",
        "g_n5_a": "crystal", "g_n5_b": "crystal", "g_n5_c": "lava", "g_n5_d": "lava", "g_n5_f": "hall", "g_n5_g": "north",
        "g_n5_h": "hall", "g_n5_i": "grotto", "g_n5_j": "crystal", "g_n5_k": "north", "g_n5_l": "start",
    },
}

if __name__ == "__main__":
    import json

    from import_v3 import guarded

    drafts, arrivals = build_all([M4, M5, M6, N4, N5], "adventure-17-mountain-3q", MOUNTAIN_ZONE, "mountain_v3.py")
    for code, m in drafts.items():
        print(code, m["id"], "gates guard:", json.dumps(guarded(m)))
    print("arrivals of live areas:", arrivals)
