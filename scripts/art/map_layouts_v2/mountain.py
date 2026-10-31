# Núi Đá Vọng (zone_mountain), map layouts v2 (decision 045): main line M4-M6, branches N4 (pass) and N5 (old tunnels).
# Graph (decision 043): M3-M4-M5-M6-M7, M4-N4, N4->M6 (shortcut opened from M6), N4-M7 (ruins), M2-N5 (forest), N5->M5 (shortcut
# opened from M5), N5-M8 (ruins). Water in this zone is lava.
from layout import Layout


def m4() -> Layout:
    L = Layout("map_mountain_foot", "M4", "Chân Núi", "zone_mountain", 64, 36,
               "the foot of the mountain: a switchback climb over two rocky terraces, an old miners' camp below", 30, seed=71)
    L.border(2, 4)
    L.blob(7, 8, 6, 5, "#")
    L.blob(4, 33, 6, 3, "#")
    L.blob(56, 29, 5, 3.5, "#")
    L.plateau(14, 12, 58, 23)
    L.plateau(30, 3, 60, 13)
    L.steps(26, 27, 22, 23)
    L.steps(54, 55, 22, 23)
    L.steps(44, 45, 12, 13)
    L.line([(0, 28), (20, 28), (26, 25)], 2)
    L.line([(20, 28), (36, 31), (50, 31), (54, 25)], 2)
    L.line([(26, 20), (40, 17), (44, 15)], 2)
    L.line([(54, 20), (48, 16), (44, 15)], 2)
    L.line([(44, 10), (56, 8), (63, 8)], 2)
    L.line([(36, 9), (36, 0)], 2)
    L.rect(3, 5, 8, 9, ".")
    L.rect(9, 8, 13, 8, ",")
    L.rect(53, 27, 58, 30, ".")
    L.line([(50, 31), (53, 29)], 1)
    L.cover(52, 26, 59, 31, "a rock overhang over a hidden hollow")
    L.blob(46, 33, 2, 1.2, "c")
    L.add("spawn", 2, 28)
    L.add("portal", 5, 25)
    L.add("exit", 0, 28, id="exit_m1_back", to="map_forest_heart", via="trail")
    L.add("exit", 63, 8, id="exit_m1_east", to="map_mountain_mine", via="trail", lock="guardian")
    L.add("exit", 36, 0, id="exit_m1_north", to="map_mountain_pass", via="trail")
    L.add("group", 58, 8, id="g_m1_elite", cls="elite", enemy="enemy_ore_golem")
    L.foes("m1", [(12, 26, "enemy_rock_beetle"), (22, 32, "enemy_lava_newt"), (34, 28, "enemy_snow_goat"), (46, 33, "enemy_rock_beetle"),
                  (30, 18, "enemy_cliff_hawk"), (40, 20, "enemy_lava_newt"), (50, 15, "enemy_snow_goat"), (20, 15, "enemy_rock_beetle"),
                  (38, 6, "enemy_cliff_hawk"), (50, 5, "enemy_rock_beetle"), (24, 15, "enemy_snow_goat", {"sleep": True})])
    L.add("chest", 5, 6, id="chest_m1_ledge", type="silver")
    L.add("chest", 56, 28, id="chest_m1_hidden", type="hidden")
    L.add("chest", 56, 15, id="chest_m1_terrace", type="wood")
    L.add("chest", 34, 32, id="chest_m1_camp", type="wood")
    L.add("gate", 11, 8, id="gate_m1_metal", element="METAL")
    L.add("spring", 8, 24, id="spring_m1")
    L.add("npc", 16, 30, id="npc_m1_miner")
    L.add("lore", 40, 5, id="lore_m1")
    L.add("ore", 28, 26, id="ore_m1_a")
    L.add("ore", 48, 18, id="ore_m1_b")
    L.add("landmark", 4, 15, w=3, h=3, what="an abandoned miners' cabin with an old mine cart", sprite="prop_adv_mountain_cabin")
    L.add("crystal", 46, 33)
    return L


