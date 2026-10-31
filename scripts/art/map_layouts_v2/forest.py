# Rừng Thì Thầm (zone_forest), map layouts v2 (decision 045): main line M1-M3, branches N1-N3.
# Exits follow the graph of decision 043: M1-M2-M3-M4, M1-N1, N1-N2, N2-N3, N2->M3 (shortcut opened from M3), M2-N5 (mountain),
# N3-N7 (coast). Ids of the current M1-M3 objects are kept where the object survives (id=...).
from layout import Layout


def m1() -> Layout:
    L = Layout("map_forest_edge", "M1", "Bìa Rừng", "zone_forest", 64, 36,
               "the sunny edge of the forest: a meadow split by a stream, two bridges, a raised meadow to the north-east", 10, seed=11)
    L.border(2, 4)
    L.blob(8, 7, 8, 5, "#")
    L.blob(5, 31, 7, 4, "#")
    L.blob(24, 3, 9, 3, "#")
    L.blob(58, 31, 7, 5, "#")
    L.blob(44, 31, 4, 2.5, "#")
    L.line([(31, 0), (30, 8), (32, 16), (30, 24), (31, 35)], 3, "~")
    L.plateau(36, 3, 52, 10)
    L.steps(42, 43, 9, 10)
    L.line([(4, 18), (14, 18), (30, 18), (46, 17), (63, 17)], 2)
    L.line([(14, 18), (14, 27), (31, 27), (47, 26), (52, 20), (54, 17)], 2)
    L.line([(42, 17), (42, 11)], 2)
    L.line([(42, 8), (42, 0)], 2)
    L.rect(42, 1, 43, 3, ",")
    # Hidden trail under the north-west canopy.
    L.line([(12, 13), (12, 9), (6, 6)], 1)
    L.cover(4, 4, 13, 10, "forest canopy over a hidden trail")
    # Bramble nook in the south-east wood (FIRE).
    L.rect(54, 27, 58, 31, ".")
    L.rect(50, 29, 53, 29, ",")
    L.blob(47, 22, 2, 1.5, "c")
    L.add("spawn", 5, 18)
    L.add("portal", 6, 14)
    L.add("exit", 63, 17, id="exit_f1_east", to="map_forest_deep", via="trail", lock="guardian")
    L.add("exit", 42, 0, id="exit_f1_north", to="map_forest_hollow", via="trail")
    L.add("group", 58, 17, id="g_f1_elite", cls="elite", enemy="enemy_bramble_boar")
    for i, (x, y, e) in enumerate([(20, 14, "enemy_mossling"), (24, 21, "enemy_dew_frog"), (36, 21, "enemy_thorn_sprout"),
                                   (40, 25, "enemy_gale_sparrow"), (47, 7, "enemy_mossling"), (10, 27, "enemy_ember_fox"),
                                   (56, 11, "enemy_forest_wolf"), (38, 13, "enemy_mossling"), (20, 31, "enemy_thorn_sprout")]):
        L.add("group", x, y, id=f"g_f1_{chr(97 + i)}", cls="normal", enemy=e)
    L.add("group", 26, 28, id="g_f1_sleep", cls="normal", sleep=True, enemy="enemy_dew_frog")
    L.add("chest", 6, 6, id="chest_f1_hidden", type="hidden")
    L.add("chest", 50, 5, id="chest_f1_pocket", type="silver")
    L.add("chest", 56, 29, id="chest_f1_grove", type="wood")
    L.add("chest", 21, 32, id="chest_f1_meadow", type="wood")
    L.add("gate", 53, 29, id="gate_f1_bramble", element="FIRE")
    L.add("spring", 16, 15, id="spring_f1")
    L.add("lore", 46, 5, id="lore_f1_sapling")
    L.add("npc", 9, 23, id="npc_f1_herbalist")
    L.add("herb", 22, 10, id="herb_f1_a")
    L.add("herb", 40, 30, id="herb_f1_b")
    L.add("landmark", 22, 23, w=3, h=3, what="a giant hollow ancient oak with huge roots")
    L.add("crystal", 47, 22)
    return L


