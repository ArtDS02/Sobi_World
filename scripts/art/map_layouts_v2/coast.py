# Bờ Biển (zone_coast), map layouts v2 (decision 045): N7 beach, N8 reef, N9 wreck cove (the zone boss).
# Graph (decision 043): N3-N7, N7-N8, N7-N9, N8-N9. The zone opens after the mountain boss, team level 14-24.
from layout import Layout


def n7() -> Layout:
    L = Layout("map_coast_beach", "N7", "Bãi Vỏ Sò", "zone_coast", 72, 40,
               "a shell beach: grassy dunes with a lighthouse to the north, warm sand, tide pools and palm groves, the sea along the south", 40, seed=139)
    L.border(2, 4)
    L.shore(30, 2.5)
    L.plateau(4, 2, 40, 12)
    L.steps(20, 21, 11, 12)
    for b in [(52, 6, 6, 4), (66, 20, 5, 4), (8, 24, 5, 3)]:
        L.blob(*b, "#")
    for b in [(30, 24, 3, 1.5), (52, 26, 2.5, 1.5)]:
        L.blob(*b, "~")
    L.line([(0, 14), (12, 16), (30, 18), (50, 16), (64, 12), (71, 10)], 2)
    L.line([(12, 16), (16, 26), (40, 27), (60, 26), (71, 30)], 2)
    L.line([(20, 15), (20, 13)], 2)
    L.line([(20, 10), (30, 6)], 2)
    L.rect(48, 4, 54, 7, ".")
    L.line([(50, 15), (50, 8)], 1)
    L.cover(46, 2, 57, 9, "a palm canopy over a hidden hollow")
    L.rect(63, 18, 68, 21, ".")
    L.rect(59, 19, 62, 19, ",")
    for b in [(58, 30, 3, 1.5), (40, 22, 2.5, 1.2)]:
        L.blob(*b, "c")
    L.add("spawn", 2, 14)
    L.add("portal", 6, 17)
    L.add("exit", 0, 14, id="exit_n7_west", to="map_forest_marsh", via="trail")
    L.add("exit", 71, 10, id="exit_n7_east", to="map_coast_reef", via="trail")
    L.add("exit", 71, 30, id="exit_n7_dock", to="map_coast_cove", via="shore")
    L.add("group", 64, 20, id="g_c1_elite", cls="elite", enemy="enemy_tide_wraith")
    L.foes("c1", [(8, 18, "enemy_dew_frog"), (22, 20, "enemy_gale_sparrow"), (30, 22, "enemy_dew_frog"), (44, 22, "enemy_tide_wraith"),
                  (56, 17, "enemy_gale_sparrow"), (60, 24, "enemy_dew_frog"), (28, 8, "enemy_gale_sparrow"), (10, 6, "enemy_dew_frog"),
                  (40, 14, "enemy_tide_wraith"), (36, 28, "enemy_dew_frog"), (16, 24, "enemy_gale_sparrow", {"sleep": True})])
    L.add("chest", 67, 19, id="chest_c1_nook", type="silver")
    L.add("chest", 52, 5, id="chest_c1_hidden", type="hidden")
    L.add("chest", 6, 5, id="chest_c1_dune", type="wood")
    L.add("chest", 48, 27, id="chest_c1_shore", type="wood")
    L.add("gate", 61, 19, id="gate_c1_coral", element="EARTH", note="a wall of hard coral")
    L.add("spring", 14, 14, id="spring_c1")
    L.add("npc", 46, 24, id="npc_c1_fisher", note="a fisherman's camp")
    L.add("lore", 30, 4, id="lore_c1")
    L.add("herb", 24, 15, id="herb_c1")
    L.add("landmark", 34, 3, w=3, h=4, what="an old striped lighthouse on the dunes", sprite="prop_adv_ruins_pillar")
    L.add("crystal", 58, 30)
    return L