def m5() -> Layout:
    L = Layout("map_mountain_mine", "M5", "Mỏ Quặng Bỏ Hoang", "zone_mountain", 64, 36,
               "an abandoned ore mine inside the mountain: rock chambers joined by timbered tunnels, a lava channel, a hot spring", 40, seed=83, min_walk=0.3)
    L.rect(0, 0, 63, 35, "#")
    for b in [(10, 10, 7, 5), (30, 8, 8, 5), (28, 24, 9, 6), (50, 12, 7, 5), (52, 26, 8, 5), (10, 27, 6, 4)]:
        L.blob(*b, ".", rough=0.2)
    L.line([(19, 31), (40, 30)], 2, "~")
    L.blob(10, 28, 2.5, 1.5, "~")
    for pts in [[(0, 10), (10, 10)], [(10, 10), (22, 8), (30, 8)], [(30, 8), (44, 10), (50, 12)], [(10, 10), (14, 18), (22, 22)],
                [(28, 24), (44, 26), (52, 26)], [(50, 12), (52, 20), (52, 26)], [(56, 23), (63, 20)], [(30, 8), (30, 18)],
                [(32, 28), (34, 35)], [(22, 26), (17, 28)]]:
        L.line(pts, 2)
    L.rect(57, 4, 61, 8, ".")
    L.line([(55, 10), (57, 8)], 1)
    L.rect(39, 15, 43, 18, ".")
    L.line([(41, 10), (41, 15)], 1)
    L.cover(37, 14, 44, 19, "a collapsed rock ceiling over a hidden side tunnel")
    L.blob(48, 30, 2, 1.2, "c")
    L.add("spawn", 2, 10)
    L.add("portal", 8, 13)
    L.add("exit", 0, 10, id="exit_m2_west", to="map_mountain_foot", via="tunnel")
    L.add("exit", 63, 20, id="exit_m2_east", to="map_mountain_peak", via="tunnel", lock="guardian")
    L.add("exit", 34, 35, id="exit_m2_south", to="map_mountain_tunnels", via="tunnel", note="walking this way opens the shortcut back from N5")
    L.add("group", 60, 21, id="g_m2_elite", cls="elite", enemy="enemy_thunder_ram")
    L.foes("m2", [(12, 7, "enemy_rock_beetle"), (26, 6, "enemy_cliff_hawk"), (34, 10, "enemy_lava_newt", {"sleep": True}), (24, 22, "enemy_ore_golem"),
                  (32, 27, "enemy_rock_beetle"), (46, 26, "enemy_lava_newt"), (50, 15, "enemy_snow_goat"), (54, 29, "enemy_rock_beetle"),
                  (14, 25, "enemy_lava_newt"), (46, 10, "enemy_cliff_hawk"), (58, 26, "enemy_ore_golem")])
    L.add("chest", 11, 30, id="chest_m2_flooded", type="silver")
    L.add("chest", 59, 6, id="chest_m2_niche", type="wood")
    L.add("chest", 42, 16, id="chest_m2_hidden", type="hidden")
    L.add("chest", 22, 27, id="chest_m2_hall", type="wood")
    L.add("gate", 17, 28, id="gate_m2_lightning", element="LIGHTNING")
    L.add("gate", 56, 9, id="gate_m2_water", element="WATER")
    L.add("spring", 50, 10, id="spring_m2", note="hot spring")
    L.add("lore", 8, 7, id="lore_m2")
    L.add("ore", 30, 12, id="ore_m2_a")
    L.add("ore", 56, 24, id="ore_m2_b")
    L.add("landmark", 25, 19, w=3, h=3, what="an old mine lift tower with a big pulley wheel", sprite="prop_adv_mountain_cart")
    L.add("crystal", 36, 27)
    L.add("crystal", 48, 30)
    return L


def m6() -> Layout:
    L = Layout("map_mountain_peak", "M6", "Đỉnh Dung Nham", "zone_mountain", 48, 27,
               "the lava peak: a ring path around a lava lake with an island, the Magma Drake waits on a raised terrace to the east", 50, seed=97)
    L.border(2, 3)
    L.blob(20, 14, 8, 5, "~")
    L.blob(20, 14, 2.5, 1.5, ".", rough=0.1)
    L.plateau(36, 5, 45, 21)
    L.steps(40, 41, 20, 21)
    L.line([(0, 13), (8, 13), (10, 6), (30, 6), (34, 10), (37, 12)], 2)
    L.line([(8, 13), (10, 21), (30, 22), (40, 23)], 2)
    L.line([(20, 6), (20, 12)], 2)
    L.line([(14, 6), (14, 0)], 2)
    L.line([(44, 13), (47, 13)], 2)
    L.rect(3, 21, 7, 23, ".")
    L.line([(10, 21), (6, 22)], 1)
    L.cover(2, 20, 8, 24, "a black rock overhang over a hidden lava cave")
    L.blob(30, 3, 2.5, 1, "c")
    L.add("spawn", 2, 13)
    L.add("exit", 0, 13, id="exit_m3_west", to="map_mountain_mine", via="trail")
    L.add("exit", 14, 0, id="exit_m3_north", to="map_mountain_pass", via="trail", note="walking this way opens the shortcut back from N4")
    L.add("exit", 47, 13, id="exit_m3_next", to="map_ruins_gate", via="trail", lock="guardian")
    L.add("group", 41, 12, id="g_m3_boss", cls="boss", enemy="enemy_magma_drake")
    L.foes("m3", [(6, 8, "enemy_lava_newt"), (17, 4, "enemy_cliff_hawk"), (28, 4, "enemy_rock_beetle"), (14, 22, "enemy_lava_newt"),
                  (24, 23, "enemy_ore_golem"), (4, 17, "enemy_rock_beetle"), (32, 20, "enemy_lava_newt"), (12, 18, "enemy_snow_goat", {"sleep": True})])
    L.add("chest", 21, 14, id="chest_m3_island", type="wood")
    L.add("chest", 4, 22, id="chest_m3_hidden", type="hidden")
    L.add("chest", 44, 18, id="chest_m3_boss", type="gold")
    L.add("gate", 20, 8, id="gate_m3_boulder", element="EARTH")
    L.add("spring", 34, 23, id="spring_m3", note="before the steps to the boss")
    L.add("npc", 43, 7, id="npc_m3_shrine", note="FIRE Guardian shrine")
    L.add("lore", 26, 22, id="lore_m3")
    L.add("landmark", 4, 3, w=3, h=2, what="a huge ancient dragon skull half sunk into the rock", sprite="prop_adv_mountain_boulder")
    L.add("crystal", 30, 3)
    return L