def m2() -> Layout:
    L = Layout("map_forest_deep", "M2", "Rừng Sâu", "zone_forest", 64, 36,
               "the deep forest: clearings joined by two routes, a pond and a stream, a mossy ridge with an old shrine", 18, seed=23)
    L.border(2, 4)
    L.blob(19, 27, 7, 4, "#")
    L.blob(46, 6, 7, 3.5, "#")
    L.blob(54, 28, 6, 4.5, "#")
    L.blob(8, 6, 6, 4, "#")
    L.blob(36, 30, 5, 3.5, "#")
    L.blob(24, 9, 5, 3, "~")
    L.line([(24, 12), (26, 20), (25, 28), (24, 35)], 2, "~")
    L.plateau(36, 13, 50, 20)
    L.steps(42, 43, 19, 20)
    L.line([(0, 18), (12, 18), (18, 15), (32, 15), (36, 11), (52, 11), (63, 10)], 2)
    L.line([(12, 18), (16, 22), (28, 23), (36, 24), (52, 22), (58, 16), (60, 11)], 2)
    L.line([(42, 23), (42, 21)], 2)
    L.line([(28, 23), (30, 29), (30, 35)], 2)
    # Hidden path into the dark grove.
    L.line([(16, 23), (16, 28), (21, 29)], 1)
    L.cover(14, 25, 23, 31, "dark forest canopy over a hidden grove")
    # Vine nook (NATURE) and boulder nook (EARTH).
    L.rect(5, 5, 10, 8, ".")
    L.rect(10, 9, 10, 11, ",")
    L.rect(55, 27, 59, 31, ".")
    L.rect(56, 23, 56, 26, ",")
    L.blob(57, 5, 4, 2.5, ".")
    L.blob(33, 26, 2, 1.5, "c")
    L.add("spawn", 2, 18)
    L.add("portal", 5, 21)
    L.add("exit", 0, 18, id="exit_f2_west", to="map_forest_edge", via="trail")
    L.add("exit", 63, 10, id="exit_f2_east", to="map_forest_heart", via="trail", lock="guardian")
    L.add("exit", 30, 35, id="exit_f2_south", to="map_mountain_tunnels", via="tunnel", note="N5, closed until the mountain zone opens")
    L.add("group", 58, 10, id="g_f2_elite", cls="elite", enemy="enemy_wolf_alpha")
    for i, (x, y, e) in enumerate([(6, 14, "enemy_mossling"), (20, 19, "enemy_ember_fox"), (30, 11, "enemy_dew_frog"),
                                   (33, 23, "enemy_forest_wolf"), (48, 16, "enemy_thorn_sprout"), (53, 8, "enemy_gale_sparrow"),
                                   (38, 8, "enemy_forest_wolf"), (56, 20, "enemy_bramble_boar"), (28, 31, "enemy_mossling"),
                                   (10, 26, "enemy_thorn_sprout")]):
        L.add("group", x, y, id=f"g_f2_{chr(97 + i)}", cls="normal", enemy=e)
    L.add("group", 46, 24, id="g_f2_sleep", cls="normal", sleep=True, enemy="enemy_forest_wolf")
    L.add("chest", 21, 29, id="chest_f2_hidden", type="hidden")
    L.add("chest", 7, 6, id="chest_f2_vines", type="silver")
    L.add("chest", 57, 29, id="chest_f2_boulder", type="wood")
    L.add("gate", 10, 10, id="gate_f2_vines", element="NATURE")
    L.add("gate", 56, 26, id="gate_f2_boulder", element="EARTH")
    L.add("spring", 6, 22, id="spring_f2")
    L.add("npc", 44, 15, id="npc_f2_shrine")
    L.add("lore", 40, 9, id="lore_f2")
    L.add("landmark", 57, 4, w=3, h=2, what="a ring of mossy standing stones")
    L.add("crystal", 33, 26)
    return L


