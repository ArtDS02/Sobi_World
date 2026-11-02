# Layout v3 of the coast zone (decision 046, docs/maps/v3/M2_PLAN.md §4b): N7 Bãi Vỏ Sò, N8 Rạn San Hô, N9 Vịnh Đắm Tàu, each a fresh
# layout with every gameplay id, count, kind and behaviour kept. Exits stay on the same edge as before; the way in from the marsh keeps
# its tile on N3. Element gates sit on the narrowest neck before their pocket (`gate_in`). Writes the drafts, hints, guides and the
# PROMPT of batch adventure-19-coast-3q (layout_v3.py).
# Usage: python scripts/art/map_v3/coast_v3.py   then   npx tsx scripts/art/map_v3/check_draft.ts N7 N8 N9
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from layout_v3 import build_all  # noqa: E402

COAST_ZONE = {
    "vi": "vùng Biển",
    "key": """- dark olive-grey = impassable: weathered rock outcrops, sea cliffs and dense thickets of palms and beach shrubs, seen in 3/4: their tops from above and, along their lower (south-facing) edges, a front of rock face or trunks casting soft shade onto the sand;
- warm cream = open walkable ground: soft warm sand with shells, pebbles, driftwood bits and tufts of dune grass;
- light tan = trodden sandy trails, 2 to 3 squares wide; they run off the picture's edges exactly where the plan shows;
- blue = the sea and its pools ({water_extra}) with foamy shorelines, clear turquoise shallows turning deep blue further out; brown planks = weathered wooden boardwalks and piers on posts over the water""",
    "ridge": "light sand area ringed in brown = a raised grassy headland: flat dune-grass top about two storeys up, a sandstone cliff face (seen from the front, two squares tall) on its south side, the pale striped patch = wooden steps up that face, steep sandy slopes on its other sides",
}

COAST_MOOD = "a bright, breezy seaside afternoon: warm cream sand, turquoise shallows, deep blue water, white foam, green palms and dune grass; cheerful and calm. Do not paint any purple or corruption (it is added by the game)."

N7 = {
    "code": "N7",
    "map": "map_coast_beach",
    "seed": 401,
    "idea": "a shell beach where the marsh meets the sea: wide warm sand along the middle, the sea along the bottom edge with foamy waves, a few rock-rimmed tide pools; a raised grassy headland in the north-west for an old lighthouse; a palm grove in the south-west hiding a quiet spot; a rocky nook in the east; the trail comes in from the left edge and leaves through the right edge in the north (to the reef) and along the shore in the south-east (to the wreck cove).",
    "mood": COAST_MOOD,
    "water_extra": "tide pools, the open sea",
    "ground": [
        ("glade", 8, 14, 7, 5),
        ("glade", 30, 18, 13, 6),
        ("glade", 58, 10, 9, 4),
        ("glade", 60, 28, 9, 4),
        ("glade", 24, 26, 7, 3.5),
        ("glade", 67, 20, 3.5, 2.5),
        ("glade", 9, 28, 5, 3),
        ("glade", 14, 12, 7, 2.5),
        ("pond", 36, 42, 46, 9),
        ("pond", 24, 27, 2.5, 1.5),
        ("pond", 47, 24, 2, 1.4),
        ("ridge", 14, 6, 6, 2.6, [14]),
        ("trail", [(0, 14.5), (14, 14), (30, 17), (46, 14), (60, 11), (71.5, 10.5)], 3),
        ("trail", [(30, 18), (42, 25), (56, 28), (71.5, 30.5)], 2.5),
        ("trail", [(14, 13), (14, 10)], 2),
        ("trail", [(12, 16), (9, 27)], 2),
        ("trail", [(60, 28), (64, 22), (67, 20)], 2),
    ],
    "exits": {"exit_n7_west": (0, 14, 1, 2), "exit_n7_east": (71, 10, 1, 2), "exit_n7_dock": (71, 30, 1, 2)},
    "spawn": (2, 14),
    "portal": (4, 16),
    "areas": [
        ("start", "Way in from the marsh", (2, 10, 12, 19), "start"),
        ("headland", "Lighthouse headland", (8, 2, 20, 8), "landmark"),
        ("beach", "Shell beach", (19, 13, 43, 23), "combat"),
        ("tide", "Tide pools", (17, 23, 33, 30), "combat"),
        ("north_e", "North-east dunes (guardian ahead)", (48, 6, 67, 14), "combat"),
        ("east_s", "South-east shore", (49, 24, 68, 31), "combat"),
        ("nook", "Rocky nook (coral wall)", (64, 17, 70, 23), "reward"),
        ("grove", "Palm grove", (4, 24, 15, 32), "secret"),
    ],
    "fixed": {"g_c1_elite": (66, 10), "cover_c1_a": (3, 24, 12, 8)},
    "gate_in": {"gate_c1_coral": "nook"},
    "place": {
        "prop_adv_lm_c1": "headland",
        "chest_c1_nook": "nook", "chest_c1_hidden": "grove", "chest_c1_dune": "beach", "chest_c1_shore": "tide",
        "herb_c1": "beach", "spring_c1": "start", "npc_c1_fisher": "east_s", "lore_c1": "tide",
        "g_c1_a": "beach", "g_c1_b": "beach", "g_c1_c": "beach", "g_c1_d": "tide", "g_c1_e": "tide", "g_c1_f": "north_e",
        "g_c1_g": "north_e", "g_c1_h": "east_s", "g_c1_i": "east_s", "g_c1_j": "headland", "g_c1_k": "east_s",
    },
}