def n4() -> Layout:
    L = Layout("map_mountain_pass", "N4", "Đèo Gió", "zone_mountain", 72, 40,
               "a windy high pass: two rocky shelves on either side of a lava gorge crossed by rope bridges; a carved eagle in the cliff", 35, seed=103)
    L.border(2, 4)
    L.plateau(4, 4, 30, 16)
    L.plateau(40, 5, 68, 18)
    L.line([(36, 0), (35, 14), (38, 24), (46, 32), (50, 39)], 3, "~")
    L.steps(14, 15, 15, 16)
    L.steps(60, 61, 17, 18)
    L.blob(8, 24, 5, 3, "#")
    L.blob(64, 24, 5, 4, "#")
    L.line([(20, 39), (20, 30), (28, 26), (44, 26), (56, 28), (71, 30)], 2)
    L.line([(20, 30), (14, 22), (14, 18)], 2)
    L.line([(14, 13), (20, 8), (30, 8), (40, 10)], 2)
    L.line([(40, 10), (50, 8), (50, 0)], 2)
    L.line([(60, 16), (60, 28)], 2)
    L.rect(5, 22, 9, 25, ".")
    L.line([(14, 22), (9, 24)], 1)
    L.cover(4, 21, 12, 26, "an overhang of the cliff over a hidden cave")
    L.rect(63, 22, 68, 26, ".")
    L.rect(60, 24, 62, 24, ",")
    L.blob(30, 35, 2.5, 1.5, "c")
    L.add("spawn", 20, 37)
    L.add("portal", 24, 36)
    L.add("exit", 20, 39, id="exit_n4_south", to="map_mountain_foot", via="trail")
    L.add("exit", 71, 30, id="exit_n4_east", to="map_mountain_peak", via="trail", lock="shortcut", note="opens after coming up from M6")
    L.add("exit", 50, 0, id="exit_n4_north", to="map_ruins_gate", via="trail", note="closed until the ruins zone opens")
    L.add("group", 62, 10, id="g_n4_boss", cls="subboss", enemy="enemy_thunder_ram")
    L.add("group", 66, 25, id="g_n4_elite", cls="elite", enemy="enemy_ore_golem")
    L.add("group", 10, 8, id="g_n4_special", cls="special", when="night", enemy="enemy_cliff_hawk")
    L.foes("n4", [(24, 34, "enemy_rock_beetle", {"sleep": True}), (30, 28, "enemy_lava_newt"), (48, 30, "enemy_snow_goat"), (54, 24, "enemy_cliff_hawk"),
                  (66, 32, "enemy_rock_beetle"), (12, 32, "enemy_lava_newt", {"cls": "mutant"}), (20, 11, "enemy_snow_goat"), (26, 6, "enemy_cliff_hawk"),
                  (44, 12, "enemy_rock_beetle"), (52, 14, "enemy_lava_newt", {"sleep": True}), (46, 8, "enemy_ore_golem"), (58, 35, "enemy_snow_goat"),
                  (16, 21, "enemy_rock_beetle")])
    L.add("chest", 66, 8, id="chest_n4_shelf", type="gold")
    L.add("chest", 67, 23, id="chest_n4_nook", type="silver")
    L.add("chest", 6, 23, id="chest_n4_hidden", type="hidden")
    L.add("chest", 30, 36, id="chest_n4_mimic", type="mimic")
    L.add("chest", 6, 7, id="chest_n4_ledge", type="wood")
    L.add("gate", 62, 24, id="gate_n4_lightning", element="LIGHTNING", note="opens when both crystal rods are charged")
    L.add("puzzle", 56, 25, id="puzzle_n4_rod_a", element="LIGHTNING")
    L.add("puzzle", 52, 31, id="puzzle_n4_rod_b", element="LIGHTNING")
    L.add("spring", 56, 12, id="spring_n4", note="before the sub-boss on the east shelf")
    L.add("lore", 22, 6, id="lore_n4")
    L.add("ore", 40, 30, id="ore_n4_a")
    L.add("ore", 51, 35, id="ore_n4_b")
    L.add("landmark", 25, 19, w=3, h=3, what="a giant stone eagle carved into the cliff wall", sprite="prop_adv_mountain_boulder")
    L.add("crystal", 30, 35)
    return L