def m3() -> Layout:
    L = Layout("map_forest_heart", "M3", "Lõi Rừng", "zone_forest", 48, 27,
               "the heart of the forest, already sick: withered trees and violet cracks around a huge dying tree; the Angry Old Tree waits in a clearing to the east",
               30, seed=37)
    L.border(2, 3)
    L.blob(39, 14, 9, 8, "#")
    L.blob(39, 14, 6.5, 5.5, ".", rough=0.15)
    L.blob(21, 13, 4, 3, "c")
    L.blob(36, 5, 3, 1.5, "c")
    L.blob(12, 21, 3, 1.5, "c")
    L.line([(0, 14), (6, 14), (10, 8), (30, 8), (35, 11)], 2)
    L.line([(6, 14), (10, 20), (30, 20), (35, 17)], 2)
    L.line([(16, 8), (16, 0)], 2)
    L.line([(44, 13), (47, 13)], 2)
    L.line([(40, 19), (40, 23)], 1)
    L.rect(37, 23, 43, 24, ".")
    L.line([(10, 20), (4, 23)], 1)
    L.cover(1, 20, 8, 25, "withered canopy over a hidden hollow")
    L.add("spawn", 2, 14)
    L.add("exit", 0, 14, id="exit_f3_west", to="map_forest_deep", via="trail")
    L.add("exit", 16, 0, id="exit_f3_north", to="map_forest_falls", via="trail", note="N2 shortcut: walking this way opens the way back from N2")
    L.add("exit", 47, 13, id="exit_f3_next", to="map_mountain_foot", via="trail", lock="guardian")
    L.add("group", 40, 14, id="g_f3_boss", cls="boss", enemy="enemy_old_treant")
    for i, (x, y, e) in enumerate([(12, 10, "enemy_forest_wolf"), (14, 18, "enemy_bramble_boar"), (26, 22, "enemy_thorn_sprout"),
                                   (8, 17, "enemy_mossling"), (30, 5, "enemy_ember_fox"), (27, 10, "enemy_forest_wolf"),
                                   (29, 17, "enemy_bramble_boar")]):
        L.add("group", x, y, id=f"g_f3_{chr(97 + i)}", cls="normal", enemy=e)
    L.add("group", 22, 6, id="g_f3_sleep", cls="normal", sleep=True, enemy="enemy_mossling")
    L.add("chest", 4, 23, id="chest_f3_hidden", type="hidden")
    L.add("chest", 42, 23, id="chest_f3_root", type="wood")
    L.add("gate", 40, 21, id="gate_f3_shadow", element="DARK")
    L.add("spring", 28, 21, id="spring_f3")
    L.add("npc", 6, 4, id="npc_f3_shrine", note="NATURE Guardian shrine")
    L.rect(4, 3, 9, 6, ".")
    L.line([(6, 7), (8, 12)], 1)
    L.add("lore", 18, 4, id="lore_f3")
    L.add("landmark", 21, 12, w=4, h=4, what="a huge withered grey tree with dark-violet veins, violet mushrooms around its roots")
    L.add("crystal", 36, 5)
    L.add("crystal", 12, 21)
    return L