N8 = {
    "code": "N8",
    "map": "map_coast_reef",
    "seed": 402,
    "idea": "a coral reef: a shallow turquoise sea with sandbar islands joined by weathered wooden boardwalks on posts; the way in is an island on the left edge; a sea cave on the far north-east island under a rock overhang; a bigger island in the east; a natural turtle-shell rock arch on the middle island; a boardwalk leaves through the bottom edge toward the wreck cove.",
    "mood": COAST_MOOD + " Colourful coral visible under the clear shallows.",
    "water_extra": "a shallow reef sea with colourful coral under the water",
    "ground": [
        ("pond", 36, 20, 60, 34),
        ("island", 7, 20, 6.5, 5),
        ("island", 24, 12, 6, 4),
        ("island", 25, 29, 6, 4),
        ("island", 40, 20, 6, 4.5),
        ("island", 62, 9, 7, 4.5),
        ("island", 58, 25, 7, 5),
        ("island", 36, 34, 5, 3),
        ("boardwalk", [(12, 19), (19, 13)], 2),
        ("boardwalk", [(12, 22), (20, 28)], 2),
        ("boardwalk", [(29, 13), (35, 18)], 2),
        ("boardwalk", [(30, 28), (35, 22)], 2),
        ("boardwalk", [(45, 18), (56, 11)], 2),
        ("boardwalk", [(45, 22), (52, 24)], 2),
        ("boardwalk", [(39, 24), (37, 31)], 2),
        ("boardwalk", [(36, 37), (36.5, 39.5)], 2),
        ("boardwalk", [(1, 20.5), (2, 20.5)], 2),
    ],
    "exits": {"exit_n8_west": (0, 20, 1, 2), "exit_n8_south": (36, 39, 2, 1)},
    "spawn": (2, 20),
    "portal": (4, 22),
    "areas": [
        ("start", "Way in (west island)", (2, 15, 13, 25), "start"),
        ("n_isle", "North sandbar", (19, 8, 29, 16), "combat"),
        ("s_isle", "South sandbar", (20, 25, 30, 33), "combat"),
        ("centre", "Middle island (turtle arch)", (35, 16, 45, 24), "landmark"),
        ("ne", "Far island (sea cave)", (55, 5, 69, 14), "secret"),
        ("east", "East island (sub-boss, gold chest)", (51, 20, 66, 30), "boss"),
        ("south", "South island", (31, 31, 41, 37), "combat"),
    ],
    "fixed": {"g_c2_elite": (36, 34), "g_c2_boss": (58, 25), "cover_c2_a": (56, 4, 12, 10)},
    "gate_in": {"gate_c2_coral": "east"},
    "place": {
        "prop_adv_lm_c2": "centre",
        "chest_c2_island": "east", "chest_c2_cave": "ne", "chest_c2_bar": "n_isle", "chest_c2_guarded": "south",
        "puzzle_c2_clam": "centre", "spring_c2": "start", "lore_c2": "s_isle",
        "g_c2_special": "centre", "g_c2_mimic": "n_isle", "g_c2_h": "ne",
        "g_c2_a": "n_isle", "g_c2_b": "n_isle", "g_c2_c": "s_isle", "g_c2_d": "s_isle", "g_c2_e": "centre", "g_c2_f": "ne",
        "g_c2_g": "south", "g_c2_i": "start", "g_c2_j": "s_isle", "g_c2_k": "ne", "g_c2_l": "centre",
    },
}