def n5() -> Layout:
    L = Layout("map_mountain_tunnels", "N5", "Đường Hầm Cổ", "zone_mountain", 72, 40,
               "ancient tunnels under the mountain that link the forest, the mine and the ruins: crystal caverns, a lava pool, a buried rune door", 45, seed=109, min_walk=0.3)
    L.rect(0, 0, 71, 39, "#")
    for b in [(10, 20, 7, 6), (28, 10, 8, 6), (30, 31, 9, 6), (50, 18, 9, 7), (63, 32, 6, 4), (60, 8, 6, 4)]:
        L.blob(*b, ".", rough=0.2)
    L.blob(50, 21, 3, 2, "~")
    for pts in [[(0, 20), (10, 20)], [(10, 20), (20, 12), (28, 10)], [(10, 20), (20, 28), (30, 30)], [(28, 10), (36, 4), (36, 0)],
                [(28, 10), (42, 14), (50, 16)], [(30, 30), (44, 28), (50, 24)], [(52, 16), (60, 9)], [(54, 24), (63, 31)], [(58, 22), (71, 24)]]:
        L.line(pts, 2)
    L.cover(54, 3, 67, 13, "a crystal-studded rock ceiling over a hidden grotto")
    L.blob(24, 10, 2, 1.2, "c")
    L.blob(54, 23, 2, 1.2, "c")
    L.add("spawn", 2, 20)
    L.add("portal", 6, 23)
    L.add("exit", 0, 20, id="exit_n5_west", to="map_forest_deep", via="tunnel")
    L.add("exit", 36, 0, id="exit_n5_north", to="map_mountain_mine", via="tunnel", lock="shortcut", note="opens after coming down from M5")
    L.add("exit", 71, 24, id="exit_n5_east", to="map_ruins_hall", via="tunnel", note="closed until the ruins zone opens")
    L.add("group", 52, 15, id="g_n5_boss", cls="subboss", enemy="enemy_ore_golem")
    L.add("group", 35, 31, id="g_n5_elite", cls="elite", enemy="enemy_thunder_ram")
    L.add("group", 8, 17, id="g_n5_special", cls="special", when="night", enemy="enemy_rune_wisp")
    L.foes("n5", [(13, 23, "enemy_rock_beetle"), (22, 13, "enemy_lava_newt"), (30, 7, "enemy_cliff_hawk", {"sleep": True}), (44, 14, "enemy_rock_beetle"),
                  (46, 21, "enemy_lava_newt", {"cls": "mutant"}), (56, 24, "enemy_ore_golem"), (27, 31, "enemy_rock_beetle"), (64, 34, "enemy_lava_newt"),
                  (37, 5, "enemy_snow_goat"), (32, 13, "enemy_rock_beetle"), (24, 29, "enemy_lava_newt"), (66, 24, "enemy_cliff_hawk")])
    L.add("chest", 56, 14, id="chest_n5_cavern", type="gold")
    L.add("chest", 62, 7, id="chest_n5_grotto", type="hidden")
    L.add("chest", 31, 34, id="chest_n5_hall", type="silver")
    L.add("chest", 66, 33, id="chest_n5_mimic", type="mimic")
    L.add("chest", 7, 23, id="chest_n5_entry", type="wood")
    L.add("gate", 20, 28, id="gate_n5_earth", element="EARTH")
    L.add("gate", 59, 28, id="gate_n5_metal", element="METAL", note="opens when the gear lock turns")
    L.add("puzzle", 46, 28, id="puzzle_n5_gear", element="METAL")
    L.add("spring", 44, 16, id="spring_n5", note="before the sub-boss cavern")
    L.add("lore", 14, 18, id="lore_n5")
    L.add("ore", 32, 12, id="ore_n5_a")
    L.add("ore", 48, 26, id="ore_n5_b")
    L.add("landmark", 46, 18, w=3, h=3, what="a giant ancient stone door half buried in the cavern wall, carved with runes", sprite="prop_adv_ruins_wall")
    for x, y in [(24, 10), (54, 23), (64, 9)]:
        L.add("crystal", x, y)
    return L


LAYOUTS = [m4, m5, m6, n4, n5]