def n1() -> Layout:
    L = Layout("map_forest_hollow", "N1", "Thung Nấm", "zone_forest", 64, 36,
               "a hollow of giant mushrooms north of the forest edge: loops of trails, a terrace with a guarded treasure, a bramble nook", 15, seed=41)
    L.border(2, 4)
    L.blob(12, 10, 8, 6, "#")
    L.blob(30, 24, 5, 4, "#")
    L.blob(54, 30, 7, 4, "#")
    L.blob(26, 4, 7, 2.5, "#")
    L.plateau(3, 21, 22, 30)
    L.steps(12, 13, 29, 30)
    L.line([(40, 35), (40, 27), (38, 18)], 2)
    L.line([(38, 18), (52, 14), (63, 12)], 2)
    L.line([(38, 18), (24, 16), (20, 18)], 2)
    L.line([(40, 31), (22, 33), (12, 33), (12, 31)], 2)
    L.line([(38, 18), (44, 8), (58, 6), (60, 12)], 2)
    L.line([(20, 14), (12, 10), (6, 7)], 1)
    L.cover(4, 5, 18, 13, "giant mushroom caps over a hidden trail")
    L.rect(55, 27, 60, 32, ".")
    L.rect(50, 29, 54, 29, ",")
    L.add("spawn", 40, 33)
    L.add("portal", 44, 32)
    L.add("exit", 40, 35, id="exit_n1_south", to="map_forest_edge", via="trail")
    L.add("exit", 63, 12, id="exit_n1_east", to="map_forest_falls", via="trail")
    L.add("group", 8, 25, id="g_n1_boss", cls="subboss", enemy="enemy_wolf_alpha")
    L.add("group", 56, 30, id="g_n1_elite", cls="elite", enemy="enemy_bramble_boar")
    L.add("group", 26, 31, id="g_n1_special", cls="special", when="rain", enemy="enemy_ember_fox")
    for i, (x, y, e, extra) in enumerate([(40, 29, "enemy_mossling", {}), (35, 21, "enemy_thorn_sprout", {}), (46, 12, "enemy_gale_sparrow", {}),
                                          (30, 15, "enemy_forest_wolf", {}), (22, 18, "enemy_mossling", {}), (52, 16, "enemy_dew_frog", {"sleep": True}),
                                          (56, 7, "enemy_ember_fox", {}), (48, 7, "enemy_thorn_sprout", {}), (16, 25, "enemy_mossling", {"sleep": True}),
                                          (19, 23, "enemy_forest_wolf", {}), (57, 20, "enemy_bramble_boar", {"cls": "mutant"}),
                                          (44, 22, "enemy_dew_frog", {}), (30, 33, "enemy_thorn_sprout", {})]):
        a = {"cls": "normal", **extra}
        L.add("group", x, y, id=f"g_n1_{chr(97 + i)}", enemy=e, **a)
    L.add("chest", 5, 23, id="chest_n1_terrace", type="gold")
    L.add("chest", 6, 7, id="chest_n1_hidden", type="hidden")
    L.add("chest", 58, 28, id="chest_n1_nook", type="silver")
    L.add("chest", 59, 31, id="chest_n1_mimic", type="mimic")
    L.add("chest", 50, 4, id="chest_n1_ridge", type="wood")
    L.add("chest", 33, 9, id="chest_n1_glade", type="wood")
    L.add("gate", 54, 29, id="gate_n1_bramble", element="FIRE", note="opens when both braziers are lit")
    L.add("puzzle", 48, 27, id="puzzle_n1_brazier_a", element="FIRE")
    L.add("puzzle", 46, 31, id="puzzle_n1_brazier_b", element="FIRE")
    L.add("spring", 18, 33, id="spring_n1", note="before the terrace steps and the sub-boss")
    L.add("lore", 30, 10, id="lore_n1")
    L.add("herb", 36, 27, id="herb_n1")
    L.add("landmark", 46, 21, w=3, h=3, what="a gigantic red-capped mushroom tree")
    return L