N9 = {
    "code": "N9",
    "map": "map_coast_cove",
    "seed": 403,
    "idea": "the wreck cove: a crescent of sand around a dark bay that opens to the sea at the bottom edge; a long sand spit runs from the north beach into the middle of the bay, and at its end a wrecked ship lies stranded (leave the spit's end as bare sand for the wreck, which is added later) where the zone's boss waits; rocky sea cliffs in the north-west with a little grotto; the shore trail comes in from the left edge and leaves through the top edge.",
    "mood": "a moody but readable cove at the end of the coast: warm sand, darker blue bay water, white foam, weathered rocks, a few palms; dramatic, not gloomy. Do not paint any purple or corruption (it is added by the game).",
    "water_extra": "a deep bay, the open sea",
    "ground": [
        ("glade", 10, 12, 7, 5),
        ("glade", 34, 8, 8, 4),
        ("glade", 54, 13, 7, 6),
        ("glade", 12, 26, 8, 5),
        ("glade", 57, 27, 5, 4),
        ("glade", 5, 5, 3, 2.5),
        ("pond", 38, 25, 18, 9),
        ("pond", 40, 37, 26, 5),
        ("island", 41, 24, 6.5, 3.8),
        ("trail", [(0, 10.5), (10, 11), (22, 9), (34, 8), (36.5, 0.5)], 3),
        ("trail", [(10, 12), (12, 25)], 2.5),
        ("trail", [(36, 9), (52, 12), (57, 25)], 2.5),
        ("trail", [(8, 10), (5, 5)], 2),
        ("sandbar", [(36, 11), (38, 17), (40, 22)], 3),
    ],
    "exits": {"exit_n9_west": (0, 10, 1, 2), "exit_n9_north": (36, 0, 2, 1)},
    "spawn": (2, 10),
    "portal": (5, 12),
    "areas": [
        ("start", "Way in from the beach", (2, 7, 13, 15), "start"),
        ("grotto", "Cliff grotto", (2, 2, 9, 7), "secret"),
        ("north", "North beach", (24, 4, 44, 12), "combat"),
        ("west", "West beach", (5, 18, 20, 32), "combat"),
        ("east", "East beach", (46, 8, 62, 31), "combat"),
        ("spit", "Sand spit and wreck (boss)", (34, 13, 46, 27), "boss"),
    ],
    "fixed": {"g_c3_boss": (40, 23), "cover_c3_a": (2, 2, 7, 6)},
    "place": {
        "prop_adv_lm_c3": "spit",
        "chest_c3_grotto": "grotto", "chest_c3_cliff": "west", "chest_c3_boss": "spit", "chest_c3_shore": "east",
        "spring_c3": "north", "npc_c3_shrine": "north", "lore_c3": "east",
        "g_c3_a": "north", "g_c3_b": "north", "g_c3_c": "west", "g_c3_d": "west", "g_c3_e": "east", "g_c3_f": "east",
        "g_c3_g": "west", "g_c3_h": "east", "g_c3_i": "spit",
    },
}

if __name__ == "__main__":
    import json

    from import_v3 import guarded

    drafts, arrivals = build_all([N7, N8, N9], "adventure-19-coast-3q", COAST_ZONE, "coast_v3.py")
    for code, m in drafts.items():
        print(code, m["id"], "gates guard:", json.dumps(guarded(m)))
    print("arrivals of live areas:", arrivals)