def n8() -> Layout:
    L = Layout("map_coast_reef", "N8", "Rạn San Hô", "zone_coast", 72, 40,
               "a coral reef: sandbar islands in a shallow turquoise sea, joined by boardwalks and rope bridges; a sea cave on the far island", 50, seed=149, min_walk=0.25)
    L.rect(0, 0, 71, 39, "~")
    for b in [(8, 20, 7, 6), (24, 10, 7, 5), (26, 30, 7, 5), (44, 18, 8, 6), (60, 8, 7, 5), (62, 30, 7, 6), (40, 34, 5, 3)]:
        L.blob(*b, ".", rough=0.25)
    for b in [(52, 26, 3, 2), (16, 4, 4, 2), (36, 4, 3, 2), (68, 18, 3, 3)]:
        L.blob(*b, "#")
    for pts in [[(0, 20), (8, 20)], [(8, 20), (24, 10)], [(8, 20), (26, 30)], [(24, 10), (44, 18)], [(26, 30), (44, 18)], [(44, 18), (60, 8)],
                [(44, 18), (62, 30)], [(26, 30), (40, 34), (36, 39)]]:
        L.line(pts, 2)
    L.cover(55, 3, 66, 12, "a sea-cave arch of rock over a hidden island")
    for b in [(66, 33, 3, 1.5), (8, 23, 2, 1.2)]:
        L.blob(*b, "c")
    L.add("spawn", 2, 20)
    L.add("portal", 6, 17)
    L.add("exit", 0, 20, id="exit_n8_west", to="map_coast_beach", via="shore")
    L.add("exit", 36, 39, id="exit_n8_south", to="map_coast_cove", via="shore")
    L.add("group", 62, 30, id="g_c2_boss", cls="subboss", enemy="enemy_tide_wraith")
    L.add("group", 44, 16, id="g_c2_elite", cls="elite", enemy="enemy_dew_frog")
    L.add("group", 26, 27, id="g_c2_special", cls="special", when="rain", enemy="enemy_tide_wraith")
    L.foes("c2", [(6, 17, "enemy_dew_frog"), (11, 23, "enemy_gale_sparrow"), (22, 8, "enemy_dew_frog", {"sleep": True}), (27, 12, "enemy_tide_wraith"),
                  (23, 32, "enemy_dew_frog"), (30, 31, "enemy_gale_sparrow"), (41, 21, "enemy_tide_wraith"), (48, 20, "enemy_dew_frog", {"cls": "mutant"}),
                  (59, 9, "enemy_gale_sparrow"), (40, 35, "enemy_dew_frog"), (64, 27, "enemy_tide_wraith"), (14, 18, "enemy_dew_frog")])
    L.add("chest", 66, 31, id="chest_c2_island", type="gold")
    L.add("chest", 62, 7, id="chest_c2_cave", type="hidden")
    L.add("chest", 8, 24, id="chest_c2_mimic", type="mimic")
    L.add("chest", 26, 8, id="chest_c2_bar", type="wood")
    L.add("chest", 46, 21, id="chest_c2_guarded", type="silver")
    L.add("gate", 52, 13, id="gate_c2_coral", element="EARTH", note="a wall of hard coral on the boardwalk")
    L.add("puzzle", 24, 13, id="puzzle_c2_clam", element="WATER")
    L.add("spring", 44, 22, id="spring_c2", note="before the boardwalk to the sub-boss island")
    L.add("lore", 30, 32, id="lore_c2")
    L.add("landmark", 41, 32, w=3, h=3, what="a giant sea-turtle-shell rock arch", sprite="prop_adv_forest_boulder")
    L.add("crystal", 66, 33)
    return L


def n9() -> Layout:
    L = Layout("map_coast_cove", "N9", "Vịnh Đắm Tàu", "zone_coast", 64, 36,
               "the wreck cove: a sandy crescent around a dark bay, a shipwreck on a sand spit where the sea's corrupted lord waits, cliffs to the north-west", 60, seed=151)
    L.border(2, 4)
    L.blob(34, 26, 22, 9, "~")
    L.blob(43, 24, 6, 3, ".", rough=0.15)
    L.plateau(4, 2, 24, 12)
    L.steps(14, 15, 11, 12)
    L.blob(58, 6, 6, 5, "#")
    L.blob(6, 30, 6, 5, "#")
    L.line([(0, 10), (10, 14), (20, 16), (36, 14), (36, 0)], 2)
    L.line([(36, 14), (40, 19), (42, 22)], 2)
    L.line([(36, 14), (54, 15), (56, 22), (49, 24)], 2)
    L.line([(20, 16), (10, 22), (14, 32)], 2)
    L.line([(14, 10), (8, 5)], 2)
    L.blob(5, 18, 3, 2.5, "#")
    L.rect(3, 16, 6, 19, ".")
    L.line([(10, 15), (6, 17)], 1)
    L.cover(2, 15, 8, 20, "a sea-cliff overhang over a hidden grotto")
    for b in [(24, 21, 3, 1.5), (54, 20, 2, 1.2)]:
        L.blob(*b, "c")
    L.add("spawn", 2, 10)
    L.add("portal", 4, 13)
    L.add("exit", 0, 10, id="exit_n9_west", to="map_coast_beach", via="shore")
    L.add("exit", 36, 0, id="exit_n9_north", to="map_coast_reef", via="shore")
    L.add("group", 43, 24, id="g_c3_boss", cls="boss", enemy="enemy_tide_wraith")
    L.foes("c3", [(12, 18, "enemy_dew_frog"), (24, 18, "enemy_gale_sparrow"), (30, 12, "enemy_tide_wraith"), (44, 12, "enemy_dew_frog"),
                  (52, 12, "enemy_gale_sparrow"), (56, 19, "enemy_tide_wraith"), (16, 6, "enemy_dew_frog", {"sleep": True}), (10, 26, "enemy_tide_wraith"),
                  (14, 30, "enemy_dew_frog")])
    L.add("chest", 5, 17, id="chest_c3_grotto", type="hidden")
    L.add("chest", 20, 6, id="chest_c3_cliff", type="wood")
    L.add("chest", 46, 25, id="chest_c3_boss", type="gold")
    L.add("chest", 57, 22, id="chest_c3_shore", type="silver")
    L.add("spring", 36, 16, id="spring_c3", note="before the boardwalks to the wreck")
    L.add("npc", 22, 4, id="npc_c3_shrine", note="WATER Guardian shrine")
    L.add("lore", 9, 7, id="lore_c3")
    L.add("landmark", 45, 20, w=4, h=3, what="a big wooden shipwreck lying on its side on the sand spit", sprite="prop_adv_forest_hut")
    L.add("crystal", 24, 21)
    return L


LAYOUTS = [n7, n8, n9]