def n2() -> Layout:
    L = Layout("map_forest_falls", "N2", "Thác Rêu", "zone_forest", 72, 40,
               "mossy falls: a high cliff shelf with a river that falls into the lower forest; a cave behind the waterfall; a quick way down to the heart of the forest",
               20, seed=53)
    L.border(2, 4)
    L.blob(10, 31, 7, 5, "#")
    L.blob(56, 35, 9, 3.5, "#")
    L.blob(66, 7, 4, 4, "#")
    L.blob(8, 3, 6, 2.5, "#")
    L.plateau(20, 2, 60, 14)
    L.line([(40, 0), (40, 12)], 3, "~")
    L.rect(39, 13, 41, 14, "w")
    L.line([(40, 15), (38, 22), (44, 30), (46, 39)], 3, "~")
    L.steps(22, 23, 13, 14)
    L.steps(56, 57, 13, 14)
    L.line([(0, 12), (10, 12), (18, 16), (22, 16)], 2)
    L.line([(10, 12), (14, 20), (30, 22), (50, 24), (62, 28), (71, 28)], 2)
    L.line([(22, 11), (36, 8), (44, 8), (56, 10)], 2)
    L.line([(57, 16), (62, 26)], 2)
    L.line([(30, 22), (26, 30), (24, 39)], 2)
    # Cave behind the waterfall.
    L.rect(35, 15, 38, 17, ".")
    L.rect(42, 15, 45, 17, ".")
    L.line([(34, 21), (35, 17)], 1)
    L.cover(34, 15, 46, 18, "the curtain of the waterfall and a mossy rock overhang over a hidden cave")
    # Boulder nook to the east (EARTH).
    L.rect(65, 14, 69, 20, ".")
    L.rect(62, 18, 64, 18, ",")
    L.blob(60, 33, 2.5, 1.5, "c")
    L.blob(14, 29, 2.5, 1.5, "c")
    L.add("spawn", 2, 12)
    L.add("portal", 6, 15)
    L.add("exit", 0, 12, id="exit_n2_west", to="map_forest_hollow", via="trail")
    L.add("exit", 24, 39, id="exit_n2_south", to="map_forest_heart", via="trail", lock="shortcut", note="opens after coming up from M3")
    L.add("exit", 71, 28, id="exit_n2_east", to="map_forest_marsh", via="trail")
    L.add("group", 52, 6, id="g_n2_boss", cls="subboss", enemy="enemy_old_treant")
    L.add("group", 66, 18, id="g_n2_elite", cls="elite", enemy="enemy_forest_wolf")
    L.add("group", 37, 16, id="g_n2_special", cls="special", when="night", enemy="enemy_forest_wolf")
    for i, (x, y, e, extra) in enumerate([(12, 16, "enemy_mossling", {}), (20, 21, "enemy_dew_frog", {}), (28, 26, "enemy_thorn_sprout", {}),
                                          (32, 5, "enemy_gale_sparrow", {}), (27, 10, "enemy_forest_wolf", {}), (46, 11, "enemy_ember_fox", {}),
                                          (50, 26, "enemy_bramble_boar", {}), (60, 24, "enemy_dew_frog", {}), (42, 34, "enemy_mossling", {}),
                                          (20, 34, "enemy_ember_fox", {"sleep": True}), (32, 33, "enemy_thorn_sprout", {}),
                                          (8, 22, "enemy_forest_wolf", {"sleep": True}), (56, 19, "enemy_gale_sparrow", {"cls": "mutant"}),
                                          (52, 31, "enemy_forest_wolf", {})]):
        a = {"cls": "normal", **extra}
        L.add("group", x, y, id=f"g_n2_{chr(97 + i)}", enemy=e, **a)
    L.add("chest", 56, 4, id="chest_n2_shelf", type="gold")
    L.add("chest", 43, 16, id="chest_n2_cave", type="hidden")
    L.add("chest", 67, 16, id="chest_n2_nook", type="silver")
    L.add("chest", 4, 26, id="chest_n2_glade", type="wood")
    L.add("chest", 64, 32, id="chest_n2_bank", type="wood")
    L.add("gate", 64, 18, id="gate_n2_boulder", element="EARTH")
    L.add("spring", 46, 6, id="spring_n2", note="before the sub-boss on the shelf")
    L.add("lore", 30, 6, id="lore_n2")
    L.add("herb", 16, 25, id="herb_n2")
    L.add("landmark", 48, 30, w=3, h=3, what="a giant mossy tree stump with a little door, home of the forest spirits")
    return L


def n3() -> Layout:
    L = Layout("map_forest_marsh", "N3", "Đầm Sương", "zone_forest", 80, 45,
               "a misty marsh at the far end of the forest, sicker than the rest: pools, reed islands and boardwalks; the way to the sea", 35, seed=67)
    L.border(2, 4)
    for b in [(20, 14, 6, 4), (40, 31, 7, 5), (56, 11, 8, 4), (62, 35, 6, 4), (12, 39, 5, 2.5), (34, 8, 4, 2.5)]:
        L.blob(*b, "~")
    for b in [(48, 23, 4, 3), (27, 22, 4, 3), (71, 27, 4, 5), (6, 9, 5, 4)]:
        L.blob(*b, "#")
    L.line([(0, 28), (14, 28), (26, 30), (30, 24), (44, 22), (52, 27), (60, 22), (70, 18), (79, 18)], 2)
    L.line([(14, 28), (16, 21), (28, 17), (34, 13), (46, 16), (56, 18), (64, 18)], 2)
    L.line([(26, 30), (28, 38), (48, 40), (60, 41), (72, 38), (76, 30), (74, 20)], 2)
    L.line([(40, 23), (40, 28)], 2)
    L.blob(40, 31, 3, 2, ".", rough=0.1)
    L.line([(26, 26), (27, 22)], 1)
    L.rect(26, 21, 28, 23, ".")
    L.cover(24, 19, 31, 25, "a thicket of tall reeds and willow over a hidden patch")
    L.rect(64, 41, 68, 42, ".")
    for b in [(56, 38, 3, 1.5), (68, 12, 3, 2), (22, 33, 2.5, 1.5), (46, 33, 2, 1.2)]:
        L.blob(*b, "c")
    L.add("spawn", 2, 28)
    L.add("portal", 7, 31)
    L.add("exit", 0, 28, id="exit_n3_west", to="map_forest_falls", via="trail")
    L.add("exit", 79, 18, id="exit_n3_east", to="map_coast_beach", via="shore", note="N7, closed until the coast zone opens")
    L.add("group", 40, 31, id="g_n3_boss", cls="subboss", enemy="enemy_tide_wraith")
    L.add("group", 71, 39, id="g_n3_elite", cls="elite", enemy="enemy_dew_frog")
    L.add("group", 60, 5, id="g_n3_special", cls="special", when="rain", enemy="enemy_tide_wraith")
    for i, (x, y, e, extra) in enumerate([(8, 26, "enemy_dew_frog", {}), (17, 24, "enemy_mossling", {}), (22, 31, "enemy_thorn_sprout", {}),
                                          (31, 16, "enemy_gale_sparrow", {}), (44, 17, "enemy_dew_frog", {}), (52, 26, "enemy_forest_wolf", {}),
                                          (60, 21, "enemy_tide_wraith", {}), (66, 17, "enemy_dew_frog", {"cls": "mutant"}), (31, 38, "enemy_mossling", {}),
                                          (44, 40, "enemy_dew_frog", {"sleep": True}), (56, 41, "enemy_thorn_sprout", {}), (66, 30, "enemy_forest_wolf", {}),
                                          (75, 30, "enemy_tide_wraith", {}), (17, 33, "enemy_ember_fox", {"sleep": True}), (50, 34, "enemy_tide_wraith", {})]):
        a = {"cls": "normal", **extra}
        L.add("group", x, y, id=f"g_n3_{chr(97 + i)}", enemy=e, **a)
    L.add("chest", 42, 32, id="chest_n3_island", type="gold")
    L.add("chest", 27, 22, id="chest_n3_reeds", type="hidden")
    L.add("chest", 66, 41, id="chest_n3_mimic", type="mimic")
    L.add("chest", 74, 40, id="chest_n3_guarded", type="silver")
    L.add("chest", 10, 20, id="chest_n3_bank", type="wood")
    L.add("chest", 46, 14, id="chest_n3_north", type="wood")
    L.add("gate", 48, 40, id="gate_n3_water", element="WATER", note="the dry channel fills when the water wheel turns")
    L.add("puzzle", 36, 40, id="puzzle_n3_wheel", element="WATER")
    L.add("spring", 40, 21, id="spring_n3", note="before the boardwalk to the sub-boss island")
    L.add("lore", 10, 23, id="lore_n3")
    L.add("herb", 34, 27, id="herb_n3")
    L.add("landmark", 22, 36, w=3, h=3, what="a ruined fishing hut on stilts")
    L.add("crystal", 56, 38)
    L.add("crystal", 68, 12)
    return L


LAYOUTS = [m1, m2, m3, n1, n2, n3]
